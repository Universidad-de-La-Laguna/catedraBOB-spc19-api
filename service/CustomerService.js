'use strict';


/**
 * get all PCR Request of a customer
 * Get state of all PCR Request of a customer
 *
 * customerId CustomerId 
 * returns List
 **/
exports.getPcrRequests = function(customerId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "result" : "POSITIVE",
  "customerId" : "customer1",
  "requestDate" : "2016-08-29T09:12:33.001Z",
  "id" : "562b2dd8-5a4f-11eb-ae93-0242ac130002"
}, {
  "result" : "POSITIVE",
  "customerId" : "customer1",
  "requestDate" : "2016-08-29T09:12:33.001Z",
  "id" : "562b2dd8-5a4f-11eb-ae93-0242ac130002"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

