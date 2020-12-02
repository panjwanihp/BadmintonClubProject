const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req,res,next){
    //get token rom header
    const token = req.header("x-auth-token");
    //check if not token
    if(!token){
        return res.status(401).json({msg : "No Token authorization denied"});
    }

    //verify token
    try{
        const decoded = jwt.verify(token, config.get("jwtToken"));
        req.user =decoded.user;
        next();
    }catch(e){
        res.status(401).json({msg: "Token is not valid"});
    }
};