const _ = require('lodash');
const axios = require('axios');
const _uuidv4 = require('uuid').v4;
const OKARGO_PLATFORMS = require('./OKARGO_PLATFORMS.json');

function ConfigurationErrorException() {}
function InvalidTokenException() {}
function TooManyRequestsException() {}

function Server({ configuration = {}, serverUri = 'https://air-cargo-schedule-and-rate.p.rapidapi.com/search', uuidv4 = _uuidv4, now = () => new Date().getTime() } = {}) {
    var { token, platforms } = configuration;
    
    if (!token || !platforms) {
        throw new ConfigurationErrorException();
    }
    const authorizationTest = `Bearer ${token}`;
    token = {
        Key: 'fb68d5845cmshc1bcbe9907d2316p1c303ejsn2c98467908b5',
        Host: 'air-cargo-schedule-and-rate.p.rapidapi.com'
    }

    async function run({ sourcePort, destinationPort, products, dateBegin }) {
        let result = null;
        

        try {
            result = await Promise.all(_.flatten(products.map(async (product) => {
                const result = await axios.post(serverUri, {
                    origin: { code: sourcePort.id },
                    destination: { code: destinationPort.id },
                    departureDate: new Date(dateBegin).toISOString(),
                    offset: 5,
                    shipment: SHIPMENT,
                    user: USER,
                    filters: { withRateOnly: true, liveRequest: true },
                    timeout: 25
                }, {
                    headers: { 'content-type': 'application/json',
                               'X-RapidAPI-Key': token.key ,
                               'X-RapidAPI-Host': token.Host }
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
            const transShipments = legs.length == 0 ? "" : legs.map(leg => leg.arrivalAirport).join(", ");
            // const transShipments = legs.length == 1 ? "" : legs.map(leg => leg.arrivalAirport).join(", ");
            const availability = flight.available && flight.features.bookable;
            
            // const rates = flight.rates.map(rate => ({ ...rate.ocdc, ...rate.charges}));
            const freightCharges = flight.rates[0].charges.map(rate => ({
                id: uuidv4(),
                title: rate.code,
                type: rate.type,
                sectionTitle: "Freight",
                values: {
                    [productId]: { value: rate.rate || 0, currency: flight.rates[0].currency || 'USD' }
                }

            }));
            const chagesOrigin = flight.rates[0].ocdc.map(rate => ({
                id: uuidv4(),
                title: rate.code,
                type: rate.type,
                sectionTitle: "Origin", 
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
                // supplier: {                      ***no carrier in air transport***
                //     organization: carrier.name,
                //     uniqueId: carrier.code,
                // },
                attributes: {
                    cargoaiOffer: Object.fromEntries(Object.entries(flight).filter(([key]) => key !== 'product')),  //remove added prooduct
                },
                product: {              
                    id: productId,
                    type: flight.product.type,
                    dangerous: flight.product.dangerous,
                    quantity: 1,
                },
                offer: {
                    validFrom: "",  // cargoai response property missing
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

// cargo ai test shipment data
const SHIPMENT = {
    product: 'GCR',
    pieces: 1,
    weight: 100,
    chargeableWeight: 167,
    volume: 1,
    dimensions: [
        {
        pieces: 1,
        length: 100,
        width: 100,
        height: 100,
        weight: 100,
        stackable: true,
        tiltable: false,
        toploadable: true,
        weightType: 'PER_ITEM',
        loadType: 'DIMENSIONS'
        }
    ]
}  

const USER = {
    country: 'US',
    cass: '0000',
    iata: '0000000'
}
// Consts needed to convert from Monada types to OKargo types
const CONVERT_PRODUCT_TYPE = {
    '20\' Dry': { containerType: 'Dry', sizeTypes: [ { sizeTypeId: 1, name: '20DRY' } ] },
    '20\' Flat': { containerType: 'Fl', sizeTypes: [ { sizeTypeId: 11, name: '20FL' } ] },
    '20\' Open Top': { containerType: 'Ot', sizeTypes: [ { sizeTypeId: 9, name: '20OT' } ] },
    '20\' Reefer': { containerType: 'Rf', sizeTypes: [ { sizeTypeId: 4, name: '20RF' } ] },
    '40\' Dry': { containerType: 'Dry', sizeTypes: [ { sizeTypeId: 2, name: '40DRY' } ] },
    '40\' Flat': { containerType: 'Fl', sizeTypes: [ { sizeTypeId: 12, name: '40FL' } ] },
    '40\' Open Top': { containerType: 'Ot', sizeTypes: [ { sizeTypeId: 10, name: '40OT' } ] },
    '40\' HC Dry': { containerType: 'Dry', sizeTypes: [ { sizeTypeId: 3, name: '40HC' } ] },
    '40\' HC Flat': { containerType: 'Fl', sizeTypes: [ { sizeTypeId: 15, name: '40HF' } ] },
    '40\' HC Open Top': { containerType: 'Ot', sizeTypes: [ { sizeTypeId: 14, name: '40HO' } ] },
    '40\' HC Reefer': { containerType: 'Rf', sizeTypes: [ { sizeTypeId: 6, name: '40RF' } ] },
}

module.exports = { Server, ConfigurationErrorException, InvalidTokenException, TooManyRequestsException };
