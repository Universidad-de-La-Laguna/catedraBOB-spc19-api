const Web3Utils = require('web3-utils');

const deseriality = (data, newOffset) => {
  const insurance = {taker: {}};
  let offset;
  if (newOffset) {
    offset = newOffset.offset;
  } else {
    offset = 0;
  }
  if (offset === 0) {
    insurance['id'] = '0x' + data.slice(offset - 64);
  } else {
    insurance['id'] = '0x' + data.slice(offset - 64, offset);
  }
  offset -= 64;
  insurance['startDate'] = parseInt(data.slice(offset - 64, offset), 16);
  offset -= 64;
  insurance['finishDate'] = parseInt(data.slice(offset - 64, offset), 16);
  offset -= 64;
  insurance['assuredPrice'] = parseInt(data.slice(offset - 4, offset), 16);
  offset -= 4;
  insurance['daysToCompensate'] = parseInt(data.slice(offset - 4, offset), 16);
  offset -= 4;
  insurance['taker']['takerId'] = '0x' + data.slice(offset - 64, offset);
  offset -= 64;
  insurance['taker']['takerNif'] = Web3Utils.toUtf8(
    '0x' + data.slice(offset - 64, offset)
  );
  offset -= 64;
  insurance['taker']['takerContactPostalCode'] = Web3Utils.toUtf8(
    '0x' + data.slice(offset - 64, offset)
  );
  offset -= 64;
  insurance['taker']['takerContactTown'] = Web3Utils.toUtf8(
    '0x' + data.slice(offset - 64, offset)
  );
  offset -= 64;
  insurance['taker']['takerContactLocation'] = Web3Utils.toUtf8(
    '0x' + data.slice(offset - 64, offset)
  );
  offset -= 64;
  insurance['taker']['takerContactTelephone'] = Web3Utils.toUtf8(
    '0x' + data.slice(offset - 64, offset)
  );
  offset -= 64;
  insurance['taker']['takerContactMobile'] = Web3Utils.toUtf8(
    '0x' + data.slice(offset - 64, offset)
  );
  offset -= 64;
  insurance['taker']['takerIBAN'] = Web3Utils.toUtf8(
    '0x' + data.slice(offset - 64, offset)
  );
  offset -= 64;
  insurance['positivePcr'] =
    data.slice(offset - 2, offset) == '01' ? true : false;
  offset -= 2;
  insurance['paymentEmitted'] =
    data.slice(offset - 2, offset) == '01' ? true : false;
  offset -= 2;
  const nameSize = parseInt(data.slice(offset - 4, offset), 16);
  offset -= 4;
  const hexHotelName = '0x' + data.slice(offset - nameSize * 2, offset);
  insurance['taker']['takerFullName'] = Web3Utils.toUtf8(
    hexHotelName.slice(0, -4)
  );
  offset -= nameSize * 2;
  const addressSize = parseInt(data.slice(offset - 4, offset), 16);
  offset -= 4;
  const hexHotelAddress = '0x' + data.slice(offset - addressSize * 2, offset);
  insurance['taker']['takerContactAddress'] = Web3Utils.toUtf8(
    hexHotelAddress.slice(0, -4)
  );
  offset -= addressSize * 2;
  const emailSize = parseInt(data.slice(offset - 4, offset), 16);
  offset -= 4;
  insurance['taker']['takerContactEmail'] = Web3Utils.toUtf8(
    '0x' + data.slice(offset - addressSize * 2, offset - 4)
  );
  offset -= emailSize * 2;
  const insuredNumber = parseInt(data.slice(offset - 4, offset), 16);
  offset -= 4;
  insurance['customers'] = [];
  for (let i = 0; i < insuredNumber; i++) {
    let insuredInfo = {};
    insuredInfo['customerId'] = '0x' + data.slice(offset - 64, offset);
    offset -= 64;
    insuredInfo['negativePcrHash'] = '0x' + data.slice(offset - 64, offset);
    offset -= 64;
    insuredInfo['negativePcrDate'] = parseInt(
      data.slice(offset - 64, offset),
      16
    );
    offset -= 64;
    insurance['customers'].push(insuredInfo);
  }
  const pcrNumber = parseInt(data.slice(offset - 64, offset), 16);
  offset -= 64;
  insurance['pcrRequests'] = [];
  for (let i = 0; i < pcrNumber; i++) {
    let pcrInfo = {};
    pcrInfo['id'] = '0x' + data.slice(offset - 64, offset);
    offset -= 64;
    pcrInfo['resultDate'] = parseInt(data.slice(offset - 64, offset), 16);
    offset -= 64;
    pcrInfo['requestDate'] = parseInt(data.slice(offset - 64, offset), 16);
    offset -= 64;
    pcrInfo['customerId'] = '0x' + data.slice(offset - 64, offset);
    offset -= 64;
    pcrInfo['result'] = Web3Utils.toUtf8(
      '0x' + data.slice(offset - 64, offset)
    );
    offset -= 64;
    insurance['pcrRequests'].push(pcrInfo);
  }
  if (newOffset) {
    newOffset.offset += offset;
  }
  return insurance;
};

const multipleDeseriality = (data) => {
  const insurances = [];
  let offset = { offset: 0 };
  while ((offset.offset * -1) < data.length - 2) {
    insurances.push(deseriality(data, offset));
  }
  return insurances;
};

module.exports = { deseriality, multipleDeseriality };
