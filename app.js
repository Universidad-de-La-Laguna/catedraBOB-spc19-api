'use strict'

var path = require('path')
var cors = require("cors")

var oas3Tools = require('oas3-tools')

// swaggerRouter configuration
var options = {
    controllers: path.join(__dirname, './controllers')
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options)
expressAppConfig.addValidator()
var app = expressAppConfig.getApp()
app.use(cors())

// Export app and not create server for enable tests.
// Server created in index.js
module.exports = app