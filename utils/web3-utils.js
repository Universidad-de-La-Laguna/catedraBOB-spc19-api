'use-strict'

const Web3 = require('web3')
const EEAClient = require('web3-eea')
const config = require('../config')
const { logger } = require('./logger')

const chainId = 1337
const web3 = new EEAClient(new Web3(config.besu.thisnode.url), chainId)



/**
 * Obtiene el abi (datos de una función en solidity) de la función elegida
 * @param {Object} abi
 * @param {String} functionName
 * @param {Web3} web3
 * @returns {Object} Abi de la función elegida
 */
function getFunctionAbi(abi, functionName) {
    const contract = new web3.eth.Contract(abi)
    const functionAbi = contract._jsonInterface.find((e) => {
        return e.name === functionName
    })
    return functionAbi
}

/**
 * Obtiene la dirección del contrato añadido en la transacción elegida
 * @param {String} transactionHash
 * @param {String} pubKey
 * @returns {String} Dirección del contrato
 */
async function getContractAddress(transactionHash, pubKey) {
    logger.info('Getting contractAddress from txHash: ', transactionHash)

    const privateTransactionReceipt = await web3.priv.getTransactionReceipt(
      transactionHash,
      pubKey
    )

    logger.info(`Private Transaction Receipt: ${privateTransactionReceipt}`)
    
    return privateTransactionReceipt.contractAddress
}

/**
 * get public nonce of account
 * @returns public nonce of account
 */
function getPublicNonce() {
    return web3.eth.getTransactionCount(
        web3.eth.accounts.privateKeyToAccount(`0x${config.besu.thisnode.privateKey}`).address,
        "pending"
    )
}

/**
 * get nonce of account in the privacy group
 * @returns private nonce of privacy group
 */
function getPrivateNonce(privacyGroupId) {
    return web3.priv.getTransactionCount({
      from: web3.eth.accounts.privateKeyToAccount(`0x${config.besu.thisnode.privateKey}`).address,
      privateFrom: config.orion.taker.publicKey,
      privateFor: [config.orion.insurer.publicKey],
      privacyGroupId
    })
}

/**
 * create and sign PMT (Privacy Marker Transaction)
 * @param {*} sender 
 * @param {*} enclaveKey 
 * @param {*} nonce 
 * @returns 
 */
function sendPMT(sender, enclaveKey, nonce) {
    return new Promise((resolve, reject) => {
        const rawTx = {
        nonce: web3.utils.numberToHex(nonce), // PMT nonce
        from: sender,
        to: "0x000000000000000000000000000000000000007e", // privacy precompile address
        data: enclaveKey,
        // gasLimit: "0x5a88"
        gasLimit: "0xa00000"
        }

        web3.eth.accounts.signTransaction(rawTx, `0x${config.besu.thisnode.privateKey}`)
        .then(signed => {
            logger.info(`Signed transaction: ${JSON.stringify(signed)}`)

            web3.eth.sendSignedTransaction(signed.rawTransaction)
            .once("receipt", rcpt => {
                logger.info("RCPT")
                resolve(rcpt)
            })
            .on("error", error => {
                logger.error(error)
                reject(error)
            })
        })
        .catch(reject)
    })
}

/**
 * Send a raw transaction with parallel compatibility
 * @param {*} functionParams
 * @param {*} index offset to sum nonce to differ transactions
 * @param {String} privacyGroupId
 * @returns transaction receipt
 */
async function sendParallelTransaction(functionParams, index, privacyGroupId) {
    // Obtenemos el nonce privado
    const privateNonce = await getPrivateNonce(privacyGroupId)
    logger.info(`privateNonce: ${privateNonce} index: ${index}`)

    // Obtenemos el nonce publico
    const publicNonce = await getPublicNonce()
    logger.info(`publicNonce: ${publicNonce} index: ${index}`)

    // Incluir nonce en transacción de distribución.
    // nonce privado diferente para cada tx del pool invocada.
    functionParams = {
      ...functionParams,
      nonce: privateNonce + index
    }

    // distribute payload to participants
    const enclaveKey = await web3.priv.distributeRawTransaction(functionParams)

    // create and sign PMT (Private Marker Transaction)
    // nonce público diferente para cada tx del pool invocada
    const pmtRcpt = await sendPMT(
      web3.eth.accounts.privateKeyToAccount(`0x${config.besu.thisnode.privateKey}`).address,
      enclaveKey,
      publicNonce + index
    )

    logger.debug(pmtRcpt)

    // Obtenemos el recibo de la transacción
    const privTxRcpt = await web3.priv.getTransactionReceipt(
      pmtRcpt.transactionHash,
      config.besu.thisnode.privateKey
    )

    logger.debug(privTxRcpt)

    logger.info(
      `=== Private TX ${privTxRcpt.transactionHash}\n` +
        `  > Status ${privTxRcpt.status}\n` +
        `  > Block #${pmtRcpt.blockNumber}\n` +
        `  > PMT Index #${pmtRcpt.transactionIndex}\n` +
        `  > PMT Hash ${pmtRcpt.transactionHash}\n`
    )

    return privTxRcpt
}

/**
 * Crea un contrato con el bytecode elegido con las opciones elegidas
 * @param {String} bytecode
 * @param {String} privFor
 * @param {String} privacyGroupId
 * @param {Number} index In parallel transactions, offset to sum nonce to differ transactions 
 * @returns {String} Hash de la transacción
 */
 function createContract(bytecode, privateFor, privacyGroupId, index) {
    return new Promise(async function (resolve, reject) {
        try {
            // Creando contrato en nodo Mutua
            const contractOptions = {
                data: '0x' + bytecode,
                privateFrom: config.orion.taker.publicKey,
                privateFor,
                privateKey: config.besu.thisnode.privateKey,
            }
            logger.info('Creating contract...')
            let privTxRcpt
            let c

            // Send transaction in concurrent mode or not
            if (index) {
                logger.info('Launching concurrent transaction...')
                privTxRcpt = await sendParallelTransaction(contractOptions, index, privacyGroupId)
            }
            else {
                logger.info('Launching single transaction')
                c = await web3.eea.sendRawTransaction(contractOptions)
                privTxRcpt = await web3.priv.getTransactionReceipt(
                    c,
                    config.orion.taker.publicKey
                )
            }

            // Check if error
            if (typeof privTxRcpt === 'undefined') {
                logger.error(error)
                reject(error)
            } else if (privTxRcpt.revertReason) {
                let error = Web3Utils.toAscii('0x' + privTxRcpt.revertReason.slice(138))
                logger.error(error)
                reject({ code: '400', message: error })
            } else {
                resolve(c)
            }
        }
        catch (error) {
            logger.error(error)
            reject(error)
        }
    })
}

module.exports = {
    getFunctionAbi,
    getContractAddress,
    sendParallelTransaction,
    createContract
}