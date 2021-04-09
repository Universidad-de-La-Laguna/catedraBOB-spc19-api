const path = require('path');
const fs = require('fs-extra');
const Web3 = require('web3');
const EEAClient = require('web3-eea');

const { orion, besu } = require('./keys.js');
const chainId = 2018;
const mutuaNodeUrl = besu.member1.url;
const web3Mutua = new EEAClient(new Web3(mutuaNodeUrl), chainId);

let hotelId1 = '0x341f85f3eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce'.valueOf();
let hotelId2 = '0x341f85f3eca6304166fcfb6f591d49a6019f23fa39be0615e6417da06bf747ce'.valueOf();

const Spc19ContractPath = path.resolve(
  __dirname,
  '../',
  'contracts',
  'Spc19.json'
);


const hotelData = JSON.parse(fs.readFileSync('../data/spc19address.json'));
const Spc19ContractJSON = JSON.parse(fs.readFileSync(Spc19ContractPath));
const Spc19Abi = Spc19ContractJSON.abi;
const Spc19Bytecode = Spc19ContractJSON.evm.bytecode.object;

//deploying a contract with sendRawTransaction
async function createSPC19Contract(hotelPublicKey) {
  const contractOptions = {
    data: '0x' + Spc19Bytecode,
    privateFrom: orion.member1.publicKey,
    privateFor: [hotelPublicKey],
    privateKey: besu.member1.privateKey,
  };
  console.log('Creating contract...');
  const c = await web3Mutua.eea.sendRawTransaction(contractOptions);
  return c;
}

// get address of contract
async function getContractAddress(transactionHash) {
  console.log('Getting contractAddress from txHash: ', transactionHash);
  const privateTransactionReceipt = await web3Mutua.priv.getTransactionReceipt(
    transactionHash,
    orion.member1.publicKey
  );
  console.log(`Private Transaction Receipt: ${privateTransactionReceipt}`);
  return privateTransactionReceipt.contractAddress;
}

/**
 * Crea un nuevo contrato general para el hotel introducido
 * @param {String} hotelPublicKey 
 * @param {String} hotelId
 */
exports.deployGeneralContracts = async function (hotelPublicKey, hotelId) {
  let spcHotelContract = await createSPC19Contract(hotelPublicKey);
  hotelData.takerIdToSpc19addresses[hotelId] = await getContractAddress(spcHotelContract);
  hotelData.takerIdToPublicKey[hotelId] = hotelPublicKey;
  fs.writeFile('../data/spc19address.json', JSON.stringify(hotelData), (error) => {
    if (error) throw error;
  });
}

exports.deployGeneralContracts(orion.member2.publicKey, hotelId1);
