'use strict';

var utils = require('../utils/writer.js');
var insuranceService = require('../service/insurancesService');
const config = require('../config');
const { insuranceSchema } = require('./validations/insurance');
const { pcrRequestSchema } = require('./validations/pcrRequest');
const { uuidSchema } = require('./validations/common');
const commonTransforms = require('./transforms/common');
const insuranceTransforms = require('./transforms/insurance');
const pcrRequestTransforms = require('./transforms/pcrRequest');
const { ValidationError } = require('yup');

const cleanUuid = (uuid) => uuid.replace(/-/g, "");

function getErrorStatus(error) {
  if (error instanceof ValidationError) {
    if (error.type === 'required') {
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
    console.log('[INFO] New Insurance request');
    console.log('[INFO] Validating new insurance request...');
    insuranceTransforms.sortCustomersAndPcrs(req.body);
    const insuranceData = await insuranceSchema.validate(req.body);
    insuranceTransforms.cleanUuids(insuranceData);

    console.log('[INFO] Success validating new insurance request');
    console.log('[INFO] Sending request to the Backend...');
    const response = await insuranceService.addInsurancePolicy(insuranceData);

    console.log('[INFO] Success registering new insurance');
    utils.writeJson(res, response, 201);
  } catch (error) {
    const statusCode = getErrorStatus(error);
    console.error('[ERROR] %d: New insurance error: %O', statusCode, error);
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

module.exports.addPcrRequest = async function addPcrRequest(req, res, next) {
  try {
    console.log('[INFO] Add PCR request');
    console.log('[INFO] Validating PCR request...');

    const pcrRequest = await pcrRequestSchema.validate(req.body);
    pcrRequestTransforms.cleanUuids(pcrRequest);

    const _insuranceId = await uuidSchema.validate(req.params.insuranceId);
    const insuranceId = commonTransforms.cleanUuid(_insuranceId);

    console.log('[INFO] Success validating add PCR request');
    console.log('[INFO] Sending request to the Backend...');
    const response = await insuranceService.addPcrRequest(
      pcrRequest,
      insuranceId
    );

    console.log('[INFO] Success registering new PCR request');
    utils.writeJson(res, response, 201);
  } catch (error) {
    const statusCode = getErrorStatus(error);
    console.error('[ERROR] %d: Add PCR Request error: %O', statusCode, error);
    utils.writeJson(res, error, statusCode);
  }
};

module.exports.getPcrRequest = function getPcrRequest(req, res, next) {
  insuranceService
    .getPcrRequest(
      cleanUuid(req.params.insuranceId),
      cleanUuid(req.params.pcrRequestId),
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

module.exports.setResultPcrRequest = function setResultPcrRequest(
  req,
  res,
  next
) {
  insuranceService
    .setResultPcrRequest(
      req.body,
      cleanUuid(req.params.insuranceId),
      cleanUuid(req.params.pcrRequestId),
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
    .deletePcrRequest(
      cleanUuid(req.params.insuranceId),
      cleanUuid(req.params.pcrRequestId)
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

module.exports.checkPayment = function checkPayment(req, res, next) {
  insuranceService
    .checkPayment(
      cleanUuid(req.params.insuranceId)
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
