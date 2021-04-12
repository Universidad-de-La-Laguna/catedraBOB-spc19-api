'use-strict';
const path = require('path');
const fs = require('fs-extra');
const Web3 = require('web3');
const Web3Utils = require('web3-utils');
const EEAClient = require('web3-eea');
const { deseriality, multipleDeseriality } = require('../scripts/deseriality');

const { orion, besu } = require('../scripts/keys.js');
const chainId = 2018;
// Datos de la "base de datos"
const data = JSON.parse(fs.readFileSync('../data/data.json'));

// Guarda la información de las pólizas y las direcciones de sus contratos en los distintos nodos
const insuranceIdsToHotelData = data.insuranceIdsToHotelData;
// Guarda la información de las PCRs y las direcciones de sus contratos en los distintos nodos
const pcrIdsToAddress = data.pcrIdsToAddress;
// Guarda la dirección del contrato general para cada nodo
const hotelData = JSON.parse(fs.readFileSync('../data/spc19address.json'));

const takerIdToSpc19addresses = hotelData.takerIdToSpc19addresses;
const takerIdToPublicKey = hotelData.takerIdToPublicKey;

const labPublicKey = orion.member3.publicKey;
const mutuaPublicKey = orion.member1.publicKey;

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
 * @returns 
 */
async function createContract(bytecode, privFrom, privKey, privFor, web3) {
  // Creando contrato en nodo Mutua
  const contractOptions = {
    data: '0x' + bytecode,
    privateFrom: privFrom, // orion.member1.publicKey,
    privateFor: privFor, // [orion.member3.publicKey],
    privateKey: privKey, // besu.member1.privateKey
  };
  console.log('Creating contract...');
  const c = await web3.eea.sendRawTransaction(contractOptions);
  return c;
}

/**
 * Obtiene el abi (datos de una función en solidity) de la función elegida
 * @param {Object} abi 
 * @param {String} functionName 
 * @param {Web3} web3 
 * @returns 
 */
async function getFunctionAbi(abi, functionName, web3) {
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
 * @returns 
 */
async function getContractAddress(transactionHash, pubKey, web3) {
  // Obteniendo direccion en nodo mutua
  console.log('Getting contractAddress from txHash: ', transactionHash);
  const privateTransactionReceipt = await web3.priv.getTransactionReceipt(
    transactionHash,
    pubKey
  ); // orion.member1.publicKey);
  console.log(`Private Transaction Receipt: ${privateTransactionReceipt}`);
  return privateTransactionReceipt.contractAddress;
}

/**
 *
 * @param {Object} body {nodeUrl, publicKey, privateKey, insuranceData}
 * @returns {String} Address of the contract
 */
async function createInsurance(body) {
  const web3 = new EEAClient(new Web3(body.nodeUrl), chainId);
  let constrAbi = insuranceAbi[0];
  let constructorArguments = web3.eth.abi
    .encodeParameters(constrAbi.inputs, body.insuranceData)
    .slice(2);
  let insuranceContract = await createContract(
    insuranceBytecode + constructorArguments,
    body.publicKey, // PrivateFrom
    body.privateKey, // PrivateKey
    [mutuaPublicKey], // PrivateFor
    web3
  );
  let insuranceAddress = await getContractAddress(
    insuranceContract,
    body.publicKey,
    web3
  );
  let funcAbi = await getFunctionAbi(Spc19Abi, 'addInsurance', web3);
  let addInsuranceArguments = web3.eth.abi
    .encodeParameters(funcAbi.inputs, [insuranceAddress])
    .slice(2);
  let functionParams = {
    to: takerIdToSpc19addresses[body.insuranceData[2][1]],
    data: funcAbi.signature + addInsuranceArguments,
    privateFrom: body.publicKey,
    privateFor: [mutuaPublicKey],
    privateKey: body.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  await web3.priv.getTransactionReceipt(
    transactionHash,
    body.publicKey
  );
  return insuranceAddress;
}

/**
 *
 * @param {Object} body {nodeUrl, publicKey, privateKey, id}
 * @param {String} insuranceId
 * @param {Number} requestDate
 * @returns {String} Address of the contract
 */
async function createPCR(body, insuranceId, requestDate) {
  const web3 = new EEAClient(new Web3(body.nodeUrl), chainId);
  let constrAbi = PCRAbi[0];
  let constructorArguments = web3.eth.abi
    .encodeParameters(constrAbi.inputs, [
      body.id,
      insuranceId,
      body.customerId,
      requestDate,
    ])
    .slice(2);
  let pcrContract = await createContract(
    PCRBytecode + constructorArguments,
    body.publicKey,
    body.privateKey,
    [labPublicKey],
    web3
  );
  let pcrAddress = await getContractAddress(pcrContract, body.publicKey, web3);
  // let result = await web3.priv.getTransactionReceipt(
  //   pcrContract,
  //   body.publicKey
  // );
  // console.log(result);
  return pcrAddress;
}

/**
 *
 * @param {Object} body {nodeUrl, publicKey, privateKey, insuredId}
 * @param {String} pcrAddress
 * @param {String} insuranceAddress
 * @param {Number} requestDate
 * @returns Hash of the transaction
 */
async function addPCR(body, insuranceAddress, requestDate) {
  const web3 = new EEAClient(new Web3(body.nodeUrl), chainId);
  let funcAbi = await getFunctionAbi(insuranceAbi, 'addPCRtoInsured', web3);
  let funcArguments = web3.eth.abi
    .encodeParameters(funcAbi.inputs, [body.customerId, body.id, requestDate])
    .slice(2);
  let functionParams = {
    to: insuranceAddress,
    data: funcAbi.signature + funcArguments,
    privateFrom: body.publicKey,
    privateFor: [mutuaPublicKey],
    privateKey: body.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    body.publicKey
  );
  return result;
}

/**
 * Obtiene los datos de la pcr indicada de la póliza indicada
 * @param {Object} body {publicKey, privateKey, nodeUrl}
 * @param {String} insuranceId 
 * @param {String} pcrRequestId 
 * @returns 
 */
async function getDataPCR(body, insuranceId, pcrRequestId) {
  const web3 = new EEAClient(new Web3(body.nodeUrl), chainId);
  let funcAbi, funcArguments, funcData, contractAddress, privateFor;
  if (body.publicKey != labPublicKey) {
    funcAbi = await getFunctionAbi(insuranceAbi, 'getPCR', web3);
    funcArguments = web3.eth.abi
      .encodeParameters(funcAbi.inputs, [pcrRequestId])
      .slice(2);
    contractAddress =
      insuranceIdsToHotelData[insuranceId].hotelInsuranceAddress;
    funcData = funcAbi.signature + funcArguments;
    privateFor = [mutuaPublicKey];
  } else {
    funcAbi = await getFunctionAbi(PCRAbi, 'getPCRData', web3);
    contractAddress = pcrIdsToAddress[pcrRequestId].Address;
    funcData = funcAbi.signature;
    privateFor = [insuranceIdsToHotelData[insuranceId].publicKey];
  }
  let functionParams = {
    to: contractAddress,
    data: funcData,
    privateFrom: body.publicKey,
    privateFor: privateFor,
    privateKey: body.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    body.publicKey
  );
  let resultData = await web3.eth.abi.decodeParameters(
    funcAbi.outputs,
    result.output
  );
  let pcrInfo = {
    result: Web3Utils.toUtf8(resultData['0']),
    customerId: resultData['1'],
    requestDate: parseInt(resultData['2'] * 1000),
    resultDate: parseInt(resultData['3'] * 1000),
    id: resultData['4'],
  };
  console.log(pcrInfo);
  return pcrInfo;
}

/**
 *
 * @param {Object} body {nodeUrl, publicKey, privateKey, result}
 * @param {String} pcrAddress
 * @param {String} insuranceId
 * @param {Number} resultDate
 * @returns Hash of the transaction
 */
async function updatePCR(body, pcrAddress, insuranceId, resultDate) {
  const web3 = new EEAClient(new Web3(body.nodeUrl), chainId);
  let funcAbi = await getFunctionAbi(PCRAbi, 'updatePCR', web3);
  let funcArguments = web3.eth.abi
    .encodeParameters(funcAbi.inputs, [
      Web3Utils.fromAscii(body.result),
      resultDate,
    ])
    .slice(2);
  let functionParams = {
    to: pcrAddress, // ???
    data: funcAbi.signature + funcArguments,
    privateFrom: body.publicKey,
    privateFor: [insuranceIdsToHotelData[insuranceId].publicKey],
    privateKey: body.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    body.publicKey
  );
  return result;
}

/**
 * Elimina la PCR elegida de la póliza indicada
 * @param {Object} body {nodeUrl, publicKey, privateKey}
 * @param {String} insuranceId
 * @param {String} pcrRequestId
 * @returns Hash of the transaction
 */
async function deletePCRInsurance(body, insuranceId, pcrRequestId) {
  const web3 = new EEAClient(new Web3(body.nodeUrl), chainId);
  let funcAbi = await getFunctionAbi(insuranceAbi, 'deletePCR', web3);
  let funcArguments = web3.eth.abi
    .encodeParameters(funcAbi.inputs, [pcrRequestId])
    .slice(2);
  let functionParams = {
    to: insuranceIdsToHotelData[insuranceId].hotelInsuranceAddress,
    data: funcAbi.signature + funcArguments,
    privateFrom: body.publicKey,
    privateFor: [mutuaPublicKey],
    privateKey: body.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    body.publicKey
  );
  return result;
}

/**
 * Elimina la PCR elegida del contrato PCR que la contiene
 * @param {Object} body {publicKey, privateKey, nodeUrl}
 * @param {String} pcrRequestId 
 * @returns 
 */
async function deletePCR(body, pcrRequestId) {
  const web3 = new EEAClient(new Web3(body.nodeUrl), chainId);
  let funcAbi = await getFunctionAbi(PCRAbi, 'deletePCR', web3);
  let functionParams = {
    to: pcrIdsToAddress[pcrRequestId].Address,
    data: funcAbi.signature,
    privateFrom: body.publicKey,
    privateFor: [labPublicKey],
    privateKey: body.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    body.publicKey
  );
  return result;
}

/**
 * register new insurance policy
 * Add a new insurance policy to the system
 *
 * body InsuranceItem Insurance item to add (optional)
 * no response value expected for this operation
 **/
exports.addInsurancePolicy = function (body) {
  // se debe añadir al hotel que crea la poliza para colocar sus claves publicas y/o privadas
  // para que la transacción sea privada para ellos también y así evitar que el resto de hoteles
  // la vean
  return new Promise(async function (resolve, reject) {
    //TODO
    createInsurance(body).then((hotelInsuranceAddress) => {
      insuranceIdsToHotelData[body.insuranceData[2][0]] = {
        publicKey: body.publicKey,
        hotelInsuranceAddress: hotelInsuranceAddress,
      };
      // TODO
      // Añadir el evento de checkpayment y el de positive PCR para mutua y hotel
      fs.writeFileSync(
        '../catedraBOB-spc19-api/data/data.json',
        JSON.stringify({
          insuranceIdsToHotelData,
          pcrIdsToAddress,
        })
      );
      resolve();
    });
  }).catch((error) => {
    console.log('Error al crear la póliza', error);
  });
};

/**
 * Función que obtiene los datos de las pólizas de un determinado hotel
 * @param {Object} body {publicKey, privateKey, nodeUrl}
 * @returns 
 */
async function getAllInsurancePolicyHotel(body) {
  const web3 = new EEAClient(new Web3(body.nodeUrl), chainId);
  let funcAbi = await getFunctionAbi(Spc19Abi, 'getAllInsurances', web3);
  let functionParams = {
    to: takerIdToSpc19addresses[body.takerId],
    data: funcAbi.signature,
    privateFrom: body.publicKey,
    privateFor: [mutuaPublicKey],
    privateKey: body.privateKey,
  };
  let transactionHash = await web3.eea.sendRawTransaction(functionParams);
  console.log(`Transaction hash: ${transactionHash}`);
  let result = await web3.priv.getTransactionReceipt(
    transactionHash,
    body.pubKey
  );
  let resultData = await web3.eth.abi.decodeParameters(
    ['bytes'],
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
  const web3 = new EEAClient(new Web3(body.nodeUrl), chainId);
  let funcAbi = await getFunctionAbi(Spc19Abi, 'getAllInsurances', web3);
  let insurancesTotalData = [];
  for (const property in takerIdToSpc19addresses) {
    let functionParams = {
      to: takerIdToSpc19addresses[property],
      data: funcAbi.signature,
      privateFrom: body.publicKey,
      privateFor: [takerIdToPublicKey[property]],
      privateKey: body.privateKey,
    };
    let transactionHash = await web3.eea.sendRawTransaction(functionParams);
    console.log(`Transaction hash: ${transactionHash}`);
    let result = await web3.priv.getTransactionReceipt(
      transactionHash,
      body.pubKey
    );
    let resultData = await web3.eth.abi.decodeParameters(
      ['bytes'],
      result.output
    );
    let insurancesData = multipleDeseriality(resultData[0]);
    insurancesTotalData = insurancesTotalData.concat(insurancesData);
  }
  console.log(insurancesTotalData);
  return insurancesTotalData;
}

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
    // Por ello especificar el nodeUrl (si es el de la mutua o el de un hotel)
    if (body.publicKey != mutuaPublicKey) {
      getAllInsurancePolicyHotel(body)
        .then((res) => resolve(res))
        .catch((error) => {
          console.log('Error obteniendo polizas de hotel: ', error);
          reject(error);
        });
    } else {
      getAllInsurancePolicyMutua(body)
        .then((res) => resolve(res))
        .catch((error) => {
          console.log('Error obteniendo polizas de Mutua: ', error);
          reject(error);
        });
    }
  });
};

/**
 * new PCR test request to a customer
 * Hotel create a new PCR Request to check-in os a customer
 *
 * body PcrRequestItem PCR Request to create
 * insuredId insuranceId
 * no response value expected for this operation
 **/
exports.addPcrRequest = function (body, insuranceId) {
  return new Promise(async function (resolve, reject) {
    //TODO
    const requestDate = parseInt(new Date().getTime() / 1000);
    // Create PCR
    createPCR(body, insuranceId, requestDate)
      .catch((error) => {
        console.log('Error al crear contrato PCR: ', error);
        reject(error);
      })
      .then((pcrAddress) => {
        pcrIdsToAddress[body.id] = {
          Address: pcrAddress,
          insuranceId: insuranceId,
        };
        resolve(
          addPCR(
            body,
            insuranceIdsToHotelData[insuranceId].hotelInsuranceAddress,
            requestDate
          )
        );
      })
      .catch((error) => {
        console.log('Error al añadir PCR a póliza: ', error);
        reject(error);
      })
      .then((res) => {
        fs.writeFile(
          '../data/data.json',
          JSON.stringify({
            insuranceIdsToHotelData,
            pcrIdsToAddress,
          }),
          (error) => {
            if (error) throw error;
          }
        );
        // TODO
        // Añadir el evento de  updatePCR para el hotel
        resolve();
      });
  }).catch((error) => {
    console.log('Error en al añadir PCR', error);
  });
};

/**
 * get all PCR Request of a customer
 * Get state of all PCR Request of a customer
 *
 * customerId CustomerId
 * returns PcrRequestItem
 **/
exports.getPcrRequest = function (body, insuranceId, pcrRequestId) {
  return new Promise(async function (resolve, reject) {
    //TODO
    getDataPCR(body, insuranceId, pcrRequestId)
      .catch((error) => {
        console.log('Obtener datos de PCR ha fallado: ', error);
        reject(error);
      })
      .then((result) => {
        resolve(result);
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
exports.setResultPcrRequest = function (body, insuranceId, pcrRequestId, pcrRequestContractAddress) {
  return new Promise(async function (resolve, reject) {
    //TODO
    const resultDate = parseInt(new Date().getTime() / 1000);
    updatePCR(
      body,
      pcrIdsToAddress[pcrRequestId].Address,
      insuranceId,
      resultDate
    )
      .then((res) => resolve())
      .catch((error) => {
        console.log('Error al actualizar PCR: ', error);
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
exports.deletePcrRequest = function (body, insuranceId, pcrRequestId) {
  return new Promise(async function (resolve, reject) {
    //TODO
    deletePCRInsurance(body, insuranceId, pcrRequestId)
      .catch((error) => {
        console.log('Error al borrar PCR en la póliza: ', error);
        reject(error);
      })
      .then((result) => {
        deletePCR(body, pcrRequestId);
      })
      .catch((error) => {
        console.log('Error al borrar PCR en contrato PCR: ', error);
        reject(error);
      })
      .then(() => resolve());
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
