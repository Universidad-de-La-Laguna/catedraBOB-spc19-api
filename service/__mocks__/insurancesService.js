'use strict';

/**
 * IMPORTANTE
 * 
 * Este servicio está mockeado utilizando una base de datos MongoDB como repositorio de objetos en lugar de una blockchain.
 * Cada objeto de la base de datos equivale a un contrato desplegado en la blockchain.
 * 
 */

const insurerModel = require('../../tests/models/insurer')
const pcrRequestModel = require('../../tests/models/pcrRequest')

const helpers = require('../../utils/helpers')

const config = require('../../config')

/**
 * register new insurance policy
 * Add a new insurance policy to the system
 *
 * body InsuranceItem Insurance item to add (optional)
 * no response value expected for this operation
 **/
exports.addInsurancePolicy = function(body) {
  return new Promise(async function(resolve, reject) {
    if (! body || Object.keys(body).length === 0)
      reject(new Error('Missing data'))
    else {
      // check negative pcr date
      if (helpers.isodateHoursDiff(body.negativePcrDate, (new Date()).toISOString()) > config.businessParams.negativePcrHours )
        reject(new Error('Invalid data'))
      else {
        // check if insurance already exists
        let insurance = await insurerModel.find({ id: body.id })
        if (insurance.length > 0) {
          reject(new Error('Conflict'))
        }
        else {
          // Create insurance
          await insurerModel.create(body)
          resolve(body)  
        }
      }
    }
  })
}

exports.getAllInsurancePolicy = function() {
  return new Promise(async function(resolve, reject) {
    // get all insurances
    let insurances = await insurerModel.find({})
    resolve(insurances)
  })
}

/**
 * new PCR test request to a customer
 * Hotel create a new PCR Request to check-in os a customer
 *
 * body PcrRequestItem PCR Request to create
 * insuranceId insuranceId
 * no response value expected for this operation
 **/
exports.addPcrRequest = function(body, insuranceId) {
  return new Promise(async function(resolve, reject) {
    // check if insurance already exists
    let insurance = await insurerModel.find({ id: insuranceId })
    if (insurance.length !== 1)
      reject(new Error('Invalid data'))
    else {
        // check if pcrRequest already exists
        let pcrReq = insurance[0].pcrRequests.find(p => p.id === body.id)
        if (typeof pcrReq !== 'undefined') {
          reject(new Error('Conflict'))
        }
        else {
          // Add PCR Request to array
          let pcrRequest = await pcrRequestModel.create(body)

          insurance[0].pcrRequests.push(pcrRequest)
          await insurance[0].save()

          resolve()
        }
    }
  })
}

/**
 * get all PCR Request of a customer
 * Get state of all PCR Request of a customer
 *
 * customerId CustomerId 
 * returns PcrRequestItem
 **/
exports.getPcrRequest = function(insuranceId, pcrRequestId) {
  return new Promise(async function(resolve, reject) {
    let insurance = await insurerModel.find({ id: insuranceId })
    if (insurance.length !== 1)
      reject(new Error('Invalid data'))
    else {
      // check if pcrRequest already exists
      let pcrReq = insurance[0].pcrRequests.find(p => p.id === pcrRequestId)
      if (typeof pcrReq === 'undefined')
        reject(new Error('Invalid data'))
      else
        resolve(pcrReq)
    }
  })
}

/**
 * set result of an PCR test
 * Laboratory set the PCR Request Result
 *
 * body String  (optional)
 * customerId CustomerId 
 * pcrRequestId PcrId 
 * no response value expected for this operation
 **/
exports.setResultPcrRequest = function(body, insuranceId, pcrRequestId) {
  return new Promise(async function(resolve, reject) {
    let insurance = await insurerModel.find({ id: insuranceId })
    if (insurance.length !== 1)
      reject(new Error('Invalid data'))
    else {
      // check if pcrRequest exists
      let pcrReqIndex = insurance[0].pcrRequests.findIndex(p => p.id === pcrRequestId)
      if (pcrReqIndex == -1)
        reject(new Error('Invalid data'))
      else {
        // update PCR Request
        await insurerModel.updateOne({id: insuranceId, 'pcrRequests.id': pcrRequestId}, {'$set': {
          'pcrRequests.$.result': body.result,
          'pcrRequests.$.resultDate': (new Date()).toISOString()
        }})

        resolve()
      }
    }
  })
}

/**
 * Cancel a PCR Request
 * Cancel an existing PCR Request
 * 
 * body String  (optional)
 * customerId CustomerId 
 * pcrRequestId PcrId 
 * no response value expected for this operation
 */
exports.deletePcrRequest = function(insuranceId, pcrRequestId) {
  return new Promise(async function(resolve, reject) {
    let insurance = await insurerModel.find({ id: insuranceId })
    if (insurance.length !== 1)
      reject(new Error('Invalid data'))
    else {
      // check if pcrRequest exists
      let pcrReqIndex = insurance[0].pcrRequests.findIndex(p => p.id === pcrRequestId)
      if (pcrReqIndex == -1)
        reject(new Error('Invalid data'))
      else {
        // delete PCR Request
        await insurerModel.updateOne({id: insuranceId, 'pcrRequests.id': pcrRequestId}, {
          '$pull': {
            'pcrRequests': { id: pcrRequestId }
          }
        })

        resolve()
      }
    }
  })
}

/**
 * order payment for insurance policy
 * Order the payment to customer for accomplishment of blockchain contract
 *
 * insuranceId InsuranceId 
 * no response value expected for this operation
 **/
exports.checkPayment = function(insuranceId) {
  return new Promise(async function(resolve, reject) {
    let insurance = await insurerModel.find({ id: insuranceId })
    if (insurance.length !== 1)
      reject(new Error('Invalid data'))
    else {
      // Get Positive PCRs
      let pcrReq = await insurance[0].pcrRequests.filter(p => p.result === "POSITIVE")

      // Calculate indemnization and return
      resolve({
        insuranceId: insuranceId,
        indemnization: pcrReq.length * config.businessParams.daysToCompensate * insurance[0].assuredPrice
      })
    }
  })
}