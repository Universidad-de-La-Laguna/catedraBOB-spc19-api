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
const despliegueInicialPromise = require('./scripts/despliegue-inicial')

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

// Initialize promises array to initialize app
const oasToolsInitializePromiseArray = [ oasToolsInitializePromise(oasDoc, app) ]

// Deploy contract if not exists
if (config.businessParams.nodeRole === 'taker') {
    if (config.contracts.spc19ContractAddress) {
        console.log(`Using SPC19 general contract: ${config.contracts.spc19ContractAddress}`)
    }
    else {
        // Deploy spc19 general contract in this node (taker) and insurer
        console.warn("This service dont have SPC19 general contract configured. Lets proceed to delegate one!")
        oasToolsInitializePromiseArray.push( despliegueInicialPromise.deployGeneralContracts(config.orion.taker.publicKey, config.orion.insurer.publicKey, config.besu.thisnode.privateKey) )
    }
}

// Export app and not create server for enable tests.
module.exports = app
module.exports.appPromise = Promise.all(oasToolsInitializePromiseArray)