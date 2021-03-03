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

module.exports.addPcrRequest = function addPcrRequest (req, res, next) {
  insuranceService.addPcrRequest(req.body, req.params.insuranceId)
    .then(function (response) {
      utils.writeJson(res, response, 201)
    })
    .catch(function (response) {
      let statusCode = (response instanceof Error) ? config.errorStatusCodes[response.message] : 500

      utils.writeJson(res, response, statusCode)
    })
}

module.exports.getPcrRequest = function getPcrRequest (req, res, next) {
  insuranceService.getPcrRequest(req.params.insuranceId, req.params.pcrRequestId)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      let statusCode = (response instanceof Error) ? config.errorStatusCodes[response.message] : 500

      utils.writeJson(res, response, statusCode)
    })
}

module.exports.setResultPcrRequest = function setResultPcrRequest (req, res, next) {
  insuranceService.setResultPcrRequest(req.body, req.params.insuranceId, req.params.pcrRequestId)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      let statusCode = (response instanceof Error) ? config.errorStatusCodes[response.message] : 500

      utils.writeJson(res, response, statusCode)
    })
}

module.exports.deletePcrRequest = function deletePcrRequest (req, res, next) {
  insuranceService.deletePcrRequest(req.params.insuranceId, req.params.pcrRequestId)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      let statusCode = (response instanceof Error) ? config.errorStatusCodes[response.message] : 500

      utils.writeJson(res, response, statusCode)
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