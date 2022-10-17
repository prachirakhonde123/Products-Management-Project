const orderModel = require('../Models/orderModel')
const userModel = require('../Models/orderModel')
let { isvalidObjectId } = require('../Validations/validator')

const createorder = async function(req,res){
    let userid = req.params.userId
    let data = req.body
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

   let create  = await orderModel.create(data)
   return res.status(201).send({status: true , message: "Success", data: create})

}

const updateuser = async function(req,res){
    let userid = req.params.userId
    let obj={}
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
     let data = req.body
     let orderid = data.orderid
     const orderbelg = await orderModel.findOne({_id:orderid , userId:userid })
     if(!orderbelg) {
        return res.status(403).send({ status: false , message:"This order id does n't belong to this user id!"})
     }

     const updateorder = await orderModel.findOneAndUpdate({_id:userid},{$set: obj},{new:true})
     if(!updateorder){
        return res.status(404).send({ status:false , message: "user id does n't found!"})
     }
}

module.exports={ createorder , updateuser}