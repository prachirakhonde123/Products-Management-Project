const userModel = require("../Models/userModel");
const orderModel = require("../Models/orderModel");
const cartModel = require("../Models/cartModel");
const { isValidBody, isvalidObjectId } = require("../Validations/validator");

//============================================Creating Order===================================================

const createorder = async function (req, res) {
  try {
    let userid = req.params.userId;
    let data = req.body;
    let obj = {};

    const { cartId, cancellable, status } = data;

    if (!userid) {
      return res
        .status(400)
        .send({ status: false, message: "userId must be present!" });
    }

    if (!isvalidObjectId(userid)) {
      return res
        .status(400)
        .send({ status: false, message: "userId is not valid!" });
    }

    if (!isValidBody(data))
      return res
        .status(400)
        .send({ status: false, message: "Body can't be Empty" });

    if (!cartId) {
      return res
        .status(400)
        .send({ status: false, message: "cartId must be present!" });
    }

    if (!isvalidObjectId(cartId)) {
      return res
        .status(400)
        .send({ status: false, message: "CartId is not valid!" });
    }

    //________________________________If status is not pending_______________________________________
    if (status) {
      if (![pending].includes(status)) {
        return res
          .status(400)
          .send({ status: false, message: `Status could be only Pending` });
      }
    }

    if (!cancellable) {
      obj.cancellable = true;
    }

    //___________________________If wrong bollean value is given_____________________________________________
    if (cancellable !== undefined && typeof cancellable !== "boolean") {
      return res
        .status(400)
        .send({
          status: false,
          message: "Cancellable should Be True Or False Only",
        });
    }

    obj.cancellable = cancellable;

    const existuser = await userModel.findOne({ _id: userid });
    if (!existuser) {
      return res
        .status(400)
        .send({ status: false, message: " userId doesn't exists!" });
    }

    const cartp = await cartModel.findOne({ _id: cartId, userId: userid });
    if (!cartp) {
      return res
        .status(400)
        .send({ status: false, message: "cart doesn't exists for such user!" });
    }

    //_______________________Taking array of items in numberquality__________________________________
    let numberquality = cartp.items;

    let count = 0;
    for (let i = 0; i < numberquality.length; i++) {
      count = count + numberquality[i].quantity;
    }

    obj.userId = userid;
    obj.items = cartp.items;
    obj.totalPrice = cartp.totalPrice;
    obj.totalItems = cartp.totalItems;
    obj.totalQuantity = count;
    obj.isDeleted = false;
    obj.status = "pending";
    obj.deletedAt = null;

    const create = await orderModel.create(obj);

    //______________________________________Empty the cart after the successfull order___________________________________
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

    return res
      .status(201)
      .send({ status: true, message: "Success", data: create });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

//===================================================Updating Order==================================================

const updateOrder = async function (req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;
    const { orderId, status } = data;

    let user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).send({ status: false, message: "no user Exists" });
    }

    let order = await orderModel.findOne({ _id: orderId, userId: userId });
    if (!order) {
      return res
        .status(404)
        .send({ status: false, message: "No Order Exists for this User" });
    }

    //__________________________________If wrong status is given____________________________________________
    if (!(status == "completed" || status == "cancled")) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Status can be either completed or cancled",
        });
    }

    //_______________________________________________If cancellable is true___________________________________________________
    if (order.cancellable == true) {
      //__________________If status is completed________________________________________
      if (order.status == "pending" && status == "completed") {
        const updatePending = await orderModel.findOneAndUpdate(
          { _id: orderId },
          { $set: { status: status } },
          { new: true }
        );
        return res
          .status(200)
          .send({ status: true, message: `Success`, data: updatePending });
      }

      //_____________________________If status is cancled______________________________
      if (order.status == "pending" && status == "cancled") {
        const updatePending = await orderModel.findOneAndUpdate(
          { _id: orderId },
          { $set: { status: status } },
          { new: true }
        );
        return res
          .status(200)
          .send({ status: true, message: "Your Order is Cancelled" });
      }

      //_________________________If order is already completed________________________________________________
      if (order.status == "completed" && status == "completed") {
        return res
          .status(200)
          .send({ status: true, message: "Your Order is already Completed" });
      }

      //__________________________If order is already cancelled__________________________________________________
      if (order.status == "cancled" && status == "cancled") {
        return res
          .status(200)
          .send({ status: true, message: "Your Order is already Cancelled" });
      }
    }

    //________________________________________________If cancellable is false_______________________________________________
    if (order.cancellable == false) {
      //__________________________Cannot cacncled order if cancellable is false__________________________
      if (status == "cancled" && order.status == "pending") {
        return res
          .status(200)
          .send({
            status: true,
            message:
              "You cannot delete the order as your order is Non-cancellable!",
          });
      }

      //__________________________If status is completed___________________________________________
      if (status == "completed" && order.status == "pending") {
        const updatePending = await orderModel.findOneAndUpdate(
          { _id: orderId },
          { $set: { status: status } },
          { new: true }
        );

        return res
          .status(200)
          .send({
            status: true,
            message: "Your Pending order is now completed ",
            data: updatePending,
          });
      }
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

//================================================Modules=================================================

module.exports = {
  createorder,
  updateOrder,
};
