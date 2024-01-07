const _ = require('lodash');
const axios = require('axios');
const OKARGO_PLATFORMS = require('./OKARGO_PLATFORMS.json');

function ConfigurationErrorException() {}
function InvalidTokenException() {}

function Server({ configuration = {}, serverUri = 'https://app.okargo.com/api/Export/v2/GetOnlineCarrierOffers' } = {}) {
    const { token, platforms } = configuration;

    if (!token || !platforms) {
        throw new ConfigurationErrorException();
    }

    async function run({ sourcePort, destinationPort, products, dateBegin, dateEnd, platform }) {
        let result = null;

        try {
            result = await Promise.all(_.flatten(products.map(async (product) => {
                const result = await axios.post(serverUri, {
                    ...CONVERT_PRODUCT_TYPE[product.type],
                    chargeCriterias: null, //see Criteria
                    origin: { code: sourcePort.id },
                    destination: { code: destinationPort.id },
                    dateBegin: new Date(dateBegin).toISOString(),
                    dateEnd: new Date(new Date(dateEnd).setUTCHours(0, 0, 0, 0)).toISOString(),
                    ratesFetcher: OKARGO_PLATFORMS[platform].code,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                return ((result.data || {}).carrierOffers || []).map(offer => ({ product, ...offer }));
            })));
        } catch (e) {
            if (e.response.status === 429) {
                throw new Error('too-many-requests');
            } else if (e.response.status === 401) {
                throw new InvalidTokenException();
            } else {
                throw e;
            }
        }

        const offers = _.flatten(result);

        // Create monada rate structure from return values
        const ret = _.flatten(offers.map(({ product, carrier, offers }) => offers.map(offer => {
            const dateBegin = new Date(offer.chargeSet.dateBegin);
            const quotValidity = new Date(offer.chargeSet.quotValidity);
            const charges = _.filter(offer.chargeSet.charges, charge => charge.chargeType !== 'Source' || charge.type !== 'Incl');

            const fields = charges.map(charge => ({ 
                id: `${charge.application}-${charge.chargeNameId}`,
                title: charge.chargeName, 
                type: 'number', 
                postfix: '[currency]', 
                sectionType: 'general', 
                linkType: charge.unit === 'Specific' ? 'peritem' : 'flat', 
                sectionTitle: charge.application, 
                val: charge.amount || 0, currency: 
                charge.currency || 'USD', variables: [] 
            }));

            const fieldsGrouped = _.groupBy(fields, f => f.sectionTitle);

            const sections = _(fieldsGrouped).mapValues(v => ({ title: v[0].sectionTitle, type: v[0].sectionType, defaultCurrency: v[0].currency, fields: v.map(vv => _.pick(vv, ['id', 'title', 'type', 'postfix', 'variables', 'linkType' ])) })).values().value();

            const values = _(fieldsGrouped).mapValues(v => {
                if (v[0].sectionType === 'peritem') return [ v.map(vv => _.pick(vv, ['val', 'currency'])) ];
                return v.map(vv => _.pick(vv, ['val', 'currency']));
            }).values().value();

            return {
                id: `okargo-${offer.chargeSet.chargeSetId}`,
                transportationMethod: 'sea',
                source: sourcePort,
                destination: destinationPort,
                supplier: {
                    organization: carrier.name,
                    uniqueId: carrier.code,
                },
                attributes: {
                    okargoOffer: offer,
                },
                product: product.type,
                validFrom: `${dateBegin.getFullYear()}-${dateBegin.getMonth() + 1}-${dateBegin.getDate()}`,
                dangerous: product.dangerous,
                form: { title: 'Okargo Import', type: 'supplier', transportationMethods: ['air'], sections },
                values: {
                    validUntil: `${quotValidity.getFullYear()}-${quotValidity.getMonth() + 1}-${quotValidity.getDate()}`,
                    transitTime: offer.chargeSet.transitTime || 0,
                    sections: values,
                }
            }
        })));

        return ret;
    }

    this.run = run;
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

module.exports =  { Server, ConfigurationErrorException, InvalidTokenException };
