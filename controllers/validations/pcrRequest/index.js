const yup = require("yup");

const pcrRequestSchema = yup.object().shape({
  id: yup.string().uuid().required(),
  customerId: yup.string().uuid().required(),
});

module.exports = { pcrRequestSchema };
