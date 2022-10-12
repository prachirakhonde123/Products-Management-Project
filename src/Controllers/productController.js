const productModel = require('../Models/productModel')
const uploadFile = require('../Aws/aws')
const {  validInstallment, isValidBody,isValid,validString} = require('../Validations/validator')
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
      } = requestBody;
  
  
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


  const getbyQuery = async function(req,res){
     let checksize = req.query.size
      
     const getq = await productModel.find({availableSizes:checksize , isDeleted:false})
     if(! getq){
        return res.status(404).send("size not found")
     }


     

  }


  module.exports = {productCreate,getbyQuery}