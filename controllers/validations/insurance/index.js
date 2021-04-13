const { CONFIG } = require("../config");
const { extendYup } = require("./extensions");
const yup = extendYup(require("yup"));

const NIF_REGEX = /^\d{8}[a-zA-Z]{1}$/;

const insuranceSchema = yup.object().shape({
  id: yup.string().uuid().required(),
  taker: yup
    .object()
    .shape({
      takerId: yup.string().uuid().required(),
      takerNif: yup.string().matches(NIF_REGEX).required(),
      takerFullName: yup.string().required(),
      takerContactAddress: yup.string().required(),
      takerContactPostalCode: yup.number().required(),
      takerContactTown: yup.string().required(),
      takerContactLocation: yup.string().required(),
      takerContactTelephone: yup.number().required(),
      takerContactMobile: yup.number().required(),
      takerContactEmail: yup.string().email().required(),
      takerIBAN: yup.string().iban().required(),
    })
    .required(),
  customers: yup
    .array()
    .min(1)
    .max(CONFIG.MAX_NUM_CUSTOMERS)
    .unique("Duplicate Customer ID", (customer) => customer.customerId)
    .of(
      yup.object().shape({
        customerId: yup.string().uuid().required(),
        customerNif: yup.string().matches(NIF_REGEX).required(),
        customerFullName: yup.string().required(),
        customerGender: yup.string().oneOf(CONFIG.GENDER_OPTIONS).required(),
        customerBirthDate: yup.date().required(),
        customerTelephone: yup.number().required(),
        customerEmail: yup.string().email().required(),
        negativePcrDate: yup.date().required(),
        negativePcrHash: yup
          .string()
          .length(CONFIG.HASH_SIZE + 2)
          .test((str) => str.startsWith("0x"))
          .required(),
      })
    )
    .required(),
  contractDate: yup.date().required(),
  startDate: yup.date().required(),
  finishDate: yup.date().required(),
  assuredPrice: yup.number().oneOf(CONFIG.PRICE_OPTIONS).required(),
  pcrRequests: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.string().uuid().required(),
        customerId: yup.string().uuid().required(),
      })
    )
    .unique("Duplicate PCR request ID", (pcrRequest) => pcrRequest.id)
    .sameLength(
      "customers",
      "The number of PCR requests if different than the number of Customers"
    )
    .sameOrderedElements(
      "customers",
      "customerId",
      "Some customer doesn't have a valid matching PCR request"
    )
    .required(),
});

module.exports = { insuranceSchema };
