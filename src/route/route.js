const express = require('express')
const router = express.Router()
const {registerUser,userLogin,getProfile,updateuser} = require('../Controllers/userController')
const {productCreate, getProductsByQuery ,updateproduct } = require('../Controllers/productController')
const {verifyToken,authentication,authorisation} = require('../Auth/auth')

router.get('/test-me', function(req,res){
    res.send("working")
})

router.post('/register',registerUser)
router.post('/login',userLogin)
router.get('/user/:userId/profile',verifyToken,authentication,authorisation,getProfile)
router.put('/user/:userId/profile',verifyToken,authentication,authorisation,updateuser)
router.post('/products',productCreate)
router.get('/products', getProductsByQuery )
// router.get()
router.put('/products/:productId', updateproduct)
module.exports = router