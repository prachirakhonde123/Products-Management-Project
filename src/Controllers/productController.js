const productModel = require('../Models/productModel')
const uploadFile = require('../Aws/aws')
const { validInstallment, isValidBody, isValid, validString,isvalidObjectId, isValidPrice, isValidPassword,isValidName} = require('../Validations/validator')
const currencySymbol = require('currency-symbol-map')


//=========================================Create Product================================================
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

     if(!(title && description && price && currencyId && currencyFormat && availableSizes ) && (!files)){
      return res.status(400).send({ status: false, msg: "All fields are mandatory." })
     }
    //____________________________________________Validation for Title_____________________________________

    if (!isValid(title)) {
      return res
        .status(400)
        .send({ status: false, message: "Title is required" });
    }
  //___________________________Duplicate title________________________________
    const istitleAleadyUsed = await productModel.findOne({ title });
    if (istitleAleadyUsed) {
      return res.status(400).send({
        status: false,
        message: `${title} is alraedy in use. Please use another title.`,
      });
    }

    //______________________________Uploading product image AWS_________________________________
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
    
    //__________________________________________Validation for Description__________________________
    if (!isValid(description)) {
      return res
        .status(400)
        .send({ status: false, message: "Description is required" });
    }
    
    //_______________________________________________Validation for Price________________________________________
    if (!isValid(price)) {
      return res
        .status(400)
        .send({ status: false, message: "Price is required" });
    }

    if(!isValidPrice(price)){
      return res
      .status(400)
      .send({status : false, message : "Price should be in Number or Decimal"}) 
    }
    
    //_________________________________________Validation for CurrencyId_________________________________-
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

    //____________________________________________Validation for Currency Format_________________________________
    if (!isValid(currencyFormat)) {
      currencyFormat = currencySymbol("INR");
      return res
        .status(400)
        .send({ status: false, message: "currencyFormat is required" });
    }
    currencyFormat = currencySymbol("INR");
    
    //_______________________________________________Validation for Style_____________________________________________
    if (style) {
     
      if (!validString) {  // style ma
        return res
          .status(400)
          .send({ status: false, message: "style is required" });
      }
    }
    
    //____________________________________________Validation for Installments__________________________________________
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
    
    //______________________________________________Validation for isFreeShipping___________________________________________
    if (isFreeShipping) {
     
      if (!(isFreeShipping != true || isFreeShipping != false )) {
        return res
          .status(400)
          .send({
            status: false,
            message: "isFreeShipping must be a boolean value",
          });
      }  
    }
    
    //_____________________________________________________Converting image into Link______________________________________________________
    productImage = await uploadFile.uploadFile(files[0]);

    //_______________________________________________Object destructuring for response body________________________________________
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

    //________________________________Validating sizes to take multiple sizes at a single attempt____________________________
    if (availableSizes) {
      availableSizes = availableSizes.toUpperCase()
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


    //_______________________________________________Creating Product______________________________________________________
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



//===================================================Get Products by Filter/Query==========================================================================

const getProductsByQuery = async function (req, res) {
  try {
    //let {priceGreaterThan, priceLessThan, name, size} = req.query
    let query = req.query
    let validQuery = Object.keys(query)
    let validFilter = ['priceGreaterThan','priceLessThan','name','size','priceSort']
    let filter = {}

    for(let i = 0; i < validQuery.length; i++){
    if(!validFilter.includes(validQuery[i])){
      return res.status(400).send({status : false, message : "Please provide valid Query to filter Data"})
    }}
    
    //___________________If size is given_____________________
    if(query.size){
      query.size = query.size.toUpperCase()
      let arr = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']
      let size1 = query['size'].split(",")
      for (let i = 0; i < size1.length; i++) {
        if (!arr.includes(size1[i])) return res.status(400).send({ status: false, message: "Size should be S,XS,M,X,L,XXL,XL" })
      }
      filter.availableSizes = { $in: size1 }
    }

    //__________________If name is given______________________________
    if(query.name){
      if(!isValid(query.name)) return res.status(400).send({ status: false, message: "Invalid format of name" })
      filter.title = { $regex: query.name, $options: 'i' }
    }
    
    //_____________________If priceGreterThan key is given_____________________
    if (query.priceGreaterThan) {
      if(!isValidPrice(query.priceGreaterThan)) return res.status(400).send({ status: false, message: "Please Provide Valid Price" })
      filter.price = { $gt: parseFloat(query.priceGreaterThan) }
    }
    
    //____________________If priceLessThan key is given_____________________________
    if (query.priceLessThan) {
      if(!isValidPrice(query.priceLessThan)) return res.status(400).send({ status: false, message: "Please Provide Valid Price" })
      filter.price = { $lt: parseFloat(query.priceLessThan) }
    }

    //_________________If priceGreterThan and priceLessThan is given__________________________
    if (query.priceGreaterThan && query.priceLessThan) {
      if(!isValidPrice(query.priceGreaterThan) && (!isValidPrice(query.priceLessThan)))
      return res.status(400).send({ status: false, message: "Please Provide Valid Price" })
      filter.price = { $lt: parseFloat(query.priceLessThan), $gt: parseFloat(query.priceGreaterThan) }
    }
    
    let findProduct = await productModel.find({ $and: [filter, { isDeleted: false }] }).sort({ price: query.priceSort }).select({__v : 0})
    if (findProduct.length === 0) {
      return res.status(404).send({ status: true, message: "No product found" })
    }

    return res.status(200).send({ status: true, message: "Products found", data: findProduct })
  }

  catch (err) {
    return res.status(500).send({ message: "Server Error", })
  }
}


//==============================================Get Products by ProductId=====================================================

const getProductsById = async function (req, res) {
  try {
    const productId = req.params.productId;

    //____________________If invalid ProductId is given________________
    if (!isvalidObjectId(productId)) {
      return res.status(400).send({
        status: false,
        message: `${productId} is not a valid product id`,
      });
    }
  
    const product = await productModel.findOne({ _id: productId, isDeleted: false});
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




//======================================================Update the Products====================================================================

const updateproduct = async function (req, res) {
  let productId = req.params.productId 
  let file = req.files
  let obj = {}
  let obj1 = {}
  //___________________________If product Id is not given__________________________________
  if (!productId) {
    return res.status(400).send({ status: false, message: "Product id must be present!" })
  }
  
  //________________________ProductId is given which is not a ObjectId_________________________
  if (!isvalidObjectId(productId)) {
    return res.status(400).send({ status: false, message: "product id is not valid!" })
  }
  
  //______________________Finding whether the product is deleted_________________________________
  const checkprd = await productModel.findOne({ _id: productId, isDeleted: false })
  if (!checkprd) {
    return res.status(403).send({ status: false, message: "Product doesn't Exists!" })
  }
  let { title, description, price, isFreeShipping, productImage, style, availableSizes, installments } = req.body

  

  //_________________________________________Validation Starts____________________________________________
  if ((title || description || price || isFreeShipping || style || availableSizes || installments)) {

    //_____________________________________Validating  title__________________________________________
    if (title) {
      if (!isValid(title)) {
        return res
          .status(400)
          .send({ status: false, message: "Title is required" });
      }
    //___________________________________Checking for duplicate title________________________________________________
      const alrtitle = await productModel.findOne({ title: title })
      if (alrtitle) {
        return res.status(409).send({ status: false, message: "This title already exists!" })
      }
      obj.title = title
    }

    //_____________________________________Validating  Description_______________________________________
    if (description) {
      if (!isValid(description)) {
        return res
          .status(400)
          .send({ status: false, message: "Description is required" });
      }
      obj.description = description
    }
    
    //______________________________________Validating Price___________________________________________
    if (price) {
      if (!isValidPrice(price)) {
        return res
          .status(400)
          .send({ status: false, message: "Price is in Invalid Format" });
      }
      obj.price = price
    }
    
    //_____________________________________Validating isFreeShipping__________________________________________
     if(isFreeShipping) {
         isFreeShipping = isFreeShipping.toLowerCase()
      if((isFreeShipping == 'true') || (isFreeShipping == 'false')) {
          isFreeShipping = JSON.parse(isFreeShipping) // converting string to boolean i.e in its original form
      }else{
        return res.status(400).send({ status: false, message: "Enter a valid value for isFreeShipping i.e true or false" })
      }
      obj.isFreeShipping = isFreeShipping
    }
  
   
       if (file && file.length > 0) {
          if (!isValidBody(file)){
          return res
            .status(400)
            .send({ status: false, message: "Please provide product image" });
        }
       
       productImage = await uploadFile.uploadFile(file[0]);
     //   console.log(productImage)
    //  }
    
    obj.productImage = productImage
      }

    //________________________________________--Validating style______________________________________________________
    if (style) {
      if (!validString(style)) {
        return res
          .status(400)
          .send({ status: false, message: "style is required" });
      }
      obj.style = style
    }

    //_______________________________________Validating Installments________________________________________________
    if (installments) {
      if (!validInstallment(installments)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "installments can't be a decimal number ",
          });
      }
      obj.installments = installments
    }

    //_________________________________________Updating Sizes of Product______________________________________________

    if (availableSizes) {
      let Sizes = availableSizes.split(",").map(x => { return x = x.toUpperCase() });
      let validSizes = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'];
      let Result = Sizes.filter(x => validSizes.includes(x));
      if (Sizes.length !== Result.length) return res.status(400).send({ status: false, message: "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']" })
      obj1 = { availableSizes: { $each:Sizes}}
  }
}


  const updatepd = await productModel.findOneAndUpdate({ _id: productId },{$set : obj, $addToSet : obj1},{new : true})
  if (!updatepd) {
    return res.status(404).send({ status: false, message: "product id not found!" })
  }

  return res.status(200).send({ status: true, message:updatepd})
}
//========================================================Delete Product by Id=================================================================

const deleteProduct = async function (req, res) {
  try {
    const params = req.params;
    const productId = params.productId;

    //__________________________________________If invalid ProductId is given________________________
    if (!isvalidObjectId(productId)) {
      return res.status(400).send({
        status: false,
        message: `${productId} is not a valid product id`,
      });
    }

    const product = await productModel.findOne({ _id: productId });
    if (!product) {
      return res.status(400).send({
        status: false,
        message: `Product doesn't exists by ${productId}`,
      });
    }
    
    //_______________________________________________Deleteing the product____________________________________________
    if (product.isDeleted == false) {
      await productModel.findOneAndUpdate(
        { _id: productId },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      return res.status(200).send({ status: true, message: `Product deleted successfully.` });
    }
    
    //____________________________________If product is already deleted i.e isDeleted = true___________________
    return res.status(400).send({ status: true, message: `Product has been already deleted.` });
} 

catch (err) {
  return res
    .status(500)
    .send({ status: false, message: "Server Error", err: err.message});
 }
};




module.exports = { productCreate, getProductsByQuery, getProductsById, updateproduct, deleteProduct }



















// if (availableSizes) {
    //   //____________Wrong size is given______________________________________
    //   availableSizes = availableSizes.toUpperCase()
    //   var sizesArray = availableSizes.split(",").map((x) => x.trim());
    //   for (let i = 0; i < sizesArray.length; i++) {
    //     if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i])) {
    //       return res
    //         .status(400)
    //         .send({
    //           status: false,
    //           message:
    //             "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']",
    //         });
    //     }
    //   }
    // }