"use strict";

var utils = require("../utils/writer.js");
var insuranceService = require("../service/insurancesService");
const config = require("../config");
const { insuranceSchema } = require("./validations/insurance");
const { pcrRequestSchema } = require("./validations/pcrRequest");
const { uuidSchema } = require("./validations/common");
const { setPcrResultSchema } = require("./validations/setResultPcrRequest");
const commonTransforms = require("./transforms/common");
const insuranceTransforms = require("./transforms/insurance");
const pcrRequestTransforms = require("./transforms/pcrRequest");
const { ValidationError } = require("yup");
const { toUUID } = require("to-uuid");

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

function handleError(error, res, endpointName) {
  const statusCode = getErrorStatus(error);
  console.error("[ERROR] %d: %s error: %O", statusCode, endpointName, error);
  utils.writeJson(res, error, statusCode);
}

module.exports.addInsurancePolicy = async function addInsurancePolicy(
  req,
  res,
  next
) {
  try {
    console.log("[INFO] New Insurance request");
    console.log("[INFO] Validating request...");
    insuranceTransforms.sortCustomersAndPcrs(req.body);
    const insuranceData = await insuranceSchema.validate(req.body);
    insuranceTransforms.cleanUuids(insuranceData);

    console.log("[INFO] Success validating new insurance request");
    console.log("[INFO] Sending request to the Backend...");
    const response = await insuranceService.addInsurancePolicy(insuranceData);

    console.log("[INFO] Success registering new insurance");
    utils.writeJson(res, response, 201);
  } catch (error) {
    handleError(error, res, "New insurance");
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

module.exports.addPcrRequest = async function addPcrRequest(req, res, next) {
  try {
    console.log("[INFO] Add PCR request");
    console.log("[INFO] Validating request...");

    const pcrRequest = await pcrRequestSchema.validate(req.body);
    pcrRequestTransforms.cleanUuids(pcrRequest);

    const _insuranceId = await uuidSchema.validate(req.params.insuranceId);
    const insuranceId = commonTransforms.cleanUuid(_insuranceId);

    console.log("[INFO] Success validating add PCR request");
    console.log("[INFO] Sending request to the Backend...");
    const response = await insuranceService.addPcrRequest(
      pcrRequest,
      insuranceId
    );

    console.log("[INFO] Success registering new PCR request");
    utils.writeJson(res, response, 201);
  } catch (error) {
    handleError(error, res, "Add PCR Request");
  }
};

module.exports.getPcrRequest = async function getPcrRequest(req, res, next) {
  try {
    console.log("[INFO] Get PCR request");
    console.log("[INFO] Validating request...");

    const _insuranceId = await uuidSchema.validate(req.params.insuranceId);
    const insuranceId = commonTransforms.cleanUuid(_insuranceId);

    const _pcrRequestId = await uuidSchema.validate(req.params.pcrRequestId);
    const pcrRequestId = commonTransforms.cleanUuid(_pcrRequestId);

    console.log("[INFO] Success validating get PCR request");
    console.log("[INFO] Sending request to the Backend...");
    const response = await insuranceService.getPcrRequest(
      insuranceId,
      pcrRequestId,
      req.query.contractaddress
    );

    console.log("[INFO] Success returning PCR details");
    utils.writeJson(res, response);
  } catch (error) {
    handleError(error, res, "Get PCR Request");
  }
};

module.exports.setResultPcrRequest = async function setResultPcrRequest(
  req,
  res,
  next
) {
  try {
    console.log("[INFO] Set PCR result");
    console.log("[INFO] Validating request...");

    const pcrResult = await setPcrResultSchema.validate(req.body);

    const _insuranceId = await uuidSchema.validate(req.params.insuranceId);
    const insuranceId = commonTransforms.cleanUuid(_insuranceId);

    const _pcrRequestId = await uuidSchema.validate(req.params.pcrRequestId);
    const pcrRequestId = commonTransforms.cleanUuid(_pcrRequestId);

    console.log("[INFO] Success validating set result PCR request");
    console.log("[INFO] Sending request to the Backend...");
    const response = await insuranceService.setResultPcrRequest(
      pcrResult,
      insuranceId,
      pcrRequestId,
      req.query.contractaddress
    );

    console.log("[INFO] Success setting PCR result");
    utils.writeJson(res, response);
  } catch (error) {
    handleError(error, res, "Set PCR Result");
  }
};

module.exports.deletePcrRequest = async function deletePcrRequest(
  req,
  res,
  next
) {
  try {
    console.log("[INFO] Delete PCR result");
    console.log("[INFO] Validating request...");

    const _insuranceId = await uuidSchema.validate(req.params.insuranceId);
    const insuranceId = commonTransforms.cleanUuid(_insuranceId);

    const _pcrRequestId = await uuidSchema.validate(req.params.pcrRequestId);
    const pcrRequestId = commonTransforms.cleanUuid(_pcrRequestId);

    console.log("[INFO] Success validating delete PCR request");
    console.log("[INFO] Sending request to the Backend...");
    const response = await insuranceService.deletePcrRequest(
      insuranceId,
      pcrRequestId
    );

    console.log("[INFO] Success deleting PCR result");
    utils.writeJson(res, response);
  } catch (error) {
    handleError(error, res, "Delete PCR Request");
  }
};

module.exports.checkPayment = async function checkPayment(req, res, next) {
  try {
    console.log("[INFO] Check Payment");
    console.log("[INFO] Validating request...");

    const _insuranceId = await uuidSchema.validate(req.params.insuranceId);
    const insuranceId = commonTransforms.cleanUuid(_insuranceId);

    console.log("[INFO] Success validating Check Payment request");
    console.log("[INFO] Sending request to the Backend...");
    const response = await insuranceService.checkPayment(insuranceId);

    // return a formatted uuid
    if (response.insuranceId) {
      response.insuranceId = toUUID(response.insuranceId);
    }

    console.log("[INFO] Success Checking Payment");
    utils.writeJson(res, response);
  } catch (error) {
    handleError(error, res, "Check Payment");
  }
};
