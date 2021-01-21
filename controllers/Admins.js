'use strict';

var utils = require('../utils/writer.js');
var Admins = require('../service/AdminsService');
const config = require('../config')

module.exports.addInsurancePolicy = function addInsurancePolicy (req, res, next) {
  Admins.addInsurancePolicy(req.body)
    .then(function (response) {
      utils.writeJson(res, response, 201);
    })
    .catch(function (response) {
      let statusCode = (response instanceof Error) ? config.errorStatusCodes[response.message] : 500

      utils.writeJson(res, response, statusCode)
    })
}

module.exports.addPcrRequest = function addPcrRequest (req, res, next, body, customerId) {
  Admins.addPcrRequest(body, customerId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getPcrRequests = function getPcrRequests (req, res, next, customerId) {
  Admins.getPcrRequests(customerId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.orderPayment = function orderPayment (req, res, next, body, insuranceId) {
  Admins.orderPayment(body, insuranceId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.setResultPcrRequest = function setResultPcrRequest (req, res, next, body, customerId, pcrRequestId) {
  Admins.setResultPcrRequest(body, customerId, pcrRequestId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
