import jwt from 'jsonwebtoken'

export const protect = async (req, res, next) => {
    // get the token sir from the headers 
    let token

    // check if header exists and start with 'bearer thing or not 
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // splite the bearer and token into arr and get the token
        token = req.headers.authorization.split(' ')[1]
    } else {
        // fallback just in case psotman sneds the raw token
        token = req.headers.authorization
    }

    // check if there exist a token or not 
    if(!token) {
        return res.status(401).json({
            error: "Unauthorized access. No token provided."
        })
    }

    try {
        // if there exist a token then
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // the decoded is basically the payload which we passed at the time of creation of the token
        // Toh jab jwt.verify us token ko kholta hai, toh decoded ke andar exactly wahi payload wapas nikalta hai.

        // decoded looks like this 
        /*
        {
        userId: "6a0b33470fff6a14f232aba3", // Tera mongo ObjectId
        iat: 1716024500, // Token kab issue hua (timestamp)
        exp: 1716629300  // Token kab expire hoga (timestamp)
        }
        **/
    
        req.user = decoded.userId
    
        next()
        
    } catch (error) {
        return res.status(401).json({
            error: "Token didn't match"
        })
    }
}