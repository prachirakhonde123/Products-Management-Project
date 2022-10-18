const {
  validInstallment,
  isValidBody,
  isValid,
  isvalidObjectId,
  validQuantity,
} = require("../validations/validator");
const productModel = require("../Models/productModel");
const userModel = require("../Models/userModel");
const cartModel = require("../Models/cartModel");

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

    if (!isValid(quantity) || !validQuantity(quantity)) {
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

    //Authentication & authorization
    // if (findUser._id.toString() != userIdFromToken) {
    //   return res.status(401).send({
    //     status: false,
    //     message: `Unauthorized access! User's info doesn't match`,
    //   });
    // }

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

//  const updatecart = async function(req,res){
//   const userId = req.params.userId;
//   const requestBody = req.body;

//   const { cardId ,productId , removeproduct } = requestBody

//   const findCartOfUser = await cartModel.findOne({ userId: userId });
//   console.log(findCartOfUser.items[0].quantity)
//   var e = findCartOfUser.items[0].quantity
//    if(!findCartOfUser){
//     return res.status(400).send({ status:false , message: "card id does n't exists!"})
//    }
    
//    const existp = await productModel.findOne({_id:productId, isDeleted:false})
//       if(!existp){
//         return res.status(400).send({ status:false , message: "product id does n't exists!"})
//       }
//       console.log(existp.price)
//       let itemsArr = findCartOfUser.items;
//   let price = findCartOfUser.totalPrice-existp.price*findCartOfUser.items[0].quantity
//   console.log(price)
//    // let itemsArr = findCartOfUser.items;

//    for (i in itemsArr) {
//    // let price = findCartOfUser.totalPrice +  existp.price;
//    // console.log(typeof price)
//     if (itemsArr[i].productId.toString() === productId) {
//             itemsArr[i].quantity++;


//             let updatedCart = {
//               items: itemsArr,
//               totalPrice: price,
//               totalItems: itemsArr.length,
//             };

//             let responseData = await cartModel.findOneAndUpdate(
//               { _id: findCartOfUser._id },
//               updatedCart,
//               { new: true }
//             );

//             return res.status(200).send({
//               status: true,
//               message: `Product added successfully`,
//               data: responseData,
//             });
//     }
//    }




// //return res.status(200).send({status:true , message:findCartOfUser})

// }

const updateCart = async function(req,res){
  try{
  let userId = req.params.userId
  let id = req.body

  if(!isvalidObjectId(userId)) return res.status(400).send({status : false, message : "Invalid UserId"})

 //________________Checking user is present or not______________

 let user = await userModel.findOne({_id : userId})
 if(!user){
     return res.status(400).send({status : false, message : "User doesn't exists!"})
 }


  const {productId,cartId,removeProduct} = id
  
  
  //______________If body is empty__________________

  if(!isValidBody(id)){
      return res.status(400).send({status : false, message : "Body can't be Empty!"})
  }
  
  //___________If mandatory filed is missing___________________-

  if(!productId) return res.status(400).send({status : false, message : "Please Provide ProductId. It is mandatory!"})

  if(!isvalidObjectId(productId)) return res.status(400).send({status : false, message : "Invalid ProductId"})

  if(!cartId) return res.status(400).send({status : false, message : "Please Provide cartId. It is mandatory!"})

  if(!isvalidObjectId(cartId)) return res.status(400).send({status : false, message : "Invalid cartId"})

  //if(!removeProduct) return res.status(400).send({status : false, message : "Please provide removeProduct key!"})

  
  //______________Wrong value of removeProduct is given______________

  if(!(removeProduct == 0 || removeProduct == 1)){
      return res.status(400).send({status : false, message : "RemoveProduct should be either 0 or 1"})
  }

  //_______________Finding Product_______________________

  let checkProduct = await productModel.findOne({_id : productId})
  if(!checkProduct){
      return res.status(400).send({status : false, message : "Product doesn't exists!"})
  }
  if(checkProduct.isDeleted == true){
    return res.status(400).send({status : false, message : "Product is deleted from store"})
  }


  //_______________Finidng Cart________________________

  let cart = await cartModel.findOne({_id : cartId, userId : userId})

  //________No cart found with cartId and userId___________________

  if(!cart) return res.status(400).send({status : false, message : "No cart exists with this cartId and userId"})


  let cartData = cart.items  // Array of all products present in cart
  //console.log(cartData)

  //______Finding product with ProductId using For loop______________

  for(let i = 0; i < cartData.length; i++){
    //____________If the product is found__________

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
            //______If the product quantity is 1____________-
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
            
            //________Product Quantity greater than 1______________

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

      //_______No product found with given ProductId___________
      else{
        return res.status(404).send({status : false, message : "No such a product find in Cart"})
      }

  }//For loop ends

}


  catch(err){
    res.status(404).send({status : false, message : err.message})
  }

}



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
        if(!fetchProduct)
        {
          return res.status(400).send({ status: true, message: "cart not found with this UserId."});
        }

        return res.status(200).send({ status: true, message: "cart found successfully.", data: fetchProduct});

  }
  catch (err) {
      return res.status(500).send({ status: false, message: "Server Error", err: err.message});
  }
}

const deleteUser =  async function(req,res){
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
        // if(cart.items=[] && totalPrice == 0 && totalItems ==0)
        // return res.status(400).send({ status: true, message: `cart has been already deleted.` });
        let deletecart = {
          items:[],
          totalPrice:0,
          totalItems:0
        }
        if(cart.items=[] && cart.totalPrice == 0 && cart.totalItems ==0)
        return res.status(400).send({ status: true, message: `cart has been already deleted.` });
        if(cart){
        const updated =  await cartModel.findOneAndUpdate({_id:cart._id },deletecart,{new:true})         
        
          return res.status(204)
      
        }
        //_____________If product is already deleted i.e isDeleted = true______
        //  
  } catch (err) {
      res.status(500).send({ status: false, data: err.message });
    }
}

module.exports = {
  cartCreation,updateCart,getCart,deleteUser
};
