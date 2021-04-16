'use strict'

const app = require('./app')
const appPromise = require('./app').appPromise
var config = require('./config')
const despliegueInicialPromise = require('./scripts/despliegue-inicial')

const port = parseInt(process.env.PORT, 10) || 8080

// Establecemos valor por defecto de variable spc19ContractAddress
config.spc19ContractAddress.set(process.env.SPC19CONTRACTADDRESS)

if (config.spc19ContractAddress.value()) {
    console.log(`Using SPC19CONTRACTADDRESS=${config.spc19ContractAddress.value()}`)
}

appPromise
.then( async () => {
    // Deploy contract if not exists
    if (config.businessParams.nodeRole === 'taker' && (typeof config.spc19ContractAddress.value() === 'undefined' )) {
        // Deploy spc19 general contract in this node (taker) and insurer
        console.log("This service dont have SPC19 general contract configured. Lets proceed to delegate one!")
        config.spc19ContractAddress.set(await despliegueInicialPromise.deployGeneralContracts(config.orion.taker.publicKey, config.orion.insurer.publicKey, config.besu.thisnode.privateKey))
        console.log(`¡¡¡ IMPORTANT !!!: In next executions, set environment variable SPC19CONTRACTADDRESS=${config.spc19ContractAddress.value()}`)
    }

    // Express listen
    app.listen(port, () => console.log(`Live at ${port}`))
})