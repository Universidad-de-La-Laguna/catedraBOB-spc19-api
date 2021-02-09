'use strict'

const mongoose = require('mongoose')


const customerSchema = new mongoose.Schema({
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerTelephone: { type: String, required: true },
    customerEmail: { type: String, required: true }
})


/**
 * Insurer model schema
 */
const insurerSchema = new mongoose.Schema({
    id: { type: String, required: true },
    customers: { type: [customerSchema], "default" : [], required: true },
    contractDate: { type: String, required: true },
    startDate: { type: String, required: true },
    finishDate: { type: String, required: true },
    assuredPrice: { type: Number, required: true },
    negativePcrDate: { type: String, required: true },
    negativePcrHash: { type: String, required: true },
})

module.exports = mongoose.model('insurer', insurerSchema)