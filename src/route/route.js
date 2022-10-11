const express = require('express')
const router = express.Router()
const {registerUser,userLogin,getProfile,updateuser} = require('../Controllers/userController')

router.get('/test-me', function(req,res){
    res.send("working")
})

router.post('/register',registerUser)
router.post('/login',userLogin)
router.get('/user/:userId/profile',getProfile)
router.put('/user/:userId/profile',updateuser)

module.exports = router