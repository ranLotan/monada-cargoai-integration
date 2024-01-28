const _ = require('lodash');
const axios = require('axios');
const _uuidv4 = require('uuid').v4;
const OKARGO_PLATFORMS = require('./OKARGO_PLATFORMS.json');

function ConfigurationErrorException() {}
function InvalidTokenException() {}
function TooManyRequestsException() {}

function Server({ configuration = {}, serverUri = 'https://air-cargo-schedule-and-rate.p.rapidapi.com/search', uuidv4 = _uuidv4, now = () => new Date().getTime() } = {}) {    
    const { key, user, additionalConfig } = configuration;
    if (!key || !user) {
        throw new ConfigurationErrorException();
    }
    const Host = 'air-cargo-schedule-and-rate.p.rapidapi.com';

    async function run({ sourcePort, destinationPort, products, dateBegin }) {
        let result = null;
        try {
            result = await Promise.all(_.flatten(products.map(async (product) => {
                const result = await axios.post(serverUri, {
                    origin: { code: sourcePort.id },
                    destination: { code: destinationPort.id },
                    departureDate: new Date(dateBegin).toISOString(),
                    offset: additionalConfig?.offset ?? 5,
                    shipment: product,
                    user: user,
                    filters: additionalConfig?.filters ?? { withRateOnly: true, liveRequest: true },
                    timeout: additionalConfig?.timeout ?? 25
                }, {
                    headers: { 'X-RapidAPI-Key': key,
                               'X-RapidAPI-Host': Host }
                })
                // return result.data.flights; 
                return ((result.data || {}).flights || []).map(flight => ({ product, ...flight }));
            })));
        } catch (e) {
            console.log(e);
            if (e.response.status === 429) {
                throw new TooManyRequestsException();
            } else if (e.response.status === 401) {
                throw new InvalidTokenException();
            } else {
                throw e;
            }
        }

        const offers = _.flatten(result);
        const ret = offers.map(flight => {
            const productId = uuidv4();
            const departureTime = new Date(flight.departureTime);
            const arrivalTime = new Date(flight.arrivalTime);
            const hoursDifference = (arrivalTime - departureTime) / parseFloat(60 * 60 * 1000);
            const quotValidity = new Date(flight.latestAcceptanceTime) // *is correct property?
            const legs = flight.legs.slice(0,-1);
            const transShipments = legs.length === 0 ? null : legs.map(leg => leg.arrivalAirport).join(', ');
            const availability = flight.available && flight.features.bookable;            
            const freightCharges = flight.rates[0].charges.map(rate => ({
                id: uuidv4(),
                title: rate.code,
                type: rate.type,
                sectionTitle: 'Freight',
                values: {
                    [productId]: { value: rate.rate || 0, currency: flight.rates[0].currency || 'USD' }
                }
            }));
            const chagesOrigin = flight.rates[0].ocdc.map(rate => ({
                id: uuidv4(),
                title: rate.code,
                type: rate.type,
                sectionTitle: 'Origin', 
                values: {
                    [productId]: { value: rate.rate || 0, currency: flight.rates[0].currency || 'USD' }
                }

            }));

            const fieldsGrouped = _.groupBy(_.flatten([ freightCharges, chagesOrigin]), f => f.sectionTitle);
            const sections = _(fieldsGrouped).mapValues(v => ({ id: uuidv4(), title: v[0].sectionTitle, offers: [{ id: uuidv4(), fields: v.map(vv => _.pick(vv, ['id', 'title', 'type', 'values' ])) }] })).values().value();

            return {
                id: `cargoai-${flight.flightUID}`,
                created: now(),
                transportationMethod: 'air',
                source: sourcePort,
                destination: destinationPort,
                supplier: {                      
                    uniqueId: flight.airlineCode,
                },
                attributes: {
                    cargoaiOffer: Object.fromEntries(Object.entries(flight).filter(([key]) => key !== 'product')),  //remove added prooduct
                },
                product: {              
                    id: productId,
                    ...flight.product
                },
                offer: {
                    validFrom: now(),
                    validUntil: `${quotValidity.getFullYear()}-${quotValidity.getMonth() + 1}-${quotValidity.getDate()}`, // cargoai response property missing
                    transitTime: hoursDifference || 0,
                    transitDates: [{
                        etd: flight.departureTime.replace(/T\d\d:\d\d:\d\d[-,+]\d\d:\d\d/, ''),
                        eta: flight.arrivalTime.replace(/T\d\d:\d\d:\d\d[-,+]\d\d:\d\d/, ''),
                    }],
                    availability: availability === null ? null : {
                        available: availability,
                        count: 0
                    },
                    transShipment: transShipments,
                    sections
                }
            }   
        });

        return ret;
    }

    this.run = run;
}

module.exports = { Server, ConfigurationErrorException, InvalidTokenException, TooManyRequestsException };
