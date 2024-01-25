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
        if (request.headers.get('content-type') !== 'application/json') {
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
    expect(() => new OkargoServer({ configuration: { token: null, platforms: null } })).toThrow(ConfigurationErrorException);
    expect(() => new OkargoServer({ configuration: { token: 'asdsadas', platforms: null } })).toThrow(ConfigurationErrorException);
    expect(() => new OkargoServer({ configuration: { token: null, platforms: [] } })).toThrow(ConfigurationErrorException);
    expect(() => new OkargoServer({ configuration: { token: 'dsadasdas', platforms: [] } })).not.toThrow(ConfigurationErrorException);
});

// test('[Task] Main task returns exception if invalid token', async () => {
//     const server = new OkargoServer({ configuration: { token: 'TOKEN1', platforms: [] }, serverUri: 'http://localhost:9999/api/Export/v2/GetOnlineCarrierOffers' });
//     await expect(run(server)).rejects.toBeInstanceOf(InvalidTokenException);
// });

test('[Task] Main task works', async () => {
    const server = new OkargoServer({ configuration: { token: 'TOKEN', platforms: [] }, serverUri: 'http://localhost:9999/api/Export/v2/GetOnlineCarrierOffers', uuidv4, now: () => 101010 });
    const response = await run(server);
    expect(response).toEqual(EXPECTED_RESPONSE);
});

async function run(server) {
    return server.run({
        sourcePort: { id: 'JFK' },
        destinationPort: { id: 'CDG' },
        products: [{ type: '20\' Dry', quantity: 1, dangerous: false }],
        dateBegin: '2024-01-25',
    });
}
