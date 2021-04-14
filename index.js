'use strict'

const app = require('./app')
const appPromise = require('./app').appPromise
var config = require('./config')
const despliegueInicialPromise = require('./scripts/despliegue-inicial')

const port = parseInt(process.env.PORT, 10) || 8080

appPromise
.then( async () => {
    // Deploy contract if not exists
    if (config.businessParams.nodeRole === 'taker') {
        if (config.contracts.spc19ContractAddress) {
            console.log(`Using SPC19 general contract: ${config.contracts.spc19ContractAddress}`)
        }
        else {
            // Deploy spc19 general contract in this node (taker) and insurer
            console.warn("This service dont have SPC19 general contract configured. Lets proceed to delegate one!")
            const deployedContract = await despliegueInicialPromise.deployGeneralContracts(config.orion.taker.publicKey, config.orion.insurer.publicKey, config.besu.thisnode.privateKey)
            console.info(`¡¡¡ IMPORTANT !!!: Set environment variable SPC19CONTRACTADDRESS to value ###${deployedContract}### the next time you start the service.`)
        }
    }

    // Express listen
    app.listen(port, () => console.log(`Live at ${port}`))
})