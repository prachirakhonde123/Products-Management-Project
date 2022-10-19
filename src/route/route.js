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
const { verifyToken, authentication, authorisation } = require("../Auth/auth");
const { myCart , updateCart, getCart, deleteCart} = require("../controllers/cartController");
const { createorder ,  updateorder} = require('../Controllers/orderController')

router.get("/test-me", function (req, res) {
  res.send("working");
});

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

//router.post("/users/:userId/cart", cartCreation);

router.post("/users/:userId/cart", myCart)
router.get("/users/:userId/cart", getCart)
router.put("/users/:userId/cart",verifyToken,authentication,authorisation,updateCart)
router.delete("/users/:userId/cart",deleteCart)

router.post('/users/:userId/orders' , createorder )
router.put('/users/:userId/orders' , updateorder )
//======================== to check if the endpoint is correct or not =========================================
router.all("/**", function (req, res) {
  res.status(400).send({
    status: false,
    msg: "The api you are requesting is not available",
  });
});

module.exports = router;
