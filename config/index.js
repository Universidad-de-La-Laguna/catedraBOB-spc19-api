module.exports = {
    JWT: {
        secretKey: process.env.JWT_SECRET || 'secret',
        issuer: process.env.JWT_ISSUER || 'ULL'
    },
    businessParams: {
        negativePcrHours: parseInt(process.env.NEGATIVEPCRHOURS) || 72,
        daysToCompensate: parseInt(process.env.DAYSTOCOMPENSATE) || 10,
        nodeRole: process.env.NODEROLE || 'taker'   // nodeRole = [ insurer | taker | laboratory ]
    },
    errorStatusCodes: {
        "Missing data": 415,
        "Conflict": 409,
        "Invalid data": 400
    },
    contracts: {
        spc19ContractAddress: process.env.SPC19CONTRACTADDRESS
    },
    orion: {
      taker: {
        publicKey: process.env.TAKERPUBLICKEY || "Ko2bVqD+nNlNYL5EE7y3IdOnviftjiizpjRt+HTuFBs="
      },
      insurer: {
        publicKey: process.env.INSURERPUBLICKEY || "A1aVtMxLCUHmBVHXoZzzBgPbW/wj5axDpW9X8l91SGo="
      },
      laboratory: {
        publicKey: process.env.LABORATORYPUBLICKEY || "k2zXEin4Ip/qBGlRkJejnGWdP9cjkK+DAvKNW31L2C8="
      }
    },
    besu: {
      thisnode: {
        url: process.env.BESUNODEURL || "http://127.0.0.1:20002",
        wsUrl: process.env.BESUNODEWSURL || "ws://127.0.0.1:20003",
        privateKey: process.env.BESUNODEPRIVATEKEY || "c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
      }
   }
}