'use strict'

const config = require('./config')
const app = require('./app')
const appPromise = require('./app').appPromise

const port = parseInt(process.env.PORT, 10) || 8080

// Deploy contract if not exists
if (config.businessParams.nodeRole === 'taker') {
    if (config.contracts.spc19ContractAddress) {
        console.log(`Using SPC19 general contract: ${config.contracts.spc19ContractAddress}`)
    }
    else {
        console.warn("This service dont have SPC19 general contract configured. Lets proceed to delegate one!")
        const despliegueInicial = require('./scripts/despliegue-inicial')
        // Deploy spc19 general contract in this node (taker) and insurer
        despliegueInicial.deployGeneralContracts(config.orion.taker.publicKey, config.orion.insurer.publicKey, config.besu.thisnode.privateKey)
        .then( (deployedContract) => {
            console.info(`¡¡¡ IMPORTANT !!!: Set environment variable SPC19CONTRACTADDRESS to value ${deployedContract} the next time you start the service.`)
        })        
    }    
}

appPromise
.then( () => {
    app.listen(port, () => console.log(`Live at ${port}`))
})