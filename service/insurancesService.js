'use-strict';
const path = require('path');
const fs = require('fs-extra');
const Web3 = require('web3');
const Web3Utils = require('web3-utils');
const EEAClient = require('web3-eea');
const config = require('../config');
const { deseriality, multipleDeseriality } = require('../scripts/deseriality');
const { throws } = require('assert');

const chainId = 1337;

const web3 = new EEAClient(new Web3(config.besu.thisnode.url), chainId);

const labPublicKey = config.orion.laboratory.publicKey;
const mutuaPublicKey = config.orion.insurer.publicKey;

// exports.setConfig = function (x) {
//   config.spc19ContractAddress.set(x);
// };

const insuranceContractPath = path.resolve(
  __dirname,
  '../',
  'contracts',
  'Insurance.json'
);
const PCRContractPath = path.resolve(__dirname, '../', 'contracts', 'PCR.json');
const Spc19ContractPath = path.resolve(
  __dirname,
  '../',
  'contracts',
  'Spc19.json'
);
const insuranceContractJSON = JSON.parse(
  fs.readFileSync(insuranceContractPath)
);
const PCRContractJSON = JSON.parse(fs.readFileSync(PCRContractPath));
const Spc19ContractJSON = JSON.parse(fs.readFileSync(Spc19ContractPath));
const insuranceAbi = insuranceContractJSON.abi;
const PCRAbi = PCRContractJSON.abi;
const Spc19Abi = Spc19ContractJSON.abi;
const insuranceBytecode = insuranceContractJSON.evm.bytecode.object;
const PCRBytecode = PCRContractJSON.evm.bytecode.object;
const Spc19Bytecode = Spc19ContractJSON.evm.bytecode.object;

/**
 * Crea un contrato con el bytecode elegido con las opciones elegidas
 * @param {String} bytecode
 * @param {String} privFrom
 * @param {String} privKey
 * @param {String} privFor
 * @param {Web3} web3
 * @returns {String} Hash de la transacción
 */
function createContract(bytecode, privFrom, privKey, privFor) {
  return new Promise(async function (resolve, reject) {
    // Creando contrato en nodo Mutua
    const contractOptions = {
      data: '0x' + bytecode,
      privateFrom: privFrom, // orion.member1.publicKey,
      privateFor: privFor, // [orion.member3.publicKey],
      privateKey: privKey, // besu.member1.privateKey
    };
    console.log('Creating contract...');
    const c = await web3.eea.sendRawTransaction(contractOptions);
    let hash = await web3.priv.getTransactionReceipt(
      c,
      config.orion.taker.publicKey
    );
    if (hash.revertReason) {
      let error = Web3Utils.toAscii('0x' + hash.revertReason.slice(138));
      console.log(
        error
      );
      reject({code: "400", message: error});
    }
    resolve(c);
  });
}

/**
 * Obtiene el abi (datos de una función en solidity) de la función elegida
 * @param {Object} abi
 * @param {String} functionName
 * @param {Web3} web3
 * @returns {Object} Abi de la función elegida
 */
async function getFunctionAbi(abi, functionName) {
  const contract = new web3.eth.Contract(abi);
  const functionAbi = contract._jsonInterface.find((e) => {
    return e.name === functionName;
  });
  return functionAbi;
}

/**
 * Obtiene la dirección del contrato añadido en la transacción elegida
 * @param {String} transactionHash
 * @param {String} pubKey
 * @param {Web3} web3
 * @returns {String} Dirección del contrato
 */
async function getContractAddress(transactionHash, pubKey) {
  console.log('Getting contractAddress from txHash: ', transactionHash);
  const privateTransactionReceipt = await web3.priv.getTransactionReceipt(
    transactionHash,
    pubKey
  );
  console.log(`Private Transaction Receipt: ${privateTransactionReceipt}`);
  return privateTransactionReceipt.contractAddress;
}

/**
 *
 * @param {Object} body body de petición de crear poliza
 * @returns {Array} En primera posición la información de la póliza y en segunda los pares de (PCRid, customerId) para añadir pcrs iniciales.
 */
function insuranceDataObjectToArray(body) {
  const hotelData = [
    body.taker.takerNif,
    body.taker.takerContactPostalCode,
    body.taker.takerContactTown,
    body.taker.takerContactLocation,
    body.taker.takerContactTelephone,
    body.taker.takerContactMobile,
    body.taker.takerIBAN,
  ].map((x) => Web3Utils.fromAscii(x));
  const insurancePrevPcrHash = [];
  const insurancePrevPcrDate = [];
  const ids = [body.id, body.taker.takerId].map((x) => Web3Utils.fromAscii(x));
  const insuredIds = [];
  const startFinishDate = [
    body.startDate,
    body.finishDate,
    body.contractDate,
  ].map((x) => parseInt(new Date(x).getTime() / 1000));
  const pcrIdCustomerIdPairs = [];
  for (const customer of body.customers) {
    insuredIds.push(Web3Utils.fromAscii(customer.customerId));
    insurancePrevPcrHash.push(customer.negativePcrHash);
    insurancePrevPcrDate.push(
      parseInt(new Date(customer.negativePcrDate).getTime() / 1000)
    );
  }
  for (const pcrRequest of body.pcrRequests) {
    pcrIdCustomerIdPairs.push({
      id: pcrRequest.id,
      customerId: pcrRequest.customerId,
    });
  }
  return [
    [
      insurancePrevPcrHash,
      insurancePrevPcrDate,
      ids,
      insuredIds,
      startFinishDate,
      [body.assuredPrice, config.businessParams.daysToCompensate],
      hotelData,
      body.taker.takerFullName,
      body.taker.takerContactAddress,
      body.taker.takerContactEmail,
    ],
    pcrIdCustomerIdPairs,
  ];
}

/**
 * Crea el contrato póliza y lo añade al contrato general
 * @param {Array} insuranceData Array con la información de la póliza
 * @returns {String} Address of the contract
 */
async function createInsurance(insuranceData) {
  let constrAbi = insuranceAbi[0];
  let constructorArguments = web3.eth.abi
    .encodeParameters(constrAbi.inputs, insuranceData)
    .slice(2);
  let insuranceContract = await createContract(
    insuranceBytecode + constructorArguments,
    config.orion.taker.publicKey, // PrivateFrom
    config.besu.thisnode.privateKey, // PrivateKey
    [mutuaPublicKey] // PrivateFor
  );
  let insuranceAddress = await getContractAddress(
    insuranceContract,
    config.orion.taker.publicKey
  );
  let funcAbi = await getFunctionAbi(Spc19Abi, 'addInsurance');
  let addInsuranceArguments = web3.eth.abi
    .encodeParameters(funcAbi.inputs, [insuranceAddress])
    .slice(2);
  let functionParams = {
    to: config.spc19ContractAddress.value(),
    data: funcAbi.signature + addInsuranceArguments,
    privateFrom: config.orion.taker.publicKey,
    privateFor: [mutuaPublicKey],
    privateKey: config.besu.thisnode.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  await web3.priv.getTransactionReceipt(
    transactionHash,
    config.orion.taker.publicKey
  );
  return insuranceAddress;
}

/**
 *
 * @param {Object} body {id, customerId}
 * @param {String} insuranceId
 * @param {Number} requestDate
 * @returns {String} Address of the contract
 */
async function createPCR(body, insuranceId, requestDate) {
  let constrAbi = PCRAbi[0];
  let constructorArguments = web3.eth.abi
    .encodeParameters(constrAbi.inputs, [
      Web3Utils.fromAscii(body.id),
      Web3Utils.fromAscii(insuranceId),
      Web3Utils.fromAscii(body.customerId),
      requestDate,
    ])
    .slice(2);
  let pcrContract = await createContract(
    PCRBytecode + constructorArguments,
    config.orion.taker.publicKey,
    config.besu.thisnode.privateKey,
    [labPublicKey]
  );
  let pcrAddress = await getContractAddress(
    pcrContract,
    config.orion.taker.publicKey
  );
  return pcrAddress;
}

/**
 * Devuelve la dirección del contrato de póliza con la id elegida
 * @param {String} insuranceId
 * @returns {String} address del contrato póliza
 */
async function getInsuranceAddressByInsuranceId(insuranceId) {
  let funcAbi = await getFunctionAbi(Spc19Abi, 'getAddressOfInsurance');
  let funcArguments = web3.eth.abi
    .encodeParameters(funcAbi.inputs, [Web3Utils.fromAscii(insuranceId)])
    .slice(2);
  let functionParams = {
    to: config.spc19ContractAddress.value(),
    data: funcAbi.signature + funcArguments,
    privateFrom: config.orion.taker.publicKey,
    privateFor: [mutuaPublicKey],
    privateKey: config.besu.thisnode.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    config.orion.taker.publicKey
  );
  let resultData = await web3.eth.abi.decodeParameters(
    funcAbi.outputs,
    result.output
  );
  return resultData[0];
}

/**
 * Añade la información de la PCR en el contrato de póliza
 * @param {Object} body {id, customerId}
 * @param {String} pcrAddress
 * @param {String} insuranceAddress
 * @param {Number} requestDate
 * @returns Hash of the transaction
 */
async function addPCR(body, insuranceAddress, requestDate, pcrAddress) {
  let funcAbi = await getFunctionAbi(insuranceAbi, 'addPCRtoInsured');
  let funcArguments = web3.eth.abi
    .encodeParameters(funcAbi.inputs, [
      Web3Utils.fromAscii(body.customerId),
      Web3Utils.fromAscii(body.id),
      requestDate,
      pcrAddress,
    ])
    .slice(2);
  let functionParams = {
    to: insuranceAddress,
    data: funcAbi.signature + funcArguments,
    privateFrom: config.orion.taker.publicKey,
    privateFor: [mutuaPublicKey],
    privateKey: config.besu.thisnode.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    config.orion.taker.publicKey
  );
  return result;
}

/**
 * Obtiene los datos de la pcr indicada de la póliza indicada
 * @param {Object} body {constractaddress} Dirección del contrato PCR si lo llama el Lab // no estoy seguro de que el laboratorio pueda llamar a esta función.
 * @param {String} insuranceId
 * @param {String} pcrRequestId
 * @returns
 */
async function getDataPCR(insuranceId, pcrRequestId, contractaddress) {
  let funcAbi,
    funcArguments,
    funcData,
    contractAddress,
    privateFor,
    privateFrom;
  if (config.businessParams.nodeRole !== 'laboratory') {
    privateFrom = config.orion.taker.publicKey;
    funcAbi = await getFunctionAbi(insuranceAbi, 'getPCR');
    funcArguments = web3.eth.abi
      .encodeParameters(funcAbi.inputs, [Web3Utils.fromAscii(pcrRequestId)])
      .slice(2);
    contractAddress = await getInsuranceAddressByInsuranceId(insuranceId);
    funcData = funcAbi.signature + funcArguments;
    privateFor = [mutuaPublicKey];
  } else {
    privateFrom = config.orion.laboratory.publicKey;
    funcAbi = await getFunctionAbi(PCRAbi, 'getPCRData');
    if (contractaddress === undefined) throw {code: 400, message: "Falta añadir el address del contrato PCR como querystring"};
    contractAddress = contractaddress;
    funcData = funcAbi.signature;
    privateFor = [config.orion.taker.publicKey];
  }
  let functionParams = {
    to: contractAddress,
    data: funcData,
    privateFrom: privateFrom,
    privateFor: privateFor,
    privateKey: config.besu.thisnode.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    config.orion.taker.publicKey
  );
  let resultData = await web3.eth.abi.decodeParameters(
    funcAbi.outputs,
    result.output
  );
  let pcrInfo = {
    result: Web3Utils.toUtf8(resultData['0']),
    customerId: resultData['1'],
    requestDate: new Date(parseInt(resultData['2']) * 1000).toISOString(),
    resultDate: new Date(parseInt(resultData['3']) * 1000).toISOString(),
    id: resultData['4'],
    address: resultData['5'],
  };
  console.log(pcrInfo);
  return pcrInfo;
}

/**
 * Actualiza la pcr en el contrato PCR
 * @param {Object} body {result}
 * @param {String} pcrAddress
 * @param {String} insuranceId
 * @param {Number} resultDate
 * @returns Hash of the transaction
 */
async function updatePCR(
  body,
  insuranceId,
  pcrRequestId,
  contractaddress,
  resultDate
) {
  return new Promise(async function (resolve, reject) {
    let funcAbi = await getFunctionAbi(PCRAbi, 'updatePCR');
    let funcArguments = web3.eth.abi
      .encodeParameters(funcAbi.inputs, [
        Web3Utils.fromAscii(body.result),
        resultDate,
        Web3Utils.fromAscii(insuranceId),
        Web3Utils.fromAscii(pcrRequestId),
      ])
      .slice(2);
    let functionParams = {
      to: contractaddress,
      data: funcAbi.signature + funcArguments,
      privateFrom: config.orion.laboratory.publicKey,
      privateFor: [config.orion.taker.publicKey],
      privateKey: config.besu.thisnode.privateKey,
    };
    let transactionHash = await web3.eea.sendRawTransaction(functionParams);
    console.log(`Transaction hash: ${transactionHash}`);
    let result = await web3.priv.getTransactionReceipt(
      transactionHash,
      config.orion.laboratory.publicKey
    );
    if (result.revertReason) {
      let error = Web3Utils.toAscii('0x' + result.revertReason.slice(138));
      console.log(
        error
      );
      reject({code: "400", message: error});
    }
    resolve(result);
  });
}

/**
 * Elimina la PCR elegida de la póliza indicada
 * @param {String} insuranceId
 * @param {String} pcrRequestId
 * @returns Hash of the transaction
 */
async function deletePCRInsurance(insuranceId, pcrRequestId) {
  let funcAbi = await getFunctionAbi(insuranceAbi, 'deletePCR');
  let funcArguments = web3.eth.abi
    .encodeParameters(funcAbi.inputs, [Web3Utils.fromAscii(pcrRequestId)])
    .slice(2);
  let insuranceAddress = await getInsuranceAddressByInsuranceId(insuranceId);
  let functionParams = {
    to: insuranceAddress,
    data: funcAbi.signature + funcArguments,
    privateFrom: config.orion.taker.publicKey,
    privateFor: [mutuaPublicKey],
    privateKey: config.besu.thisnode.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    config.orion.taker.publicKey
  );
  let resultData = await web3.eth.abi.decodeParameters(
    funcAbi.outputs,
    result.output
  );
  return resultData[0];
}

/**
 * Elimina la PCR elegida pcrRequestId
 * @param {String} contractaddress
 * @returns
 */
async function deletePCR(contractaddress) {
  let funcAbi = await getFunctionAbi(PCRAbi, 'deletePCR');
  let functionParams = {
    to: contractaddress,
    data: funcAbi.signature,
    privateFrom: config.orion.taker.publicKey,
    privateFor: [labPublicKey],
    privateKey: config.besu.thisnode.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    config.orion.taker.publicKey
  );
  return result;
}

/**
 * Función que obtiene los datos de las pólizas de un determinado hotel
 * @param {Object} body
 * @returns
 */
async function getAllInsurancePolicyHotel(body) {
  let funcAbi = await getFunctionAbi(Spc19Abi, 'getAllInsurances');
  let functionParams = {
    to: config.spc19ContractAddress.value(),
    data: funcAbi.signature,
    privateFrom: config.orion.taker.publicKey,
    privateFor: [mutuaPublicKey],
    privateKey: config.besu.thisnode.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    config.orion.taker.publicKey
  );
  if (result.revertReason) {
    let error = Web3Utils.toAscii('0x' + result.revertReason.slice(138));
    console.log(
      error
    );
    reject({code: "400", message: error});
  }
  let resultData = await web3.eth.abi.decodeParameters(
    funcAbi.outputs,
    result.output
  );
  let insurancesData = multipleDeseriality(resultData[0]);
  console.log(insurancesData);
  return insurancesData;
}

/**
 * Función que obtiene los datos de las pólizas de todos los hoteles de la mutua
 * @param {Object} body {publicKey, privateKey, nodeUrl}
 * @returns
 */
async function getAllInsurancePolicyMutua(body) {
  let funcAbi = await getFunctionAbi(Spc19Abi, 'getAllInsurances');
  let insurancesTotalData = [];
  // for (iterar entre todos los contratos generales de todos los hoteles) {
  let functionParams = {
    to: config.spc19ContractAddress.value(), // aqui
    data: funcAbi.signature,
    privateFrom: mutuaPublicKey,
    privateFor: [config.orion.taker.publicKey], // aqui
    privateKey: config.besu.thisnode.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    mutuaPublicKey
  );
  let resultData = await web3.eth.abi.decodeParameters(
    funcAbi.outputs,
    result.output
  );
  let insurancesData = multipleDeseriality(resultData[0]);
  insurancesTotalData = insurancesTotalData.concat(insurancesData);
  console.log(insurancesTotalData);
  return insurancesTotalData;
}

/**
 * register new insurance policy
 * Add a new insurance policy to the system
 *
 * body InsuranceItem Insurance item to add (optional)
 * no response value expected for this operation
 **/
exports.addInsurancePolicy = function (body) {
  return new Promise(async function (resolve, reject) {
    //TODO
    if (config.businessParams.nodeRole !== 'taker') {
      reject('Sólo los takers pueden crear pólizas');
    }
    const datos = insuranceDataObjectToArray(body);
    createInsurance(datos[0])
      .then((hotelInsuranceAddress) => {
        // TODO
        // Añadir el evento de checkpayment y el de positive PCR para mutua y hotel
        Promise.all(
          datos[1].map((pcrInfoPair) => {
            exports.addPcrRequest(pcrInfoPair, body.id);
          })
        )
          .then((res) => {
            console.log(
              `Poliza añadida correctamente, address: ${hotelInsuranceAddress}`
            );
            resolve();
          })
          .catch((error) => {
            console.log('Error al crear las PCR correspondientes', error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log('Error al crear la póliza', error);
        reject(error);
      });
  });
};

/**
 * get all insurance policies
 * Insurer get all policies and hostelry only owns
 *
 * return List
 */
exports.getAllInsurancePolicy = function (body) {
  return new Promise(async function (resolve, reject) {
    //TODO
    // Depende si se llama desde el hotel o de la mutua debe dar resultados
    // diferentes ya que la mutua ve todas las pólizas y el hotel solo las suyas
    if (config.businessParams.nodeRole === 'taker') {
      getAllInsurancePolicyHotel(body)
        .then((res) => {
          console.log('Pólizas recuperadas con éxito');
          resolve(res);
        })
        .catch((error) => {
          console.log('Error obteniendo polizas de hotel: ', error);
          reject(error);
        });
    } else if (config.businessParams.nodeRole === 'insurer') {
      getAllInsurancePolicyMutua(body)
        .then((res) => {
          console.log('Pólizas recuperadas con éxito');
          resolve(res);
        })
        .catch((error) => {
          console.log('Error obteniendo polizas de Mutua: ', error);
          reject(error);
        });
    } else {
      reject('EL laboratorio no puede consultar pólizas');
    }
  });
};

/**
 * new PCR test request to a customer
 * Hotel create a new PCR Request to check-in os a customer
 *
 * body PcrRequestItem PCR Request to create {id, customerId}
 * insuredId insuranceId
 * no response value expected for this operation
 **/
exports.addPcrRequest = function (body, insuranceId) {
  return new Promise(async function (resolve, reject) {
    //TODO
    if (config.businessParams.nodeRole !== 'taker') {
      reject('Sólo los takers pueden crear solicitudes de PCR');
    }
    const requestDate = parseInt(new Date().getTime() / 1000);
    // Create PCR
    createPCR(body, insuranceId, requestDate)
      .catch((error) => {
        console.log('Error al crear contrato PCR: ', error);
        reject(error);
      })
      .then((pcrAddress) => {
        getInsuranceAddressByInsuranceId(insuranceId).then(
          (insuranceAddress) => {
            addPCR(body, insuranceAddress, requestDate, pcrAddress).then(
              (res) => {
                console.log('PCR Añadida con éxito, address: ', pcrAddress);
                resolve();
              }
            );
          }
        );
      })
      .catch((error) => {
        console.log('Error al añadir PCR a póliza: ', error);
        reject(error);
      });
  });
};

/**
 * get all PCR Request of a customer
 * Get state of all PCR Request of a customer
 *
 * customerId CustomerId
 * returns PcrRequestItem
 **/
exports.getPcrRequest = function (insuranceId, pcrRequestId, contractaddress) {
  return new Promise(async function (resolve, reject) {
    //TODO
    getDataPCR(insuranceId, pcrRequestId, contractaddress)
      .then((result) => {
        console.log('PCR recuperada con éxito');
        resolve(result);
      })
      .catch((error) => {
        console.log('Obtener datos de PCR ha fallado: ', error);
        reject(error);
      });
  });
};

/**
 * set result of an PCR test
 * Laboratory set the PCR Request Result
 *
 * body String  (optional)
 * insuranceId InsuranceId
 * pcrRequestId PcrId
 * pcrRequestContractAddress contract address for PCRRequestId
 * no response value expected for this operation
 **/
exports.setResultPcrRequest = function (
  body,
  insuranceId,
  pcrRequestId,
  contractaddress
) {
  return new Promise(async function (resolve, reject) {
    //TODO
    if (config.businessParams.nodeRole !== 'laboratory') {
      reject('Sólo el laboratorio puede actualizar las PCRs');
    }
    const resultDate = parseInt(new Date().getTime() / 1000);
    updatePCR(body, insuranceId, pcrRequestId, contractaddress, resultDate)
      .then((res) => {
        console.log('PCR actualizada');
        resolve();
      })
      .catch((error) => {
        console.log('Error al actualizar PCR: ', error);
        reject(error);
      });
  });
};

/**
 * Cancel a PCR Request
 * Cancel an existing PCR Request
 *
 * body String  (optional)
 * insuranceId InsuranceId
 * pcrRequestId PcrId
 * no response value expected for this operation
 */
exports.deletePcrRequest = function (insuranceId, pcrRequestId) {
  return new Promise(async function (resolve, reject) {
    //TODO
    if (config.businessParams.nodeRole !== 'taker') {
      reject('Sólo los takers pueden borrar PCRs');
    }
    deletePCRInsurance(insuranceId, pcrRequestId)
      .then((contractadress) => {
        deletePCR(contractadress)
          .then(() => {
            console.log('PCR eliminada con éxito');
            resolve();
          })
          .catch((error) => {
            console.log('Error al borrar PCR en contrato PCR: ', error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log('Error al borrar PCR en la póliza: ', error);
        reject(error);
      });
  });
};

/**
 * order payment for insurance policy
 * Order the payment to customer for accomplishment of blockchain contract
 *
 * insuranceId InsuranceId
 * no response value expected for this operation
 **/
exports.checkPayment = function (insuranceId) {
  return new Promise(function (resolve, reject) {
    //TODO
    resolve();
  });
};
