'use strict'

var app = require('./app')

const port = parseInt(process.env.PORT, 10) || 8080

app.listen(port, () => console.log(`Live at ${port}`))