'use strict';

var utils = require('../utils/writer.js');
var insuranceService = require('../service/insurancesService');
const config = require('../config')

module.exports.addInsurancePolicy = function addInsurancePolicy (req, res, next) {
  insuranceService.addInsurancePolicy(req.body)
    .then(function (response) {
      utils.writeJson(res, response, 201);
    })
    .catch(function (response) {
      let statusCode = (response instanceof Error) ? config.errorStatusCodes[response.message] : 500

      utils.writeJson(res, response, statusCode)
    })
}

module.exports.getAllInsurancePolicy = function getAllInsurancePolicy (req, res, next) {
  insuranceService.getAllInsurancePolicy()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.addPcrRequest = function addPcrRequest (req, res, next, insuranceId) {
  insuranceService.addPcrRequest(req.body, req.params.insuranceId)
    .then(function (response) {
      utils.writeJson(res, response, 201)
    })
    .catch(function (response) {
      let statusCode = (response instanceof Error) ? config.errorStatusCodes[response.message] : 500

      utils.writeJson(res, response, statusCode)
    })
}

module.exports.getPcrRequest = function getPcrRequest (req, res, next, insuranceId, pcrRequestId) {
  insuranceService.getPcrRequest(insuranceId, pcrRequestId)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.setResultPcrRequest = function setResultPcrRequest (req, res, next, body, customerId, pcrRequestId) {
  insuranceService.setResultPcrRequest(body, customerId, pcrRequestId)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.deletePcrRequest = function deletePcrRequest (req, res, next, body, customerId, pcrRequestId) {
  insuranceService.deletePcrRequest(body, customerId, pcrRequestId)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.orderPayment = function orderPayment (req, res, next, body, insuranceId) {
  insuranceService.orderPayment(body, insuranceId)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}