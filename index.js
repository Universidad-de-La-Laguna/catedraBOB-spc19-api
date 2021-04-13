'use strict'

const app = require('./app')
const appPromise = require('./app').appPromise

const port = parseInt(process.env.PORT, 10) || 8080

appPromise
.then( (promiseData) => {
    if (typeof promiseData[1] !== "undefined")    
        console.info(`¡¡¡ IMPORTANT !!!: Set environment variable SPC19CONTRACTADDRESS to value ###${promiseData[1]}### the next time you start the service.`)

    // Express listen
    app.listen(port, () => console.log(`Live at ${port}`))
})