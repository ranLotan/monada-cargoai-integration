const { setupServer } = require('msw/node');
const { http, HttpResponse } = require('msw');
const { Server: OkargoServer, ConfigurationErrorException, InvalidTokenException } = require('../src/server/index.js');
const OKARGO_RESPONSE = require('./OKARGO_RESPONSE.json');
const CARGOAI_RESPONSE = require('./CARGOAI_RESPONSE.json');
const EXPECTED_RESPONSE = require('./EXPECTED_RESPONSE.json');

let id = 100;
function uuidv4() { return '' + id++ };

const server = setupServer(...[
    http.post('http://localhost:9999/api/Export/v2/GetOnlineCarrierOffers', ({ request }) => {
        if (request.headers.get('X-RapidAPI-Key') !== 'KEY') {
            return HttpResponse.json({}, { status: 401 });
        }
        return HttpResponse.json(CARGOAI_RESPONSE);
    })
]);

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('[Constructor] Throws error on bad configuration, success on good parameters', () => {
    expect(() => new OkargoServer()).toThrow(ConfigurationErrorException);
    expect(() => new OkargoServer({ configuration: {} })).toThrow(ConfigurationErrorException);
    expect(() => new OkargoServer({ configuration: { key: null, user: null } })).toThrow(ConfigurationErrorException);
    expect(() => new OkargoServer({ configuration: { key: 'asdsadas', user: null } })).toThrow(ConfigurationErrorException);
    expect(() => new OkargoServer({ configuration: { key : null, user: {} } })).toThrow(ConfigurationErrorException);
    expect(() => new OkargoServer({ configuration: { key: 'dsadasdas', user: {} } })).not.toThrow(ConfigurationErrorException);
});

// test('[Task] Main task returns exception if invalid token', async () => {
//     const server = new OkargoServer({ configuration: { token: 'TOKEN1', platforms: [] }, serverUri: 'http://localhost:9999/api/Export/v2/GetOnlineCarrierOffers' });
//     await expect(run(server)).rejects.toBeInstanceOf(InvalidTokenException);
// });

test('[Task] Main task works', async () => {
    const server = new OkargoServer({ configuration: { key: 'KEY', user: USER }, serverUri: 'http://localhost:9999/api/Export/v2/GetOnlineCarrierOffers', uuidv4, now: () => 101010 });
    const response = await run(server);
    expect(response).toEqual(EXPECTED_RESPONSE);
});

async function run(server) {
    return server.run({
        sourcePort: { id: 'JFK' },
        destinationPort: { id: 'CDG' },
        // cargo ai test shipment data
        products: [{ product: 'GCR', pieces: 1, weight: 100, chargeableWeight: 167, volume: 1,
                     dimensions: [ { pieces: 1, length: 100, width: 100, height: 100, weight: 100, stackable: true, 
                                     tiltable: false, toploadable: true, weightType: 'PER_ITEM', loadType: 'DIMENSIONS' }]
                  }],
        dateBegin: '2024-01-25',
    });
}

const USER = {
    country: 'US',
    cass: '0000',
    iata: '0000000'
}