const {readFileSync} = require("fs");
const path = require("path")
const nodemailer = require('nodemailer')
const config = require('../config')
const { logger } = require("./logger")

const labMailTemplate = readFileSync(path.join(__dirname, "mailTemplates", "labMail.template")).toString()
const labMailNoDataTemplate = readFileSync(path.join(__dirname, "mailTemplates", "labMail__noData.template")).toString()

function sendEmail(email, subject, text, html) {
    logger.info(`Sending validation email to ${email} with subject '${subject}'`)

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: config.EMAIL.SMTP.SERVICE,
        auth: {
            user: config.EMAIL.SMTP.AUTH.USERNAME, // generated ethereal user
            pass: config.EMAIL.SMTP.AUTH.PASSWORD // generated ethereal password
        }
    })

    // setup email data with unicode symbols
    let mailOptions = {
        from: `"${config.EMAIL.SMTP.FROM.NAME}" <${config.EMAIL.SMTP.FROM.EMAIL}>`, // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: html // html body
    }

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error(error);
            return 
        }
        logger.info('Message sent: %s', info.messageId)
    })
}

function sendEmailToLaboratory(insuranceId, pcrRequestId, pcrContractAddress, customerData) {
    //personalizar el link dependiendo del proveedor y la direccion del contrato
    let link = config.EMAIL.LINK_DEST_UPDATEPCR
    link = link.replace('<INSURANCEID>', insuranceId)
    link = link.replace('<PCRREQUESTID>', pcrRequestId)
    link = link.replace('<PCRCONTRACTADDRESS>', pcrContractAddress)

    let emailText = `Hola,\nSe ha creado una nueva solicitud de PCR asociada al cliente con identificador ${customerData.customerId}.\nPara actualizarla pulsa en el siguiente enlace ${link}\n`
    let mailTemplate = labMailNoDataTemplate
    let emailSubject = "Nueva PCR para cliente ya existente"
    
    // Si vienen datos personales del cliente, los incluyo
    if (customerData.customerFullName) {
        mailTemplate = labMailTemplate
        emailSubject = "Nueva solicitud de PCR"
        emailText += `Los datos del cliente son los siguientes:\n   - Nombre: ${customerData.customerFullName}\n   - Teléfono: ${customerData.customerTelephone}\n   - Email: ${customerData.customerEmail}`
    }

    const emailHtml = mailTemplate
      .replace(/\<INSURANCEID\>/g, insuranceId)
      .replace(/\<PCRREQUESTID\>/g, pcrRequestId)
      .replace(/\<PCRCONTRACTADDRESS\>/g, pcrContractAddress)
      .replace(/\<NAME\>/g, customerData.customerFullName)
      .replace(/\<EMAIL\>/g, customerData.customerEmail)
      .replace(/\<PHONE\>/g, customerData.customerTelephone);

    // send email
    sendEmail(
        config.EMAIL.laboratoryEmail,
        emailSubject,
        emailText,
        emailHtml
    )
}

module.exports = {
    sendEmailToLaboratory
}