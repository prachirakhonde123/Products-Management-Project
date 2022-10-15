const jwt = require("jsonwebtoken")
const userModel = require("../Models/userModel")
const mongoose = require("mongoose")


const verifyToken = function (req, res, next) {
    const bearerHeader = req.headers['authorization'];
  
    if (typeof bearerHeader !== 'undefined') {
      const bearer = bearerHeader.split(' ');
      const bearerToken = bearer[1];
      req.token = bearerToken;     
      next();
    } 
    else {
      res.sendStatus(403);
    }
  }


  //================================================Authentication================================================
  const authentication = async function(req,res,next){
    try{
        let token = req.token
        jwt.verify(token,"verysecretkeyofgroup27",function(err,decodedToken){
            if(err){
                return res.status(401).send({status : false, message : "Invalid Token"})
            }
            else{
                req.tokenId = decodedToken.userId
                // console.log(decodedToken.userId)
                next()
            }
        })
    }
    catch(err){
         res.status(500).send({ message : "Server Error", error : err.message})
    }
  }


  //=======================================Authorisation=================================================
  const authorisation = async function (req, res, next) {
    try {
        let userId = req.params.userId
        //console.log(userId)
        let validUser = req.tokenId // userid from token
        // console.log(validUser)

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid Format of User Id" })
        }

        let user = await userModel.findById(userId)
        if (user) {
          //  let user = user.userId.toString() //userId from book
            if (userId !== validUser) {
                return res.status(403).send({ status: false, message: "Sorry! Unauthorized User" })
            }
            next()
        }
        else{
            return res.status(404).send({ status: false, message: "User not found or UserId does not exist" })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}
  

module.exports = {verifyToken,authentication,authorisation}