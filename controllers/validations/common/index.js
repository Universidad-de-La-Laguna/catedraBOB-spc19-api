const yup = require("yup");
const { CONFIG } = require("../config");

const uuidSchema = yup.string().uuid().required();
const pcrResultSchema = yup
  .string()
  .required()
  .oneOf(CONFIG.PCR_RESULT_OPTIONS);

module.exports = { uuidSchema, pcrResultSchema };
