const productModel = require('../Models/productModel')
const uploadFile = require('../Aws/aws')
const { validInstallment, isValidBody, isValid, validString } = require('../Validations/validator')
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
    }
    currencyFormat = currencySymbol("INR");
    
    //_______________________________________________Validation for Style_____________________________________________
    if (style) {
      if (!validString(style)) {
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
      if (!(isFreeShipping != true)) {
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
    let query = req.query
    let filter = {}
    
    //___________________If size is given_____________________
    if (query.size) {
      query.size = query.size.toUpperCase()
      let arr = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']
      let size1 = query['size'].split(",")
      for (let i = 0; i < size1.length; i++) {
        if (!arr.includes(size1[i])) return res.status(400).send({ status: false, message: "Size should be S,XS,M,X,L,XXL,XL" })
      }
      filter.availableSizes = { $in: size1 }
    }

    //__________________If name is given______________________________
    if (query.name) {
      if (!isValid(query.name)) return res.status(400).send({ status: false, message: "Invalid format of name" })
      filter.title = { $regex: query.name, $options: 'i' }
    }
    
    //_____________________If priceGreterThan key is given_____________________
    if (query.priceGreaterThan) {
      filter.price = { $gt: Number(query.priceGreaterThan) }
    }
    
    //____________________If priceLessThan key is given_____________________________
    if (query.priceLessThan) {
      filter.price = { $lt: Number(query.priceLessThan) }
    }

    //_________________If priceGreterThan and priceLessThan is given__________________________
    if (query.priceGreaterThan && query.priceLessThan) {
      filter.price = { $lt: Number(query.priceLessThan), $gt: Number(query.priceGreaterThan) }
    }
    
    let findProduct = await productModel.find({ $and: [filter, { isDeleted: false }] }).sort({ price: query.priceSort })
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
  
  //____________________________If product Id is not given___________________________________
  if (!productId) {
    return res.status(400).send({ status: false, message: "Product id must be present!" })
  }
  
  //_________________________ProductId is given which is not a ObjectId__________________________
  if (!isvalidObjectId(productId)) {
    return res.status(400).send({ status: false, message: "product id is not valid!" })
  }
  
  //_______________________Finding whether the product is deleted__________________________________
  const checkprd = await productModel.findOne({ _id: productId, isDeleted: false })
  if (!checkprd) {
    return res.status(403).send({ status: false, message: "Product doesn't Exists!" })
  }

  let { title, description, price, isFreeShipping, productImage, style, availableSizes, installments } = req.body

  //__________________________________If wrong key is given_____________________________________________
  if (!(title || description || price || isFreeShipping || style || availableSizes || installments)) {
    return res.status(400).send({ status: false, message: "Mantodatry field  not present!" })
  }


  //__________________________________________Validation Starts_____________________________________________
  if ((title || description || price || isFreeShipping || style || availableSizes || installments)) {

    //______________________________________Validating  title___________________________________________
    if (title) {
      if (!isValid(title)) {
        return res
          .status(400)
          .send({ status: false, message: "Title is required" });
      }
    //____________________________________Checking for duplicate title_________________________________________________
      const alrtitle = await productModel.findOne({ _id: productId, title: title })
      if (alrtitle) {
        return res.status(409).send({ status: false, message: "this title already exists!" })
      }
    }

    //______________________________________Validating  Description________________________________________
    if (description) {
      if (!isValid(description)) {
        return res
          .status(400)
          .send({ status: false, message: "Description is required" });
      }
    }
    
    //_______________________________________Validating Price____________________________________________
    if (price) {
      if (!isValid(price)) {
        return res
          .status(400)
          .send({ status: false, message: "Price is required" });
      }
    }
    
    //______________________________________Validating isFreeShipping___________________________________________
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

    //________________________________Converting profileImage into S3 Link__________________________________________
    if (productImage) {
      if (file && file.length > 0) {
        var uploadImage = await uploadFile(file[0]);
      }
    }

    //_________________________________________--Validating style_______________________________________________________
    if (style) {
      if (!validString(style)) {
        return res
          .status(400)
          .send({ status: false, message: "style is required" });
      }
    }

    //________________________________________Validating Installments_________________________________________________
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

    //__________________________________________Updating Sizes of Product_______________________________________________

    if (availableSizes) {
      //________If size is already Present in the product___________________
      let size = await productModel.findOne({ _id: productId, availableSizes: availableSizes })
      if (size) {
        return res.status(409).send({ status: false, message: "This size already exists!" })
      }
      //_____________Wrong size is given_______________________________________
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

  //___________________________________________Updating Product___________________________________________________________________
  const updatepd = await productModel.findOneAndUpdate({ _id: productId }, {
    $set: {
      title: title, description: description, price: price,
      isFreeShipping: isFreeShipping, productImage: productImage, style: style, installments: installments
    }, $push: { availableSizes: availableSizes }
  }, { new: true })

  if (!updatepd) {
    return res.status(404).send({ status: false, message: "product id not found!" })
  }

  return res.status(200).send({ status: true, message: updatepd })
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