const express = require("express");
const router = express.Router();
const {
  registerUser,
  userLogin,
  getProfile,
  updateuser,
} = require("../Controllers/userController");

const {
  productCreate,
  getProductsByQuery,
  updateproduct,
  getProductsById,
  deleteProduct,
} = require("../Controllers/productController");

const {
  createorder,
  updateOrder } = require('../Controllers/orderController')

const { 
  verifyToken, 
  authentication, 
  authorisation } = require("../Auth/auth");


const {
  myCart,
  updateCart, 
  getCart, 
  deleteCart } = require("../controllers/cartController");


//=========================================User Api's================================================================
router.post("/register", registerUser);
router.post("/login", userLogin);
router.get(
  "/user/:userId/profile",
  verifyToken,
  authentication,
  authorisation,
  getProfile
);

router.put(
  "/user/:userId/profile",
  verifyToken,
  authentication,
  authorisation,
  updateuser
);

//==========================================Product API's==============================================================
router.post("/products", productCreate);
router.get("/products", getProductsByQuery);
router.get("/products/:productId", getProductsById);
router.put("/products/:productId", updateproduct);
router.delete("/products/:productId", deleteProduct);

//=======================================Cart Api's=====================================================================

router.post("/users/:userId/cart", verifyToken, authentication, authorisation, myCart)
router.get("/users/:userId/cart", verifyToken, authentication, authorisation, getCart)
router.put("/users/:userId/cart", verifyToken, authentication, authorisation, updateCart)
router.delete("/users/:userId/cart", verifyToken, authentication, authorisation, deleteCart)

//====================================Order Api's=================================================================
router.post('/users/:userId/orders', verifyToken, authentication, authorisation, createorder)
router.put('/users/:userId/orders', verifyToken, authentication, authorisation, updateOrder)



//======================== to check if the endpoint is correct or not =========================================
router.all("/**", function (req, res) {
  res.status(400).send({
    status: false,
    msg: "The api you are requesting is not available",
  });
});

module.exports = router;
