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
const { logger } = require("../utils/logger");

function getErrorStatus(error) {
  if (error instanceof ValidationError) {
    if (error.type === "required") {
      return 415;
    } else {
      return 400;
    }
  } else if (error instanceof Error) {
    return config.errorStatusCodes[error.message] || 500;
  } else {
    return 500;
  }
}

function handleError(error, res, endpointName) {
  const statusCode = getErrorStatus(error);
  logger.error("Status code %d: %s error: %O", statusCode, endpointName, error);
  utils.writeJson(res, error, statusCode);
}

module.exports.addInsurancePolicy = async function addInsurancePolicy(
  req,
  res,
  next
) {
  try {
    logger.info("New Insurance request");
    logger.info("Validating request...");
    insuranceTransforms.sortCustomersAndPcrs(req.body);
    logger.info(req.body);
    const insuranceData = await insuranceSchema.validate(req.body);
    insuranceTransforms.cleanUuids(insuranceData);

    logger.info("Success validating new insurance request");
    logger.info("Sending request to the Backend...");
    const response = await insuranceService.addInsurancePolicy(insuranceData);

    logger.info("Success registering new insurance");
    utils.writeJson(res, response, 201);
  } catch (error) {
    handleError(error, res, "New insurance");
  }
};

module.exports.getAllInsurancePolicy = async function getAllInsurancePolicy(
  req,
  res,
  next
) {
  try {
    const response = await insuranceService.getAllInsurancePolicy();
    const insurances = await response.map((insurance) => {
      insurance.id = toUUID(insurance.id);
      insurance.taker.takerId = toUUID(insurance.taker.takerId);
      insurance.customers = insurance.customers.map((customer) => ({
        ...customer,
        customerId: toUUID(customer.customerId),
      }));
      insurance.pcrRequests = insurance.pcrRequests.map((req) => ({
        ...req,
        id: toUUID(req.id),
        customerId: toUUID(req.customerId),
      }));
      return insurance;
    });

    utils.writeJson(res, insurances);
  } catch (error) {
    handleError(error, res, "Get all insurances");
  }
};

module.exports.addPcrRequest = async function addPcrRequest(req, res, next) {
  try {
    logger.info("Add PCR request");
    logger.info("Validating request...");

    const pcrRequest = await pcrRequestSchema.validate(req.body);
    pcrRequestTransforms.cleanUuids(pcrRequest);

    const _insuranceId = await uuidSchema.validate(req.params.insuranceId);
    const insuranceId = commonTransforms.cleanUuid(_insuranceId);

    logger.info("Success validating add PCR request");
    logger.info("Sending request to the Backend...");
    const response = await insuranceService.addPcrRequest(
      pcrRequest,
      insuranceId
    );

    logger.info("Success registering new PCR request");
    utils.writeJson(res, response, 201);
  } catch (error) {
    handleError(error, res, "Add PCR Request");
  }
};

module.exports.getPcrRequest = async function getPcrRequest(req, res, next) {
  try {
    logger.info("Get PCR request");
    logger.info("Validating request...");

    const _insuranceId = await uuidSchema.validate(req.params.insuranceId);
    const insuranceId = commonTransforms.cleanUuid(_insuranceId);

    const _pcrRequestId = await uuidSchema.validate(req.params.pcrRequestId);
    const pcrRequestId = commonTransforms.cleanUuid(_pcrRequestId);

    logger.info("Success validating get PCR request");
    logger.info("Sending request to the Backend...");
    const response = await insuranceService.getPcrRequest(
      insuranceId,
      pcrRequestId,
      req.query.contractaddress
    );

    logger.info("Success returning PCR details");
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
    logger.info("Set PCR result");
    logger.info("Validating request...");

    const pcrResult = await setPcrResultSchema.validate(req.body);

    const _insuranceId = await uuidSchema.validate(req.params.insuranceId);
    const insuranceId = commonTransforms.cleanUuid(_insuranceId);

    const _pcrRequestId = await uuidSchema.validate(req.params.pcrRequestId);
    const pcrRequestId = commonTransforms.cleanUuid(_pcrRequestId);

    logger.info("Success validating set result PCR request");
    logger.info("Sending request to the Backend...");
    const response = await insuranceService.setResultPcrRequest(
      pcrResult,
      insuranceId,
      pcrRequestId,
      req.query.contractaddress
    );

    logger.info("Success setting PCR result");
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
    logger.info("Delete PCR result");
    logger.info("Validating request...");

    const _insuranceId = await uuidSchema.validate(req.params.insuranceId);
    const insuranceId = commonTransforms.cleanUuid(_insuranceId);

    const _pcrRequestId = await uuidSchema.validate(req.params.pcrRequestId);
    const pcrRequestId = commonTransforms.cleanUuid(_pcrRequestId);

    logger.info("Success validating delete PCR request");
    logger.info("Sending request to the Backend...");
    const response = await insuranceService.deletePcrRequest(
      insuranceId,
      pcrRequestId
    );

    logger.info("Success deleting PCR result");
    utils.writeJson(res, response);
  } catch (error) {
    handleError(error, res, "Delete PCR Request");
  }
};
