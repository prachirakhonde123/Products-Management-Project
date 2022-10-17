const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;


const orderSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User",
      required: true,
      unique: true,
    },
    items: [
        {
          productId: {
            type: ObjectId,
            required: true,
            ref: "Product",
          },
  
          quantity: { type: Number, required: true, minLen: 1 },
        },
      ],
      totalPrice:{
        type:Number,
        require:true
      },
      totalitems:{
        type:Number,
        require:true
      },
      cancellable:{
        type:Boolean,
        default: true
      },
      status :{
        type:String,
        default: 'pending',
         enum : [pending, completed, cancled]
      },
      deletedAt: {type : Date , default: null }, 
      isDeleted: {type: Boolean, default: false},
      
    }, { timestamps: true }
)

module.exports = mongoose.model("Product", orderSchema);