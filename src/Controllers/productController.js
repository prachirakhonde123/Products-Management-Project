const productModel = require('../Models/productModel')
const uploadFile = require('../Aws/aws')
const {  validInstallment, isValidBody,isValid,validString,isvalidObjectId} = require('../Validations/validator')
const currencySymbol = require('currency-symbol-map')



const productCreate = async function (req, res) {
    try {
      let files = req.files;
      let requestBody = req.body;
      let productImage;
  
      
      if (!isValidBody(requestBody)) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide valid request body" });
      }
  
  
      let {
        title,
        description,
        price,
        currencyId,
        currencyFormat,
        isFreeShipping,
        style,
        availableSizes,
        installments,
      } = requestBody; // destructure
  
  
      if (!isValid(title)) {
        return res
          .status(400)
          .send({ status: false, message: "Title is required" });
      }
  
      // title  uniqueness.
      const istitleAleadyUsed = await productModel.findOne({ title });
      if (istitleAleadyUsed) {
        return res.status(400).send({
          status: false,
          message: `${title} is alraedy in use. Please use another title.`,
        });
      }
  
      //uploading product image  AWS.
      if (files) {
        if (isValidBody(files)) {
          if (!(files && files.length > 0)) {
            return res
              .status(400)
              .send({ status: false, message: "Please provide product image" });
          }
          productImage = await uploadFile.uploadFile(files[0]);
        }
      }
  
      if (!isValid(description)) {
        return res
          .status(400)
          .send({ status: false, message: "Description is required" });
      }
  
      if (!isValid(price)) {
        return res
          .status(400)
          .send({ status: false, message: "Price is required" });
      }
  
      if (!isValid(currencyId)) {
        return res
          .status(400)
          .send({ status: false, message: "currencyId is required" });
      }
  
      if (currencyId != "INR") {
        return res
          .status(400)
          .send({ status: false, message: "currencyId should be INR" });
      }
  
      if (!isValid(currencyFormat)) {
        currencyFormat = currencySymbol("INR");
      }
      currencyFormat = currencySymbol("INR"); 
  
      if (style) {
        if (!validString(style)) {
          return res
            .status(400)
            .send({ status: false, message: "style is required" });
        }
      }
  
      if (installments) {
        if (!isValid(installments)) {
          return res
            .status(400)
            .send({ status: false, message: "installments required" });
        }
      }
      if (installments) {
        if (!validInstallment(installments)) {
          return res
            .status(400)
            .send({
              status: false,
              message: "installments can't be a decimal number ",
            });
        }
      }
  
      if (isFreeShipping) {
        if (!(isFreeShipping != true)) {
          return res
            .status(400)
            .send({
              status: false,
              message: "isFreeShipping must be a boolean value",
            });
        }
      }
  
      productImage = await uploadFile.uploadFile(files[0]);
  
      //object destructuring for response body.
      const newProductData = {
        title,
        description,
        price,
        currencyId,
        currencyFormat: currencyFormat,
        isFreeShipping,
        style,
        availableSizes,
        installments,
        productImage: productImage,
      };
  
      //validating sizes to take multiple sizes at a single attempt.
      if (availableSizes) {
        let sizesArray = availableSizes.split(",").map((x) => x.trim());
  
        for (let i = 0; i < sizesArray.length; i++) {
          if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i])) {
            return res
              .status(400)
              .send({
                status: false,
                message:
                  "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']",
              });
          }
        }
  
        //using array.isArray function to check the value is array or not.
        if (Array.isArray(sizesArray)) {
          newProductData["availableSizes"] = [...new Set(sizesArray)];
        }
      }
      const saveProductDetails = await productModel.create(newProductData);
      return res
        .status(201)
        .send({
          status: true,
          message: "Product added successfully.",
          data: saveProductDetails,
        });
    } catch (err) {
      return res
        .status(500)
        .send({ status: false, message: "Server Error", err: err.message });
    }
  };


  const getProductsByQuery = async function(req,res){
    try{
    let query = req.query
    let {size,name,priceGreaterThan,priceLessThan} = query
    let filter = {}

    if(size){
      size = size.toUpperCase()
      let arr = ['S','XS','M','X','L','XXL','XL']
      if(!arr.includes(size)) return res.status(400).send({status : false, message : "Size should be S,XS,M,X,L,XXL,XL"})
      filter.availableSizes = {$in : size}
    }

   
    if(name){
      if (!isValid(name)) return res.status(400).send({ status: false, message: "Invalid format of name" })
      filter.title = { $regex: name, $options: 'i' }
    }

    if(priceGreaterThan){
      filter.price = {$gte : Number(priceGreaterThan)}
    }

    if(priceLessThan){
      filter.price = {$lte : Number(priceLessThan)}
    }

    let findProduct = await productModel.find({$and : [filter,{isDeleted : false}]}).sort({title:1})
    if(findProduct.length === 0){
      return res.status(404).send({status : true, message : "No product found"})
    }

    return res.status(200).send({status : true, message : "Products found", data : findProduct})
  }
  
    catch(err){
      return res.status(500).send({ status: false , message : err.message})
    }

  }

  const getProductsById = async function (req, res) {
    try {
      const productId = req.params.productId;
  
      //validation starts.
      if (!isvalidObjectId(productId)) {
        return res.status(400).send({
          status: false,
          message: `${productId} is not a valid product id`,
        });
      }
      //validation ends.
  
      const product = await productModel.findOne({
        _id: productId,
        isDeleted: false,
      });
  
      if (!product) {
        return res
          .status(404)
          .send({ status: false, message: `product does not exists` });
      }
  
      return res.status(200).send({
        status: true,
        message: "Product found successfully",
        data: product,
      });
    } catch (err) {
      return res
        .status(500)
        .send({ status: false, message: "Server Error", err: err.message });
    }
  };

  const updateproduct = async function(req,res){
     let productId = req.params.productId
     let file = req.files

     if(!productId){
      return res.status(400).send({status:false , message: "Product id must be present!"})
     }
    
     if(!isvalidObjectId(productId)){
      return res.status(400).send({ status:false , message: "product id is not valid!"})
     }

     const checkprd =await productModel.findOne({_id:productId , isDeleted: false})
     if(!checkprd){
      return res.status(403).send({ status:false , message:"product id does n't exists!"})
     }

    let { title,description,price,  isFreeShipping ,productImage , style , availableSizes , installments } = req.body
      
       
    if(!(title|| description|| price|| isFreeShipping|| style || availableSizes|| installments)){
      return res.status(400).send({ status: false, message: "Mantodatry field  not present!" })
    }
     
    if((title|| description|| price|| isFreeShipping|| style || availableSizes|| installments)){
    if(title){
      if (!isValid(title)) {
        return res
          .status(400)
          .send({ status: false, message: "Title is required" });
      }

      const alrtitle = await productModel.findOne({_id:productId , title:title})
      if(alrtitle){
        return res.status(409).send({status:false , message:"this title already exists!"})
      }
    }
  

    if(description){
      if (!isValid(description)) {
        return res
          .status(400)
          .send({ status: false, message: "Description is required" });
      }
    }

    if(price){
      if (!isValid(price)) {
        return res
          .status(400)
          .send({ status: false, message: "Price is required" });
      }
    }


    if(isFreeShipping){
      if (!(isFreeShipping != true)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "isFreeShipping must be a boolean value",
          });
      }
    }
 
    if(productImage){
      if(file && file.length > 0){
        var uploadImage = await uploadFile(file[0]);
    }
    }

    if(style){
      if (!validString(style)) {
        return res
          .status(400)
          .send({ status: false, message: "style is required" });
      }
    }
     
    if (installments) {
       if (!validInstallment(installments)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "installments can't be a decimal number ",
          });
      }
    }
    if (availableSizes) {

      let size = await productModel.findOne({_id:productId,  availableSizes:availableSizes})
      if(size){
        return res.status(409).send({status:false , message : "this size already exists!"})
      }
      let sizesArray = availableSizes.split(",").map((x) => x.trim());

      for (let i = 0; i < sizesArray.length; i++) {
        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i])) {
          return res
            .status(400)
            .send({
              status: false,
              message:
                "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']",
            });
        }
      }
    }
  }
    



     const updatepd = await productModel.findOneAndUpdate({_id: productId },{$set:{title:title , description:description , price:price , 
      isFreeShipping:isFreeShipping ,productImage:productImage ,style:style, installments: installments},$push:{availableSizes:availableSizes}},{new:true})

       if(!updatepd){
        return res.status(404).send({status: false , message : "product id not found!"})
       }

       return res.status(200).send({status: true , message: updatepd})
  }
    
  module.exports = {productCreate, getProductsByQuery ,getProductsById ,updateproduct }