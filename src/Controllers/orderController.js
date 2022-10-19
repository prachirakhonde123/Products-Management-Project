const cartModel = require('../Models/cartModel')
const orderModel = require('../Models/orderModel')
const productModel = require('../Models/productModel')
const userModel = require('../Models/userModel')
let { isvalidObjectId } = require('../Validations/validator')

const createorder = async function(req,res){
    let userid = req.params.userId
    let data = req.body

    const { cartId , cancellable } = data
    if (!userid) {
        return res.status(400).send({ status: false, message: "user id must be present!" })
      }
      if (!isvalidObjectId(userid)) {
        return res.status(400).send({ status: false, message: "product id is not valid!" })
      }

      const existuser = await userModel.findOne({_id:userid})
      if(!existuser){
        return res.status(400).send({ status: false , message:" user id does n't exists!"})
      }
      const cartp = await cartModel.findOne({_id:cartId})
         let numberquality = cartp.items
           let count = 0;
         for(let i=0; i<numberquality.length; i++){
             count =count+ numberquality[i].quantity
             
         }

      let createoder = {
        _id:cartId,
        userId:cartp.userId,
        items:cartp.items,
        totalprice : cartp.totalPrice,
        totalItems:cartp.totalItems,
        totalQuantity:count,
        cancellable:cancellable,
        status:"pending"

      }

//console.log(createoder)
   

  let obj = {
    items:[], totalPrice:0 , totalItems:0
  }

   const update = await cartModel.findOneAndUpdate({userId:userid},{$set:obj},{new:true})

   const create  = await orderModel.create(createoder)
   return res.status(201).send({status: true , message: "Success", data: createoder})
}

const updateorder = async function(req,res){
    let userid = req.params.userId
    let data = req.body
    let { orderId , status }= data
    
    const existuser = await userModel.findOne({_id:userid})
    if(!existuser){
      return res.status(400).send({status:false , message:"user id doesn't exists!"})
    } 
    // 1. as cancellable true and false  true-- res .completed and cancelled .
    // 2. false --- if cancel res. order is not cancel able.
    // 3.agar status  cancelled , cancellable false ha toh res.order is not cancellable.
    // 3.1 status --completed cancelled false res. update status completed.
    //4 cancelleable true ha 
    //1. status completd  completed  


    
    const checkod = await orderModel.findOne({_id:orderId,userId:userid})
    // if(checkod.cancellable == "false"){
    //   return res.status(400).send({status:false , message: "The order can't be cancelled"})
    // }
    // if(status == "cancled"&& checkod.cancellable == 'false'){
    //   return res.status(400).send({status:false , message: "The order is not cancellable!"})
    // }
    // if(status == "completed" && checkod.cancellable == "false"){
    //   return res.status(200).send({ status:true , message:"order has been completed"})
    // }
    // if(checkod.cancellable == 'true'&& checkod.status=="pending"){
    //   await orderModel.findOneAndUpdate({_id:orderId},{$set:{status:status}},{new:true})
    // }
     
    if(checkod){
       await orderModel.findOneAndUpdate({_id:orderId},{$set:{status:status }},{new:true})
      return res.status(400).send({status:false , message: "order completed or cancelled"})
    } else{
      await  orderModel.findOneAndUpdate({_id:orderId , cancellable:false},{$set:{status:status }},{new:true})
      await cartModel.findOneAndUpdate({userId:userid},{$set:{items:[], totalPrice:0 , totalItems:0}},{new:true})
      return res.status(200).send({status:false , message:"This order has been completed!"})

    }

   
}

module.exports={ createorder , updateorder}