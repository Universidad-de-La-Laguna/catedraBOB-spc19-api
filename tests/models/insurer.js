'use strict'

const mongoose = require('mongoose')

const pcrRequestSchema = require('./pcrRequest').pcrRequestSchema

const takerSchema = new mongoose.Schema({
    takerId: { type: String, required: true },
    takerNif: { type: String, required: true },
    takerFullName: { type: String, required: true },
    takerContactAddress: { type: String, required: true },
    takerContactPostalCode: { type: String, required: true },
    takerContactTown: { type: String, required: true },
    takerContactLocation: { type: String, required: true },
    takerContactTelephone: { type: String, required: false },
    takerContactMobile: { type: String, required: false },
    takerContactEmail: { type: String, required: true },
    takerIBAN: { type: String, required: true }
})

const customerSchema = new mongoose.Schema({
    customerId: { type: String, required: true },
    customerNif:  { type: String, required: true },
    customerFullName: { type: String, required: true },
    customerGender: { type: String, required: true },
    customerTelephone: { type: String, required: false },
    customerEmail: { type: String, required: true },
    customerBirthDate: { type: String, required: true },
    negativePcrDate: { type: String, required: true },
    negativePcrHash: { type: String, required: true }
})

/**
 * Insurer model schema
 */
const insurerSchema = new mongoose.Schema({
    id: { type: String, required: true },
    taker: { type: takerSchema, required: true },
    assuredPrice: { type: Number, required: true },
    startDate: { type: String, required: true },
    finishDate: { type: String, required: true },
    customers: { type: [customerSchema], "default" : [], required: true },
    pcrRequests: { type: [pcrRequestSchema], "default" : [], required: false },
    contractDate: { type: String, required: false }
})

module.exports = mongoose.model('insurer', insurerSchema)