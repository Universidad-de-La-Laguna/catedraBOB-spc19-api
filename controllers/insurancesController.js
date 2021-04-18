"use strict";

var utils = require("../utils/writer.js");
var insuranceService = require("../service/insurancesService");
const config = require("../config");
const { insuranceSchema } = require("./validations/insurance");
const insuranceTransforms = require("./transforms/insurance");
const { ValidationError } = require("yup");

function getErrorStatus(error) {
  if (error instanceof ValidationError) {
    if (error.type === "required") {
      return 415;
    } else {
      return 400;
    }
  } else if (error instanceof Error) {
    return config.errorStatusCodes[error.message];
  } else {
    return 500;
  }
}

module.exports.addInsurancePolicy = async function addInsurancePolicy(
  req,
  res,
  next
) {
  try {
    console.log("[INFO] New Insurance request");
    console.log("[INFO] Validating new insurance request...");
    insuranceTransforms.sortCustomersAndPcrs(req.body);
    const insuranceData = await insuranceSchema.validate(req.body);
    insuranceTransforms.cleanUuids(insuranceData);

    console.log("[INFO] Success validating new insurance request");
    console.log("[INFO] Sending request to the Backend...");
    const response = await insuranceService.addInsurancePolicy(insuranceData);

    console.log("[INFO] Success registering new insurance");
    utils.writeJson(res, response, 201);
  } catch (error) {
    const statusCode = getErrorStatus(error);
    console.error("[ERROR] %d: New insurance error: %O", statusCode, error);
    utils.writeJson(res, error, statusCode);
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
