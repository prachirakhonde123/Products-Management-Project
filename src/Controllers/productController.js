const productModel = require('../Models/productModel')
const {uploadFile} = require('../Aws/aws')
const { validInstallment, isValidBody, isValid, validString, isvalidObjectId, isValidPrice, validImage, isValidName, validQuantity } = require('../Validations/validator')


//=========================================Create Product================================================

const productCreate = async function (req, res) {
  try {
    let files = req.files;
    let requestBody = req.body;
    let productImage;
    let obj = {}

    let {title,description,price,currencyId,currencyFormat,isFreeShipping,style,availableSizes,installments,isDeleted,...rest} = requestBody;

    if(!isValidBody(requestBody)) return res.status(400).send({ status: false, message: "Please provide valid request body" })

    if(isValidBody(rest)) return res.status(400).send({ status: false, message: "You can create product only using title,description,price,currencyId,currencyFormat,isFreeShipping,style,availableSizes,installments"})

  
    //==============================================Validation for Title===========================================================

    if(!title) return res.status(400).send({ status: false, message: "Title is Mandatory field" })

    if(title || title==""){
      if(!isValid(title)) return res.status(400).send({ status: false, message: "Please Enter title of Product" })
    }
   
    //_____________________________________________________Duplicate title________________________________

    const istitleAleadyUsed = await productModel.findOne({ title });
    if (istitleAleadyUsed) return res.status(409).send({status: false,message: `${title} is already in use. Please use another title.`});

    obj.title = title
    

    //======================================================Validation for Description==================================================

    if(!description) return res.status(400).send({ status: false, message: "Description is Mandatory field" })

    if(description || description == ""){
      if(!isValid(description)) return res.status(400).send({ status: false, message: "Description is required and it can't be empty" });
      obj.description = description
    } 
    
    
    //=========================================================Validation for Price=====================================================================

    if(!price) return res.status(400).send({ status: false, message: "Price is Mandatory field" })

    if(price || price==""){
      if (!isValid(price)) return res.status(400).send({status: false, message: "Price is required" })
      if(!isValidPrice(price)) return res.status(400).send({status: false, message : "Price should be in Number or Decimal"})
      obj.price = price
    }
   

    //=================================================Validation for CurrencyId==========================================================

    if(!currencyId) return res.status(400).send({ status: false, message: "CurrencyId is Mandatory field" })

    if(currencyId || currencyId==""){
      if (!isValid(currencyId)) return res.status(400).send({ status: false, message: "currencyId is required" })
      if(currencyId != "INR") return res.status(400).send({ status: false, message: "currencyId should be INR" });
      obj.currencyId = currencyId
    }
    

    //================================================Validation for currency format(₹)===================================================

    if(currencyFormat || currencyFormat==""){
      if(currencyFormat !== "₹"){
        return res.status(400).send({status : false, message : `CurrenFormat should be "₹"`})
      }
      obj.currencyFormat = currencyFormat
    }


    //================================================Validation for Style==================================================================

    if(style || style==""){  
      if(!isValid(style))  return res.status(400).send({ status: false, message: "Please Enter Style" });

      if(!isValidName(style)) return res.status(400).send({ status: false, message: "Please Enter Valid format of Style" });
      
      obj.style = style
    }

    //=============================================Validation for Installments=============================================================

    if(installments || installments=="") {
      if(!isValid(installments)) return res.status(400).send({ status: false, message: "installments can't be empty. Provide a number" });

      if(!validInstallment(installments)) return res.status(400).send({status: false,message: "Installments can't be a decimal number"});

      obj.installments = installments
      
    }

    
    //===================================================Validation for isFreeShipping======================================================

    if(isFreeShipping || isFreeShipping=="") {
      if(!isValid(isFreeShipping)) return res.status(400).send({status : false, message : "Please provide isFreeshipping status"})

      if(isFreeShipping != "true" || isFreeShipping != "false") return res.status(400).send({status: false,message: "isFreeShipping must be a boolean value"});
      
      obj.isFreeShipping = isFreeShipping
    }

   
  //=====================================================Validation for ProductImage============================================================

    if(files && files.length > 0){
      
      if(files.length>1) return res.status(400).send({status : false, message : "Provide only one image"})

      if (files[0].fieldname !== "productImage") { return res.status(400).send({ status: false, message: "Valid key is ProductImage. Please provide file with key productImage" })}

      var uploadImage = await uploadFile(files[0]);
      productImage = uploadImage

      if(!validImage(productImage)) return res.status(400).send({ status: false, message: "Please provide valid format of image i.e jpg,jpeg,png,gif"})
      obj.productImage = productImage

    }else{
       return res.status(400).send({status : false, message : "Please Provide ProductImage. It is mandatory"})
    }


    //==========================================Validation for AvailableSizes==============================================================

    if(!availableSizes) return res.status(400).send({status : false, message : "Availablesizes are mandatory field"}) 

    if (availableSizes || availableSizes==""){
      if(!isValid(availableSizes)) return res.status(400).send({status : false, message : "Please Provide Availablesizes"})

      availableSizes = availableSizes.toUpperCase()

      let sizesArray = availableSizes.split(",").map((x) => x.trim());
      for (let i = 0; i < sizesArray.length; i++){
        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i])) {
          return res.status(400).send({status: false, message:"AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']"});
        }
      }  
      obj.availableSizes = [...new Set(sizesArray)];     
    }

    //=====================================Validation for isDeleted====================================================================

    if(isDeleted || isDeleted==""){
      if(!isValid(isDeleted)) return res.status(400).send({status : false, message : "Value can't be Empty. Enter the value"})

      if(isDeleted != "false" || isDeleted != "true") return res.status(400).send({status : false, message : "Provide Boolean Value"})

      if(isDeleted == "true"){
        return res.status(400).send({status : false, message : "You cannot delete the product before creation.Use your brain. Bydefault it is false"})
      } 

      obj.isDeleted = isDeleted
    }



    //==================================================Creating Product===========================================================

     const saveProductDetails = await productModel.create(obj);
     return res.status(201).send({status: true,message: "Success",data: saveProductDetails});

  } 
  
  catch (err) {
    return res.status(500).send({ status: false, message: "Server Error", err: err.message });
  }
};



//*************************************************************Get Products by Filter/Query*************************************************

const getProductsByQuery = async function (req, res) {
  try {
    let query = req.query
    let validQuery = Object.keys(query)
    let validFilter = ['priceGreaterThan', 'priceLessThan', 'name', 'size', 'priceSort']
    let filter = {}

    for (let i = 0; i < validQuery.length; i++) {
      if (!validFilter.includes(validQuery[i])) {
        return res.status(400).send({ status: false, message: "Please provide valid Query to filter Data" })
      }
    }

    //=============================================If size is given===============================================
    if (query.size) {
      query.size = query.size.toUpperCase()
      let arr = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']
      let size1 = query['size'].split(",")
      for (let i = 0; i < size1.length; i++) {
        if (!arr.includes(size1[i])) return res.status(400).send({ status: false, message: "Size should be S,XS,M,X,L,XXL,XL" })
      }
      filter.availableSizes = { $in: size1 }
    }

    //===============================================If name is given==================================================
    if (query.name) {
      if (!isValid(query.name)) return res.status(400).send({ status: false, message: "Invalid format of name" })
      filter.title = { $regex: query.name, $options: 'i' }
    }

    //===============================================If priceGreterThan key is given===============================================
    if (query.priceGreaterThan) {
      if (!isValidPrice(query.priceGreaterThan)) return res.status(400).send({ status: false, message: "Please Provide Valid Price" })
      filter.price = { $gt: parseFloat(query.priceGreaterThan) }
    }

    //==============================================If priceLessThan key is given======================================================
    if (query.priceLessThan) {
      if (!isValidPrice(query.priceLessThan)) return res.status(400).send({ status: false, message: "Please Provide Valid Price" })
      filter.price = { $lt: parseFloat(query.priceLessThan) }
    }

    //==================================================If priceGreterThan and priceLessThan is given===================================
    if (query.priceGreaterThan && query.priceLessThan) {
      if (!isValidPrice(query.priceGreaterThan) && (!isValidPrice(query.priceLessThan)))
        return res.status(400).send({ status: false, message: "Please Provide Valid Price" })
      filter.price = { $lt: parseFloat(query.priceLessThan), $gt: parseFloat(query.priceGreaterThan) }
    }
    

    //=============================================Filtering Product====================================================================
    let findProduct = await productModel.find({ $and: [filter, { isDeleted: false }] }).sort({ price: query.priceSort }).select({ __v: 0 })
    if (findProduct.length === 0) {
      return res.status(404).send({ status: true, message: "No product found" })
    }

    return res.status(200).send({ status: true, message: "Success", data: findProduct })
  }

  catch (err) {
    return res.status(500).send({ message: "Server Error", })
  }
}



//**********************************************************Get Products by ProductId**************************************************

const getProductsById = async function (req, res) {
  try {
    const productId = req.params.productId;

    if(!isvalidObjectId(productId)) return res.status(400).send({status: false,message: `${productId} is not a valid product id`});
    
    const product = await productModel.findOne({ _id: productId, isDeleted: false });
    if(!product){ return res.status(404).send({ status: false, message: `product does not exists` })}
  
    return res.status(200).send({status: true,message: "Success",data: product});

  } 
  catch (err) {
    return res.status(500).send({ status: false, message: "Server Error", err: err.message });
  }
};




//*******************************************************Update the Products*************************************************************


const updateproduct = async function (req, res) {
  try{
  let productId = req.params.productId
  let obj = {}
  let obj1 = {}

  //===========================================If product Id is not given=====================================
  if (!productId) { return res.status(400).send({ status: false, message: "Product id must be present!" })}

  //======================================ProductId is given which is not a ObjectId==========================
  if (!isvalidObjectId(productId)) { return res.status(400).send({ status: false, message: "product id is not valid!" })}

  //========================================Finding whether the product is deleted========================================
  const checkprd = await productModel.findOne({ _id: productId})
  if (!checkprd) { return res.status(403).send({ status: false, message: "Product doesn't Exists with this productId!" })}

  if(checkprd.isDeleted == true){ return res.status(403).send({ status: false, message: "Product is Deleted from store! You cannot update it" })}

  //=================================================Destructuring====================================================================
  let { title, description, price, isFreeShipping, productImage, style, availableSizes, installments,...rest } = req.body

  if(!isValidBody(req.body)){return res.status(403).send({ status: false, message: "Please Provide data to update the product!" })}

  if(isValidBody(rest)) return res.status(400).send({status : false, message : "You can update the product using title, description, price, isFreeShipping, productImage, style, availableSizes, installments"})


  //=====================================================Updating ProductImage=====================================================

  let file = req.files
  if (file && file.length > 0) {
    if (!isValidBody(file)) {return res.status(400).send({ status: false, message: "Please provide product image" })}

    //______________________If wrong key is given incase of ProfileImage__________________________
    if (file[0].fieldname !== "productImage") {
      return res.status(400).send({ status: false, message: "Valid key is ProductImage. Please provide file with key productImage" });
    }

    productImage = await uploadFile.uploadFile(file[0]);
    obj.productImage = productImage

    //_______________________________If invalid format of image is given________________________
    if (!validImage(obj.productImage)) return res.status(400).send({ status: false, message: "Invalid Format of Image" })
  }

    //=================================================Validating  title=================================================
    if(title || title==""){
      if (!isValid(title)) {return res.status(400).send({ status: false, message: "Provide Title to update" })}

      //___________________________________Checking for duplicate title________________________________________________
      const alrtitle = await productModel.findOne({ title: title })
      if (alrtitle) { return res.status(409).send({ status: false, message: "This title already exists!" })}
      obj.title = title
    }


    //==================================================Validating  Description================================================
    if(description || description==""){
      if(!isValid(description)) {return res.status(400).send({ status: false, message: "Provide Description to update" })}
      obj.description = description
    }


    //====================================================Validating Price====================================================
    if (price || price=="") {
      if(!isValid(price)) return res.status(400).send({ status: false, message: "Provide Price to update" })
      if(!isValidPrice(price)) return res.status(400).send({ status: false, message: "Price is in Invalid Format" });     
      obj.price = price
    }


    //================================================Validating isFreeShipping================================================
    if (isFreeShipping || isFreeShipping=="") {
      isFreeShipping = isFreeShipping.toLowerCase()
      if(isFreeShipping != "true" || isFreeShipping != "false"){
        return res.status(400).send({status : false, message : "Provide a boolean value to update"})
      }
      obj.isFreeShipping = isFreeShipping
    }


    //=================================================Validating style (Not mandatory)=============================================
    if (style || style=="") {
      if(!isValid(style)) {return res.status(400).send({ status: false, message: "Please provide value to update style" })}
      if (!isValidName(style)) {return res.status(400).send({ status: false, message: "Style should contains only alphabets" })}
      obj.style = style
    }


    //====================================================Validating Installments======================================================
    if (installments || installments=="") {
      if(!isValid(installments)) return res.status(400).send({status : false, message : "Please enter value of installment"})
      if(!validInstallment(installments)) {return res.status(400).send({status: false,message: "installments can't be a decimal number "})}
      obj.installments = installments
    }


    //=====================================================Updating Sizes of Product===================================================

    if (availableSizes) {
      let Sizes = availableSizes.split(",").map(x => { return x = x.toUpperCase() });
      let validSizes = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'];
      let Result = Sizes.filter(x => validSizes.includes(x));
      if (Sizes.length !== Result.length) return res.status(400).send({ status: false, message: "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']" })
      obj1 = { availableSizes: { $each: Sizes } }
    }
   

  //======================================================Updating product====================================================================
  const updatepd = await productModel.findOneAndUpdate({ _id: productId }, { $set: obj, $addToSet: obj1 }, { new: true }).select({__v : 0})
  if (!updatepd) { return res.status(404).send({ status: false, message: "product id not found!" })}

  return res.status(200).send({ status: true, message: "Success", data : updatepd })
}
catch(err){
    res.status(500).send({status : false, message : err.message})
}
}



//********************************************************Delete Product by Id***************************************************************

const deleteProduct = async function (req, res) {
  try {
    const params = req.params;
    const productId = params.productId;

    //============================================If invalid ProductId is given====================================================

    if (!isvalidObjectId(productId)) {return res.status(400).send({status: false,message: `${productId} is not a valid product id`})}

    const product = await productModel.findOne({ _id: productId });
    if (!product) { return res.status(400).send({status: false,message: `Product doesn't exists by ${productId}`})}

    //==================================================Deleteing the product====================================================
    if (product.isDeleted == false) {
      await productModel.findOneAndUpdate(
        { _id: productId },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      return res.status(200).send({ status: true, message: `Product deleted successfully.` });
    }

    //=====================================If product is already deleted i.e isDeleted = true===================================
    return res.status(200).send({ status: true, message: `Product has been already deleted.` });
  }

  catch (err) {
    return res.status(500).send({ status: false, message: "Server Error", err: err.message });
  }
}


//==============================================modules=====================================================

module.exports = { productCreate, getProductsByQuery, getProductsById, updateproduct, deleteProduct }



















