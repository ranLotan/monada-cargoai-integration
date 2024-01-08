const server = require('./server.js');
const OKARGO_PLATFORMS = require('./OKARGO_PLATFORMS.json');

module.exports = { ...server, OKARGO_PLATFORMS };
