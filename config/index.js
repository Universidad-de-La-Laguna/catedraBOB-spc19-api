module.exports = {
    JWT: {
        secretKey: process.env.JWT_SECRET || 'secret',
        issuer: process.env.JWT_ISSUER || 'ULL'
    },
    errorStatusCodes: {
        "Missing data": 415
    }
}