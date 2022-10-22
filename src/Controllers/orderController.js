const userModel = require("../Models/userModel");
const orderModel = require("../Models/orderModel");
const cartModel = require("../Models/cartModel");
const { isValidBody, isvalidObjectId, isValid } = require("../Validations/validator");

//============================================Creating Order===================================================

const createorder = async function (req, res) {
  try {
    let userid = req.params.userId;
    let data = req.body;
    let obj = {};

    const { cartId, cancellable, status,...rest } = data;

   //===========================================Checking Valid Id's=============================================== 
    if (!userid) { return res.status(400).send({ status: false, message: "userId must be present!" })}

    if (!isvalidObjectId(userid)) {return res.status(400).send({ status: false, message: "userId is not valid!" })}

    if (!isValidBody(data)) return res.status(400).send({ status: false, message: "Body can't be Empty" });

    if(isValidBody(rest)) return res.status(400).send({ status: false, message: "Provide cartId,cancellable,status only." });

    if (!cartId){ return res.status(400).send({ status: false, message: "cartId must be present!" })}

    if (!isvalidObjectId(cartId)) {return res.status(400).send({ status: false, message: "CartId is not valid!" })}

  //===========================================If status is not pending==================================================
    if(status || status==""){
      if(!isValid(status)) return res.status(400).send({status : false, message : "Please provide status. It can't be empty"})
      
      if (![pending].includes(status)) {
        return res.status(400).send({ status: false, message: `Status could be only Pending` });
      }
    }

  //=========================================If cancellable is not given=================================================  
    if (!cancellable) {
      obj.cancellable = true;
    }

  //=========================================If wrong boolean value is given for cancellable==============================
    if (cancellable !== undefined && typeof cancellable !== "boolean") {
      return res.status(400).send({status: false,message: "Cancellable should Be True Or False Only"});
    }

    obj.cancellable = cancellable;
  
  //================================================Finding User======================================================

    const existuser = await userModel.findOne({ _id: userid });
    if (!existuser) {return res.status(400).send({ status: false, message: " userId doesn't exists!" })}
  
  //=================================================Finding Cart for given User=======================================  

    const cartp = await cartModel.findOne({ _id: cartId, userId: userid });
    if (!cartp) {return res.status(400).send({ status: false, message: "cart doesn't exists for such user!" })}

    //=======================================Taking array of items in numberquality===========================================
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

  //=============================================Creating Order====================================================

    const create = await orderModel.create(obj);

  //=============================================Empty the cart after the successfull order=========================================
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

    return res.status(201).send({ status: true, message: "Success", data: create });

  } 
  catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};



//*********************************************************Updating Order******************************************************

const updateOrder = async function (req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;
    const { orderId, status,...rest } = data;

  //==================================================If Body is Empty=======================================================  

    if(!isValidBody(data)) return res.status(400).send({status : false, message : "Body can't be Empty"})

    if(isValid(rest)) return res.status(400).send({status : false, message : "Provide orderId and status only.Don't provide Invalid Keys"})

  //===================================================Finding User===============================================================  
    let user = await userModel.findById(userId);
    if (!user) { return res.status(404).send({ status: false, message: "no user Exists" })}

  //===================================================Finding Order for given User================================================  

    let order = await orderModel.findOne({ _id: orderId, userId: userId });
    if (!order) {
      return res.status(404).send({ status: false, message: "No Order Exists for this User" });
    }

  //=================================================If wrong status is given=======================================================
    if (!(status == "completed" || status == "cancled")) {
      return res.status(400).send({status: false,message: "Status can be either completed or cancled"});
    }

  //====================================================If cancellable is true======================================================

    if (order.cancellable == true) {
      //_______________________________________If status is completed________________________________________
      if (order.status == "pending" && status == "completed") {
        const updatePending = await orderModel.findOneAndUpdate(
          { _id: orderId },
          { $set: { status: status } },
          { new: true }
        );
        return res.status(200).send({ status: true, message: `Success`, data: updatePending });
      }

      //________________________________________If status is cancled_______________________________________
      if (order.status == "pending" && status == "cancled") {
        await orderModel.findOneAndUpdate(
        { _id: orderId },
        { $set: { status: status } },
        { new: true }
        );
        return res.status(200).send({ status: true, message: "Your Order is Cancelled" });
      }

      //______________________________________If order is already completed________________________________________________
      if (order.status == "completed" && status == "completed") {
        return res.status(200).send({ status: true, message: "Your Order is already Completed" });
      }

      //_________________________________________If order is already cancelled__________________________________________________
      if (order.status == "cancled" && status == "cancled") {
        return res.status(200).send({ status: true, message: "Your Order is already Cancelled" });
      }
    }

  //===============================================If cancellable is false=========================================================

    if (order.cancellable == false) {
      //__________________________Cannot cacncled order if cancellable is false__________________________
      if (status == "cancled" && order.status == "pending") {
        return res.status(200).send({status: true,message: "You cannot delete the order as your order is Non-cancellable!"});
      }

      //______________________________________If status is completed___________________________________________
      if (status == "completed" && order.status == "pending") {
        const updatePending = await orderModel.findOneAndUpdate(
          { _id: orderId },
          { $set: { status: status } },
          { new: true }
        );

        return res.status(200).send({status: true,message: "Your Pending order is now completed ",data: updatePending});
      }
    }
  } 
  
  catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};



//================================================Modules=================================================

module.exports = {createorder,updateOrder};
