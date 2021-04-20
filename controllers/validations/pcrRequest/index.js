const yup = require("yup");
const { uuidSchema } = require("../common");

const pcrRequestSchema = yup.object().shape({
  id: uuidSchema,
  customerId: uuidSchema,
});

module.exports = { pcrRequestSchema };
