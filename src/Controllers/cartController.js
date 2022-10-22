const productModel = require("../Models/productModel");
const userModel = require("../Models/userModel");
const cartModel = require("../Models/cartModel");
const { isValidBody, isvalidObjectId } = require('../Validations/validator')


//======================================================Creating Cart=================================================

const myCart = async function (req, res) {
  try {
    let userId = req.params.userId
    let data = req.body
    const { productId, cartId, ...rest } = data

    if (!isvalidObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid userId" })

    if (!isValidBody(data)) return res.status(400).send({ status: false, message: "Body can't be empty" })

    if (isValidBody(rest)) return res.status(400).send({ status: false, message: "You are providing invalid Keys" })

    if (!productId) return res.status(400).send({ status: false, message: "ProductId is mandatory" })

    if (!isvalidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid productId" })


    //===============================================Finding User================================================================
    let findUser = await userModel.findOne({ _id: userId })
    if (!findUser) { return res.status(404).send({ status: false, message: "No user find with this UserId" }) }

    //===============================================Finding Product=====================================================
    let product = await productModel.findOne({ _id: productId })
    if (!product) { return res.status(404).send({ status: false, message: "No product find with this ProductId" }) }

    if (product.isDeleted == true) { return res.status(404).send({ status: false, message: "Product is deleted" }) }

    //===========================================Finding Cart============================================================

    let quantity = 1

    let cart = await cartModel.findOne({ userId: userId })

    //____________________________________If cart is not present___________________________________
    if (!cart) {
      let addItems = {}
      addItems.userId = userId
      addItems.items = {
        productId,
        quantity
      }

      addItems.totalPrice = product.price * quantity
      addItems.totalItems = 1

      let addCart = await cartModel.create(addItems)
      return res.status(201).send({ status: true, message: "Success", data: addCart })
    }

    //========================================Cart is already Present=============================================================

    else {
      if (!cartId) return res.status(400).send({ status: false, message: "User already has Cart. Provide CartId to add Products!" })

      if (!isvalidObjectId(cartId)) return res.status(400).send({ status: false, message: "Invalid cartId" })

    //=======================================Checking cart for valid user=====================================================
      const userCart = await cartModel.findOne({ _id: cartId, userId: userId })
      if (!userCart) { return res.status(400).send({ status: false, message: "No cart found for such user" })}

      let alreadyProduct = userCart.items

    //====================================Taking out productIds from present Product==========================================
      let productids = alreadyProduct.map(x => x.productId)

      //________________________________If same productId or same product is given__________________________________
      if (productids.find(x => x == productId)) {

        let updateData = await cartModel.findOneAndUpdate({ _id: cartId, "items.productId": productId },
          { $inc: { totalPrice: +product.price, "items.$.quantity": +1 } },
          { new: true })

        return res.status(201).send({ status: true, message: "Success", data: updateData })
      }

      //______________________________________Adding new Product to Cart__________________________________________________________
      else {
        let newProduct = {
          productId,
          quantity
        }
        let item = cart.totalItems + 1
        let addNewProduct = await cartModel.findOneAndUpdate({ _id: cartId },
          {
            $push: { items: newProduct },
            totalPrice: cart.totalPrice + product.price * quantity,
            totalItems: item
          },
          { new: true })

        return res.status(201).send({ status: true, message: "Success", data: addNewProduct })
      }
    }
  }
  catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }
}


//*********************************************************Update the cart*****************************************************

const updateCart = async function (req, res) {
  try {
    let userId = req.params.userId
    let id = req.body

    if (!isvalidObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid UserId" })

    //===============================================Checking user is present or not=================================

    let user = await userModel.findOne({ _id: userId })
    if (!user) { return res.status(400).send({ status: false, message: "User doesn't exists!" })}

    const { productId, cartId, removeProduct,...rest } = id


    //===========================================If body is empty====================================================

    if (!isValidBody(id)) { return res.status(400).send({ status: false, message: "Body can't be Empty!" })}

    //==========================================If mandatory filed is missing================================================

    if (!productId) return res.status(400).send({ status: false, message: "Please Provide ProductId. It is mandatory!" })

    if (!isvalidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid ProductId" })

    if (!cartId) return res.status(400).send({ status: false, message: "Please Provide cartId. It is mandatory!" })

    if (!isvalidObjectId(cartId)) return res.status(400).send({ status: false, message: "Invalid cartId" })


    //================================================Wrong value of removeProduct is given========================================

    if (!(removeProduct == 0 || removeProduct == 1)) {
      return res.status(400).send({ status: false, message: "RemoveProduct key is mandatory and it should be either 0 or 1" })
    }

    //====================================================Finding Product=============================================================

    let checkProduct = await productModel.findOne({ _id: productId })
    if (!checkProduct) { return res.status(400).send({ status: false, message: "Product doesn't exists!" })}

    if(checkProduct.isDeleted == true) { return res.status(400).send({ status: false, message: "Product is deleted from store" })}

    //==================================================Finidng Cart=====================================================================

    let cart = await cartModel.findOne({ _id: cartId, userId: userId })

    if (!cart) return res.status(400).send({ status: false, message: "No cart exists with this cartId and userId" })

    let cartData = cart.items  
    
    //=============================Finding product with ProductId using For loop============================================================

    for (let i = 0; i < cartData.length; i++) {
      //_____________________________________If the product is found___________________________

      if (cartData[i].productId == productId) {
        let quantityPrice = cartData[i].quantity * checkProduct.price //calculated total price with quantity

    //=========================================If removeproduct is 0========================================================================
        if (removeProduct == 0) {
          const removeproduct = await cartModel.findOneAndUpdate({ _id: cartId },
            {
              $pull: { items: { productId: productId } },
              totalPrice: cart.totalPrice - quantityPrice,
              totalItems: cart.totalItems - 1
            },
            { new: true })
          return res.status(200).send({ status: true, message: "Success", data: removeproduct })
        }
    
    //=======================================If removeproduct is 1==========================================================================    
        if (removeProduct == 1) {
          //__________________________________If the product quantity is 1_____________________________________-
          if (cartData[i].quantity == 1) {
            const deleteProduct = await cartModel.findOneAndUpdate({ _id: cartId },
              {
                $pull: { items: { productId } },
                totalPrice: cart.totalPrice - quantityPrice,
                totalItems: cart.totalItems - 1
              },
              { new: true })

            return res.status(200).send({ status: true, message: "Success", data: deleteProduct })
          }

          //___________________________________Product Quantity greater than 1___________________________________________

          else {
            cartData[i].quantity = cartData[i].quantity - 1
            const reduceQuantity = await cartModel.findOneAndUpdate({ _id: cartId },
              {
                totalPrice: cart.totalPrice - checkProduct.price,
                items: cartData
              },
              { new: true })

            return res.status(200).send({ status: true, message: "Success", data: reduceQuantity })
          }
        }
      }
    }//For loop ends

    //=====================================No product found with given ProductId=========================================
    return res.status(404).send({ status: false, message: "No such a product find in Cart" })
  }

  catch (err) {
    res.status(404).send({ status: false, message: err.message })
  }

}


//**************************************************Get Cart by Using UserId******************************************************


const getCart = async function (req, res) {
  try {
    let userId = req.params.userId

  //=================================If userId is Invalid=========================================================  

    if (!isvalidObjectId(userId)) { res.status(400).send({ status: false, message: "invalidUserId in params" })}

    const user = await userModel.findOne({ _id: userId });
    if (!user) { return res.status(400).send({ status: false, message: `User doesn't exists by ${userId}` })}

  //====================================Finding cart of given user===================================================  

    const fetchProduct = await cartModel.findOne({ userId: userId }).populate("items.productId")
    if (!fetchProduct) { return res.status(404).send({ status: true, message: `cart not found with this ${userId}.` })}

    return res.status(200).send({ status: true, message: "Success", data: fetchProduct });
    
  }

  catch (err) {
    return res.status(500).send({ status: false, message: "Server Error", err: err.message });
  }
}



//************************************************************Delete Cart*********************************************************************

const deleteCart = async function (req, res) {
  try {
    const userId = req.params.userId

  //================================If userId is invalid==========================================
    if (!isvalidObjectId(userId)) {
      return res.status(400).send({status: false, message: `${userId} is not a valid userId`})
    }

    const cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
      return res.status(400).send({ status: false, message: `Cart not found for this  ${userId}`})
    }

    let deletecart = {
      items: [],
      totalPrice: 0,
      totalItems: 0
    }

  //=======================================If cart is Present=======================================================
    if (cart) {
      //___________________If product is already deleted i.e isDeleted = true_________________
      if (cart.items = [] && cart.totalPrice == 0 && cart.totalItems == 0) {
        return res.status(200).send({ status: true, message: `cart has been already deleted.` });
      }
      
      //______________________________Making Cart is Empty____________________________________
      else {
        const updated = await cartModel.findOneAndUpdate({ _id: cart._id }, deletecart, { new: true })
        return res.status(204).send({ status: true, message: `cart deleted successfully.`, data: updated });
      }
    }
  } 
  catch (err) {
    res.status(500).send({ status: false, data: err.message });
  }
}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
  myCart,
  updateCart,
  getCart,
  deleteCart
};









