const express = require('express')
const router = express.Router()
const {registerUser,userLogin,getProfile,updateuser} = require('../Controllers/userController')
const {verifyToken,authentication,authorisation} = require('../Auth/auth')

router.get('/test-me', function(req,res){
    res.send("working")
})

router.post('/register',registerUser)
router.post('/login',userLogin)
router.get('/user/:userId/profile',verifyToken,authentication,authorisation,getProfile)
router.put('/user/:userId/profile',verifyToken,authentication,authorisation,updateuser)

module.exports = router