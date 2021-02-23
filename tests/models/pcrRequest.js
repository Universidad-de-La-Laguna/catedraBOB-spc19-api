'use strict'

const mongoose = require('mongoose')

const pcrRequestSchema = new mongoose.Schema({
    customerId: { type: String, required: true },
    id: { type: String, required: true },
    requestDate: { type: String, required: true },
    resultDate: { type: String, required: false },
    result: { type: String, required: false }
})

module.exports.pcrRequestSchema = pcrRequestSchema

module.exports = mongoose.model('pcrRequest', pcrRequestSchema)