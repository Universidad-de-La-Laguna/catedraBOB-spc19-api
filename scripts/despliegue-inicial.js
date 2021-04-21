const path = require('path');
const fs = require('fs-extra');
const Web3 = require('web3');
const EEAClient = require('web3-eea');
const config = require('../config')
const { logger } = require("../utils/logger")

const chainId = 1337;
const web3Mutua = new EEAClient(new Web3(config.besu.thisnode.url), chainId);

const Spc19ContractPath = path.resolve(
  __dirname,
  '../',
  'contracts',
  'Spc19.json'
);

const Spc19ContractJSON = JSON.parse(fs.readFileSync(Spc19ContractPath));
const Spc19Bytecode = Spc19ContractJSON.evm.bytecode.object;

//deploying a contract with sendRawTransaction
async function createSPC19Contract(privateFrom, privateForItem, privateKey) {
  const contractOptions = {
    data: '0x' + Spc19Bytecode,
    privateFrom,
    privateFor: [privateForItem],
    privateKey
  };
  logger.info('Creating contract...');
  const c = await web3Mutua.eea.sendRawTransaction(contractOptions);
  return c;
}

// get address of contract
async function getContractAddress(transactionHash, nodePublicKey) {
  logger.info('Getting contractAddress from txHash: %s', transactionHash)
  const privateTransactionReceipt = await web3Mutua.priv.getTransactionReceipt(
    transactionHash,
    nodePublicKey
  )
  // logger.info(`Private Transaction Receipt: ${JSON.stringify(privateTransactionReceipt)}`);
  return privateTransactionReceipt.contractAddress
}

/**
 * Crea un nuevo contrato general para el hotel introducido
 * @param {String} insurerPublicKey 
 * @param {String} hotelId
 */
exports.deployGeneralContracts = async function (takerPublicKey, insurerPublicKey, takerPrivateKey) {
  let spcHotelContract = await createSPC19Contract(takerPublicKey, insurerPublicKey, takerPrivateKey)
  let contractAddressDeployed = await getContractAddress(spcHotelContract, takerPublicKey)
  
  logger.info("Deployed SPC19 contract address: %s", contractAddressDeployed)
  return contractAddressDeployed
}