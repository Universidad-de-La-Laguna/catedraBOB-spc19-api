const yup = require("yup");
const { pcrResultSchema } = require("../common");

const setPcrResultSchema = yup.object().shape({
  result: pcrResultSchema,
});

module.exports = { setPcrResultSchema };
