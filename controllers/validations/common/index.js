const yup = require("yup");

const uuidSchema = yup.string().uuid().required();

module.exports = { uuidSchema };
