const {
  isValidBody,
  isValid,
  isvalidObjectId,
  validQuantity,
} = require("../validations/validator");
const productModel = require("../Models/productModel");
const userModel = require("../Models/userModel");
const cartModel = require("../Models/cartModel");
const { isValidObjectId } = require("mongoose");

const cartCreation = async function (req, res) {
  try {
    const userId = req.params.userId;
    const requestBody = req.body;
    const { quantity, productId } = requestBody;
    //let userIdFromToken = req.userId;

    //validating starts.
    if (!isValidBody(requestBody)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide valid request body" });
    }

    if (!isvalidObjectId(userId)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide valid User Id" });
    }
    if (!isvalidObjectId(productId) || !isValid(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide valid Product Id" });
    }

    if (!validQuantity(quantity)) {
      return res.status(400).send({
        status: false,
        message:
          "Please provide valid quantity & it must be greater than zero.",
      });
    }
    //validation ends.

    const findUser = await userModel.findById({ _id: userId });
    if (!findUser) {
      return res
        .status(400)
        .send({ status: false, message: `User doesn't exist by ${userId}` });
    }


    const findProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!findProduct) {
      return res.status(400).send({
        status: false,
        message: `Product doesn't exist by ${productId}`,
      });
    }

    const findCartOfUser = await cartModel.findOne({ userId: userId }); //finding cart related to user.

    if (!findCartOfUser) {
      //destructuring for the response body.
      var cartData = {
        userId: userId,
        items: [
          {
            productId: productId,
            quantity: quantity,
          },
        ],
        totalPrice: findProduct.price * quantity,
        totalItems: 1,
      };

      const createCart = await cartModel.create(cartData);
      return res.status(201).send({
        status: true,
        message: `Cart created successfully`,
        data: createCart,
      });
    }

    if (findCartOfUser) {
      //updating price when products get added or removed.
      let price =
        findCartOfUser.totalPrice + req.body.quantity * findProduct.price;
      let itemsArr = findCartOfUser.items;

      //updating quantity.
      for (i in itemsArr) {
        // for each like
        if (itemsArr[i].productId.toString() === productId) {
          itemsArr[i].quantity++; // increase the quantity the same product
         //  console.log(typeof itemsArr[i].quantity);
          let updatedCart = {
            items: itemsArr,
            totalPrice: price,
            totalItems: itemsArr.length,
          };
          //console.log(updatedCart);
          let responseData = await cartModel.findOneAndUpdate(
            { _id: findCartOfUser._id },
            updatedCart,
            { new: true }
          );

          return res.status(200).send({
            status: true,
            message: `quantity  added successfully`,
            data: responseData,
          });
        }
      }
      itemsArr.push({ productId: productId, quantity: quantity }); //storing the updated prices and quantity to the newly created array.

      let updatedCart = {
        items: itemsArr,
        totalPrice: price,
        totalItems: itemsArr.length,
      };
      console.log(updatedCart);
      let responseData = await cartModel.findOneAndUpdate(
        { _id: findCartOfUser._id },
        updatedCart,
        { new: true }
      );

      return res.status(200).send({
        status: true,
        message: `Product added successfully`,
        data: responseData,
      });
    }
  } catch (err) {
    res.status(500).send({ status: false, data: err.message });
  }
};




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const myCart = async function(req,res){
  try{
  let userId = req.params.userId
  let data = req.body
  const {productId, cartId} = data
  const cartData = {}

  if(!isValidBody(data)) return res.status(400).send({status : false, message : "Body can't be empty"})


  if(!isvalidObjectId(userId)) return res.status(400).send({status : false, message : "Invalid userId"})

  if(!isvalidObjectId(productId)) return res.status(400).send({status : false, message : "Invalid productId"})

  //_________________________________Finding User____________________________________________________________________
  let findUser = await userModel.findOne({_id : userId})
  if(!findUser){
    res.status(404).send({status : false, message : "No user find with this UserId"})
  }

  //_________________________________Finding Product______________________________________________________________________
  let product = await productModel.findOne({_id : productId})
  if(!product){
    res.status(404).send({status : false, message : "No product find with this UserId"})
  }

  if(product.isDeleted == true){
    res.status(404).send({status : false, message : "Product is deleted"})
  }

  let quantity = 1

  let cart = await cartModel.findOne({userId : userId})

  //____________________________________If cart is not present___________________________________
    if(!cart){
        let addItems = {}
        addItems.userId = userId
        addItems.items = {
          productId,
          quantity
        }

        addItems.totalPrice = product.price * quantity
        addItems.totalItems = 1

        let addCart = await cartModel.create(addItems)
        return res.status(201).send({status : true, message : "Cart is created ", data : addCart})
    }
    
    //_____________________________________Cart is already Present______________________________________
    else{
      if(!cartId) return res.status(400).send({status : false, message : "Provide cartId"})

      if(!isValidObjectId(cartId)) return res.status(400).send({status : false, message : "Invalid cartId"})
      
      //___________________________Checking cart for valid user_______________________________________
      const userCart = await cartModel.findOne({_id : cartId, userId : userId})
      if(!userCart){
        return res.status(400).send({status : false, message : "No cart found for such user"})
      }

      let alreadyProduct = userCart.items

      //________________________Taking out productIds from present Product____________________________________
      let productids = alreadyProduct.map(x => x.productId)

      //_________________If same productId or same product is given__________________________________
      if(productids.find(x => x == productId)){

        let updateData = await cartModel.findOneAndUpdate({_id : cartId, "items.productId" : productId},
        {$inc : {totalPrice : +product.price, "items.$.quantity" : +1}},
        {new : true})
        
        return res.status(201).send({status : true, message : "Same Product is added to cart", data : updateData})
      }
      
      //__________________Adding new Product to Cart__________________________________________________________
      else{
        let newProduct = {
          productId,
          quantity
        }
        let item = cart.totalItems+1
        let addNewProduct = await cartModel.findOneAndUpdate({_id : cartId},
        {$push : {items : newProduct},
        totalPrice : cart.totalPrice+product.price*quantity, 
        totalItems : item},
        {new : true})
        
        return res.status(201).send({status : true, message : "New Product is added to cart", data : addNewProduct})     
      }
    }
  }
  catch(err){
    res.status(500).send({status : false, message : err.message})
  }
}


//=======================================================Update the cart==================================================

const updateCart = async function(req,res){
  try{
  let userId = req.params.userId
  let id = req.body

  if(!isvalidObjectId(userId)) return res.status(400).send({status : false, message : "Invalid UserId"})

 //_____________________________________________Checking user is present or not___________________________________________

 let user = await userModel.findOne({_id : userId})
 if(!user){
     return res.status(400).send({status : false, message : "User doesn't exists!"})
 }


  const {productId,cartId,removeProduct} = id
  
  
  //_______________________________________If body is empty___________________________________________________

  if(!isValidBody(id)){
      return res.status(400).send({status : false, message : "Body can't be Empty!"})
  }
  
  //________________________________If mandatory filed is missing__________________________________________________________-

  if(!productId) return res.status(400).send({status : false, message : "Please Provide ProductId. It is mandatory!"})

  if(!isvalidObjectId(productId)) return res.status(400).send({status : false, message : "Invalid ProductId"})

  if(!cartId) return res.status(400).send({status : false, message : "Please Provide cartId. It is mandatory!"})

  if(!isvalidObjectId(cartId)) return res.status(400).send({status : false, message : "Invalid cartId"})

  //if(!removeProduct) return res.status(400).send({status : false, message : "Please provide removeProduct key!"})

  
  //_________________________________________Wrong value of removeProduct is given___________________________________________

  if(!(removeProduct == 0 || removeProduct == 1)){
      return res.status(400).send({status : false, message : "RemoveProduct should be either 0 or 1"})
  }

  //__________________________________________Finding Product__________________________________________________________________

  let checkProduct = await productModel.findOne({_id : productId})
  if(!checkProduct){
      return res.status(400).send({status : false, message : "Product doesn't exists!"})
  }
  if(checkProduct.isDeleted == true){
    return res.status(400).send({status : false, message : "Product is deleted from store"})
  }


  //__________________________________________Finidng Cart_____________________________________________________________________

  let cart = await cartModel.findOne({_id : cartId, userId : userId})

  //_________________________No cart found with cartId and userId__________________________________________________________

  if(!cart) return res.status(400).send({status : false, message : "No cart exists with this cartId and userId"})


  let cartData = cart.items  // Array of all products present in cart
  //console.log(cartData)

  //___________________Finding product with ProductId using For loop___________________________________________

  for(let i = 0; i < cartData.length; i++){
    //_____________________________________If the product is found___________________________

      if(cartData[i].productId == productId){
          let quantityPrice = cartData[i].quantity*checkProduct.price //calculated total price with quantity

          if (removeProduct == 0) {
              const removeproduct = await cartModel.findOneAndUpdate({ _id: cartId },
               { 
                $pull: { items: { productId: productId } },
                totalPrice: cart.totalPrice - quantityPrice, 
                totalItems: cart.totalItems - 1
               },
              { new: true })
              return res.status(200).send({ status: true, msg: "Product is removed from Cart", data: removeproduct })
          }

          if(removeProduct == 1){
            //_________________If the product quantity is 1_____________________________________-
            if(cartData[i].quantity == 1){
               const deleteProduct = await cartModel.findOneAndUpdate({_id : cartId},
               {
                $pull : {items : {productId}},
                totalPrice : cart.totalPrice - quantityPrice,
                totalItems : cart.totalItems - 1
               },
               {new : true})
              
              return res.status(200).send({ status: true, message: "Remove product Successfully", data: deleteProduct })
            }
            
            //_____________________Product Quantity greater than 1___________________________________________

            else{  
              //reduce quantity of particular products 
              cartData[i].quantity = cartData[i].quantity - 1
              const reduceQuantity = await cartModel.findOneAndUpdate({_id : cartId},
              {
                totalPrice : cart.totalPrice - checkProduct.price,
                items : cartData                
              },
              {new : true})
              
              return res.status(200).send({ status: true, message: "Quantity of Given Product is reduced Successfully", data: reduceQuantity })
            }
          }
      }

      //______________________No product found with given ProductId__________________________________
      else{
        return res.status(404).send({status : false, message : "No such a product find in Cart"})
      }

  }//For loop ends

}


  catch(err){
    res.status(404).send({status : false, message : err.message})
  }

}


//==========================================Get Cart by Using UserId===================================================================


const getCart = async function(req,res){
    try{
           let userId = req.params.userId

          if(!isvalidObjectId(userId)){
            res.status(400).send({status:false,message:"invalidUserId in params"})
          }
       
          const user = await userModel.findOne({ _id: userId });
          if (!user) {
            return res.status(400).send({ status: false, message: `User doesn't exists by ${userId}` });
          }
          
          const fetchProduct = await cartModel.findOne({userId : userId}).populate("items.productId")
          if(!fetchProduct){
            return res.status(400).send({ status: true, message: "cart not found with this UserId."});
          }

          return res.status(200).send({ status: true, message: "cart found successfully.", data: fetchProduct});
    }
    catch (err) {
        return res.status(500).send({ status: false, message: "Server Error", err: err.message});
    }
}



//============================================Delete Cart=========================================================================

const deleteCart =  async function(req,res){
  try{
       const userId = req.params.userId


       if (!isvalidObjectId(userId)) {
          return res.status(400).send({status: false, message: `${productId} is not a valid product id`,
          });
        }
    
        const cart = await cartModel.findOne({ userId: userId });
        if (!cart) {
          return res.status(400).send({status: false,message: `Product doesn't exists by ${userId}`,
          });
        }
        let deletecart = {
          items:[],
          totalPrice:0,
          totalItems:0
        }
        

        if(cart){
          //____________If product is already deleted i.e isDeleted = true_____
        if(cart.items=[] && cart.totalPrice == 0 && cart.totalItems ==0)
        {
            return res.status(400).send({ status: true, message: `cart has been already deleted.` });
        }

        else{

        const updated =  await cartModel.findOneAndUpdate({_id:cart._id },deletecart,{new:true})               
          return res.status(204).send({ status: true, message: `cart deleted successfully.` ,data:updated});
      
        }
      }
        
  } catch (err) {
      res.status(500).send({ status: false, data: err.message});
  }
}








//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
  cartCreation,
  myCart,
  updateCart,
  getCart,
  deleteCart
};









