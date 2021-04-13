"use strict";

var utils = require("../utils/writer.js");
var insuranceService = require("../service/insurancesService");
const config = require("../config");
const { insuranceSchema } = require("./validations/insurance");
const insuranceTransforms = require("./transforms/insurance");

module.exports.addInsurancePolicy = async function addInsurancePolicy(
  req,
  res,
  next
) {
  try {
    console.log("[INFO] New Insurance request");
    insuranceTransforms.sortCustomersAndPcrs(req.body);
    console.log("[INFO] Validating new insurance request...");
    const insuranceData = await insuranceSchema.validate(req.body);
    console.log("[INFO] Success validating new insurance request");
    console.log("[INFO] Sending request to the Backend...");
    insuranceTransforms.cleanUuids(insuranceData);
    const response = await insuranceService.addInsurancePolicy(insuranceData);

    console.log("[INFO] Success registering new insurance");
    utils.writeJson(res, response, 201);
  } catch (response) {
    console.error("[ERROR] New insurance error: %O", response);
    let statusCode =
      response instanceof Error
        ? config.errorStatusCodes[response.message]
        : 500;
    utils.writeJson(res, response, statusCode);
  }
};

module.exports.getAllInsurancePolicy = function getAllInsurancePolicy(
  req,
  res,
  next
) {
  insuranceService
    .getAllInsurancePolicy()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.addPcrRequest = function addPcrRequest(req, res, next) {
  insuranceService
    .addPcrRequest(req.body, req.params.insuranceId)
    .then(function (response) {
      utils.writeJson(res, response, 201);
    })
    .catch(function (response) {
      let statusCode =
        response instanceof Error
          ? config.errorStatusCodes[response.message]
          : 500;

      utils.writeJson(res, response, statusCode);
    });
};

module.exports.getPcrRequest = function getPcrRequest(req, res, next) {
  insuranceService
    .getPcrRequest(req.params.insuranceId, req.params.pcrRequestId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      let statusCode =
        response instanceof Error
          ? config.errorStatusCodes[response.message]
          : 500;

      utils.writeJson(res, response, statusCode);
    });
};

module.exports.setResultPcrRequest = function setResultPcrRequest(
  req,
  res,
  next
) {
  insuranceService
    .setResultPcrRequest(
      req.body,
      req.params.insuranceId,
      req.params.pcrRequestId,
      req.query.contractaddress
    )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      let statusCode =
        response instanceof Error
          ? config.errorStatusCodes[response.message]
          : 500;

      utils.writeJson(res, response, statusCode);
    });
};

module.exports.deletePcrRequest = function deletePcrRequest(req, res, next) {
  insuranceService
    .deletePcrRequest(req.params.insuranceId, req.params.pcrRequestId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      let statusCode =
        response instanceof Error
          ? config.errorStatusCodes[response.message]
          : 500;

      utils.writeJson(res, response, statusCode);
    });
};

module.exports.checkPayment = function checkPayment(req, res, next) {
  insuranceService
    .checkPayment(req.params.insuranceId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      let statusCode =
        response instanceof Error
          ? config.errorStatusCodes[response.message]
          : 500;

      utils.writeJson(res, response, statusCode);
    });
};
