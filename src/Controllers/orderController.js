const userModel = require('../Models/userModel')
const orderModel = require('../Models/orderModel')
const cartModel = require('../Models/cartModel')
const {isValidBody, isvalidObjectId} = require('../Validations/validator')

/*
const orderCreation = async (req, res) => {
  try {
    const userId = req.params.userId;
    const requestBody = req.body;

    //validation for request body
    if (!isValidBody(requestBody)) {
      return res.status(400).send({
        status: false,
        message:
          "Invalid request body. Please provide the the input to proceed.",
      });
    }
    //Extract parameters
    const { cartId, cancellable, status } = requestBody;

    if (!userId) {
      return res
        .status(400)
        .send({
          status: false,
          message: `userId must be present`,
        });
    }
    //validating userId
    if (!isvalidObjectId(userId)) {
      return res
        .status(400)
        .send({ status: false, message: "Invalid userId in params." });
    }

    const searchUser = await userModel.findOne({ _id: userId });
    if (!searchUser) {
      return res
        .status(400)
        .send({ status: false, message: `user doesn't exists for ${userId}` });
    }

    if (!cartId) {
      return res
        .status(400)
        .send({ status: false, message: `Cart doesn't exists for ${userId}` });
    }
    if (!isvalidObjectId(cartId)) {
      return res
        .status(400)
        .send({ status: false, message: `Invalid cartId in request body.` });
    }

    //searching cart to match the cart by userId whose is to be ordered.
    const searchCartDetails = await cartModel.findOne({
      _id: cartId,
      userId: userId,
    });
    if (!searchCartDetails) {
      return res
        .status(400)
        .send({ status: false, message: `Cart doesn't belongs to ${userId}` });
    }

    //must be a boolean value.
    if (cancellable) {
      if (typeof cancellable != "boolean") {
        return res.status(400).send({
          status: false,
          message: `Cancellable must be either 'true' or 'false'.`,
        });
      }
    }

    // must be either - pending , completed or cancelled.
    if (status) {
      if (!isValidStatus(status)) {
        return res.status(400).send({
          status: false,
          message: `Status must be among ['pending','completed','cancelled'].`,
        });
      }
    }

    //verifying whether the cart is having any products or not.
    if (!searchCartDetails.items.length) {
      return res.status(202).send({
        status: false,
        message: `Order already placed for this cart. Please add some products in cart to make an order.`,
      });
    }

    //adding quantity of every products
    const reducer = (previousValue, currentValue) =>
      previousValue + currentValue;

    let totalQuantity = searchCartDetails.items
      .map((x) => x.quantity)
      .reduce(reducer);

    //object destructuring for response body.
    const orderDetails = {
      userId: userId,
      items: searchCartDetails.items,
      totalPrice: searchCartDetails.totalPrice,
      totalItems: searchCartDetails.totalItems,
      totalQuantity: totalQuantity,
      cancellable,
      status,
    };
    const savedOrder = await orderModel.create(orderDetails);

    //Empty the cart after the successfull order
    await cartModel.findOneAndUpdate(
      { _id: cartId, userId: userId },
      {
        $set: {
          items: [],
          totalPrice: 0,
          totalItems: 0,
        },
      }
    );

    return res
      .status(200)
      .send({ status: true, message: "Order placed.", data: savedOrder });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
*/

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const createorder = async function (req, res) {
  let userid = req.params.userId
  let data = req.body
  let obj = {}

  const { cartId, cancellable, status } = data

  if(!userid) {
    return res.status(400).send({ status: false, message: "user id must be present!" })
  }

  if (!isvalidObjectId(userid)) {
    return res.status(400).send({ status: false, message: "product id is not valid!" })
  }

  if(!isValidBody(data)) return res.status(400).send({ status: false, message: "Body can't be Empty" })

  if(!cartId){
    return res.status(400).send({ status: false, message: "cart id must be present!" })
  }

  if(!isvalidObjectId(cartId)){
    return res.status(400).send({ status: false, message: "Cart id is not valid!" })

  }

  if(status) {
    if (![pending].includes(status)) {
      return res.status(400).send({ status: false, message: `Status could be only Pending` })
    }
  }

  if(!cancellable){
    obj.cancellable = true
  }

  if(cancellable){
    obj.cancellable = cancellable
  }

  const existuser = await userModel.findOne({ _id: userid })
  if (!existuser) {
    return res.status(400).send({ status: false, message: " user id doesn't exists!" })
  }

  const cartp = await cartModel.findOne({ _id: cartId, userId : userid})
  if (!cartp) {
    return res.status(400).send({ status: false, message: "cart doesn't exists for such user!" })
  }

  let numberquality = cartp.items

  let count = 0;
  for (let i = 0; i < numberquality.length; i++){
    count = count + numberquality[i].quantity
  }

  
  obj.userId = userid
  obj.items = cartp.items
  obj.totalPrice = cartp.totalPrice
  obj.totalItems = cartp.totalItems
  obj.totalQuantity = count
  obj.isDeleted = false
  obj.status = "pending"
  obj.deletedAt = null

  console.log(obj)
  const create = await orderModel.create(obj)

  //Empty the cart after the successfull order
  await cartModel.findOneAndUpdate(
    { _id: cartId, userId: userid },
    {
      $set: {
        items: [],
        totalPrice: 0,
        totalItems: 0,
      },
    }
  );

    return res.status(201).send({ status: true, message: "Your Order is Created", data: create })

}




//////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateOrder = async function (req, res) {
  try {
    let userId = req.params.userId
    let data = req.body
    const { orderId, status } = data

    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).send({ status: false, message: "no user Exists" })
    }

    let order = await orderModel.findOne({ _id : orderId, userId: userId })
    if (!order) {
      return res.status(404).send({ status: false, message: "No Order Exists for this User" })
    }


    //_______________________________________________If cancellable is true___________________________________________________
    if (order.cancellable == true) {
      if (order.status == "pending") {
        const updatePending = await orderModel.findOneAndUpdate({ _id: orderId },
          { $set: { status: status } },
          { new: true })
          return res.status(200).send({ status: true, message: `Your order is ${status}`, data: updatePending })
      }
    }

    //________________________________________________If cancellable is false_______________________________________________
    if (order.cancellable == false) {
      if (status == "cancled" && order.status == "pending") {
        return res.status(200).send({ status: true, message: "You cannot delete the order as your order is Non-cancellable!" })
      }

      if (status == "completed" && order.status == "pending") {
        const updatePending = await orderModel.findOneAndUpdate({ _id: orderId },
          { $set: { status: status } },
          { new: true })

        return res.status(200).send({ status: true, message: "Your Pending order is now completed ", data: updatePending })
      }
    }
  }

  catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }
}




module.exports = {
  createorder,
  updateOrder
}