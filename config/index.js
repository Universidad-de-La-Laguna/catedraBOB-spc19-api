module.exports = {
    JWT: {
        secretKey: process.env.JWT_SECRET || 'secret',
        issuer: process.env.JWT_ISSUER || 'ULL'
    },
    businessParams: {
        negativePcrHours: parseInt(process.env.NEGATIVEPCRHOURS) || 72
    },
    errorStatusCodes: {
        "Missing data": 415,
        "Conflict": 409,
        "Invalid data": 400
    }
}