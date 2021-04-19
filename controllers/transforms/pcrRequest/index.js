const { cleanUuid } = require("../common");

function cleanUuids(pcrRequest) {
  pcrRequest.id = cleanUuid(pcrRequest.id);
  pcrRequest.customerId = cleanUuid(pcrRequest.customerId);
}

module.exports = {
  cleanUuids,
};
