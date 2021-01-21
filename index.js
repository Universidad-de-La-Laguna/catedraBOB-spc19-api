'use strict'

const app = require('./app')
const appPromise = require('./app').appPromise

const port = parseInt(process.env.PORT, 10) || 8080

appPromise
.then( () => {
    app.listen(port, () => console.log(`Live at ${port}`))
})