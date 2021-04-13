const _compareCustomerUuids = (a, b) =>
  a.customerId.localeCompare(b.customerId);
const _cleanUuid = (uuid) => uuid.replace(/-/g, "");

function sortCustomersAndPcrs(insurance) {
  insurance.customers = insurance.customers.sort(_compareCustomerUuids);
  insurance.pcrRequests = insurance.pcrRequests.sort(_compareCustomerUuids);
}

function cleanUuids(insurance) {
  insurance.id = _cleanUuid(insurance.id);
  insurance.taker.takerId = _cleanUuid(insurance.taker.takerId);
  insurance.customers = insurance.customers.map((customer) => ({
    ...customer,
    customerId: _cleanUuid(customer.customerId),
  }));
  insurance.pcrRequests = insurance.pcrRequests.map((request) => ({
    ...request,
    id: _cleanUuid(request.id),
    customerId: _cleanUuid(request.customerId),
  }));
}

module.exports = {
  sortCustomersAndPcrs,
  cleanUuids,
};
