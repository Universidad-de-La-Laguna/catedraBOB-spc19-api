'use strict'

const mongoose = require('mongoose')

/**
 * Insurer model schema
 */
const insurerSchema = new mongoose.Schema({
    id: { type: String, required: true },
    customerId: { type: String, required: true },
    contractDate: { type: String, required: true },
    startDate: { type: String, required: true },
    finishDate: { type: String, required: true },
    assuredPrice: { type: Number, required: true }
})

module.exports = mongoose.model('insurer', insurerSchema)