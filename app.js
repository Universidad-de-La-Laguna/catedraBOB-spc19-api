'use strict'

var path = require('path')
const util = require('util')
var cors = require("cors")
var oasTools = require('oas-tools')
const bodyParser = require('body-parser')

var express = require('express')
var app = express()

app.use(bodyParser.json({
    strict: true
}))

app.use(cors())

var jsyaml = require('js-yaml')
var fs = require('fs')
var spec = fs.readFileSync(path.join(__dirname, 'api/openapi.yaml'), 'utf8')
var oasDoc = jsyaml.safeLoad(spec)

var config = require('./config')

var options_object = {
    controllers: path.join(__dirname, './controllers'),
    checkControllers: true,
    loglevel: 'error',
    strict: true, // stop in error validations
    router: true,
    validator: true,
    docs: {
      apiDocs: '/api-docs',
      apiDocsPrefix: '',
      swaggerUi: '/docs',
      swaggerUiPrefix: ''
    },
    oasSecurity: true,
    securityFile: {
        Bearer: {
            issuer: config.JWT.issuer,
            algorithms: ['HS256'],
            key: config.JWT.secretKey
        }
    },
    oasAuth: true, // grants in openapi spec file
    ignoreUnknownFormats: true
}

oasTools.configure(options_object)
const oasToolsInitializePromise = util.promisify(oasTools.initialize)

// Export app and not create server for enable tests.
module.exports = app
module.exports.appPromise = oasToolsInitializePromise(oasDoc, app)