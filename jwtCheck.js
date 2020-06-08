const jwt             = require('jsonwebtoken')


module.exports = function jwtCheck(req, secret) {
    const authorization = req && req.headers && req.headers.authorization 

    if (authorization && authorization.startsWith('Bearer ')){
        const token = authorization.substr("Bearer ".length)
        let decoded;
        try {
            decoded = jwt.verify(token, secret)
        }
        catch (e){
            return null;
        }
        return decoded
    }
}   