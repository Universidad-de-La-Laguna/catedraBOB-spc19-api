'use strict';


/**
 * register new insurance policy
 * Add a new insurance policy to the system
 *
 * body InsuranceItem Insurance item to add (optional)
 * no response value expected for this operation
 **/
exports.addInsurancePolicy = function(body) {
  return new Promise(function(resolve, reject) {
    //TODO
    reject()
  })
}

/**
 * get all insurance policies
 * Insurer get all policies and hostelry only owns
 * 
 * return List
 */
exports.getAllInsurancePolicy = function() {
  return new Promise(function(resolve, reject) {
    //TODO
    resolve()
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
  return new Promise(function(resolve, reject) {
    //TODO
    resolve()
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
  return new Promise(function(resolve, reject) {
    //TODO
    resolve()
  })
}

/**
 * set result of an PCR test
 * Laboratory set the PCR Request Result
 *
 * body String  (optional)
 * insuranceId InsuranceId 
 * pcrRequestId PcrId 
 * no response value expected for this operation
 **/
exports.setResultPcrRequest = function(body, insuranceId, pcrRequestId) {
  return new Promise(function(resolve, reject) {
    //TODO
    resolve()
  })
}

/**
 * Cancel a PCR Request
 * Cancel an existing PCR Request
 * 
 * body String  (optional)
 * insuranceId InsuranceId 
 * pcrRequestId PcrId 
 * no response value expected for this operation
 */
exports.deletePcrRequest = function(insuranceId, pcrRequestId) {
  return new Promise(function(resolve, reject) {
    //TODO
    resolve()
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
  return new Promise(function(resolve, reject) {
    //TODO
    resolve()
  })
}