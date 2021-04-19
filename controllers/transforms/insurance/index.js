const { cleanUuid } = require("../common");

const compareCustomerUuids = (a, b) => a.customerId.localeCompare(b.customerId);

function sortCustomersAndPcrs(insurance = {}) {
  insurance.customers = insurance?.customers?.sort(compareCustomerUuids);
  insurance.pcrRequests = insurance?.pcrRequests?.sort(compareCustomerUuids);
}

function cleanUuids(insurance) {
  insurance.id = cleanUuid(insurance.id);
  insurance.taker.takerId = cleanUuid(insurance.taker.takerId);
  insurance.customers = insurance.customers.map((customer) => ({
    ...customer,
    customerId: cleanUuid(customer.customerId),
  }));
  insurance.pcrRequests = insurance.pcrRequests.map((request) => ({
    ...request,
    id: cleanUuid(request.id),
    customerId: cleanUuid(request.customerId),
  }));
}

module.exports = {
  sortCustomersAndPcrs,
  cleanUuids,
};
