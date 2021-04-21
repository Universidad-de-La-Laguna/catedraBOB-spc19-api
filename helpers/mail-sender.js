const nodemailer = require('nodemailer')
const config = require('../config')

function sendEmail(email, subject, text, html) {
    console.log(`Sending validation email to ${email} with subject '${subject}'`)

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
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId)
    })
}

function sendEmailToLaboratory(insuranceId, pcrRequestId, pcrContractAddress) {
    //personalizar el link dependiendo del proveedor y la direccion del contrato
    let link = config.EMAIL.LINK_DEST_UPDATEPCR
    link = link.replace('<INSURANCEID>', insuranceId)
    link = link.replace('<PCRREQUESTID>', pcrRequestId)
    link = link.replace('<PCRCONTRACTADDRESS>', pcrContractAddress)

    // send email
    sendEmail(
        config.EMAIL.laboratoryEmail,
        'Nueva solicitud de PCR',
        `Hola,\nSe ha creado una nueva solicitud de PCR.\nPara actualizarla pulsa en el siguiente enlace ${link}`,
        `<p>Hola, <br><br>Se ha creado una nueva solicitud de PCR. Para actualizarla pulsa en el siguiente <a href="${link}">enlace</a>.</p><p>Si el enlace no le funciona, puede copiar la siguiente URL en su navegador:<br><br>${link}</p>`
    )
}

module.exports = {
    sendEmailToLaboratory
}