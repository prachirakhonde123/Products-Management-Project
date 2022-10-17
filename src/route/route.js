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
const { cartCreation } = require("../controllers/cartController");

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

router.post("/users/:userId/cart", cartCreation);

//======================== to check if the endpoint is correct or not =========================================
router.all("/**", function (req, res) {
  res.status(400).send({
    status: false,
    msg: "The api you are requesting is not available",
  });
});

module.exports = router;
