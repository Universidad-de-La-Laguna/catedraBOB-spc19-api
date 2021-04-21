'use strict'

const app = require('./app')
const appPromise = require('./app').appPromise
var config = require('./config')
const despliegueInicialPromise = require('./scripts/despliegue-inicial')
const { logger } = require("./utils/logger");

const port = parseInt(process.env.PORT, 10) || 8080

// Establecemos valor por defecto de variable spc19ContractAddress
config.spc19ContractAddress.set(process.env.SPC19CONTRACTADDRESS)

if (config.spc19ContractAddress.value()) {
    logger.info(`Using SPC19CONTRACTADDRESS=${config.spc19ContractAddress.value()}`)
}

appPromise
.then( async () => {
    // Deploy contract if not exists
    if (config.businessParams.nodeRole === 'taker' && (typeof config.spc19ContractAddress.value() === 'undefined' )) {
        // Deploy spc19 general contract in this node (taker) and insurer
        logger.info("This service dont have SPC19 general contract configured. Lets proceed to delegate one!")
        config.spc19ContractAddress.set(await despliegueInicialPromise.deployGeneralContracts(config.orion.taker.publicKey, config.orion.insurer.publicKey, config.besu.thisnode.privateKey))
        logger.warn(`¡¡¡ IMPORTANT !!!: In next executions, set environment variable SPC19CONTRACTADDRESS=${config.spc19ContractAddress.value()}`)
    }

    // Express listen
    app.listen(port, () => logger.info(`Live at ${port}`))
})