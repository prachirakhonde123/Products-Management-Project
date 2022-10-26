const userModel = require('../Models/userModel')
const { uploadFile } = require('../Aws/aws')
const { isValidEmail, isValidName, isValidBody, isValidPassword, isvalidPhone, isvalidPincode, isValid, isvalidObjectId, validImage } = require('../Validations/validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

//=========================================== Create or Register User ==============================================

const registerUser = async function (req, res) {
    try {
        const data = req.body
        let file = req.files
        const { fname, lname, email, phone, password, address, profileImage, ...rest } = data

        if (!isValidBody(data)) return res.status(400).send({ status: false, message: "Body can't be Empty!" })

        if (isValidBody(rest)) return res.status(400).send({ status: false, message: "You can create user only using fname, lname, email, phone, password, address, profileImage !" })

    //===========================================Validation for First Name===================================================
        if (!fname) return res.status(400).send({ status: false, message: "First Name is Mandatory" })

        if (fname || fname == "") {
            if (!isValid(fname)) return res.status(400).send({ status: false, message: "First Name is in Invalid Format" })

            if (!isValidName(fname)) return res.status(400).send({ status: false, message: "First Name contains only letters" })
        }

    //==================================================Validation of Last Name====================================================
        if (!lname) return res.status(400).send({ status: false, message: "Last Name is Mandatory" })
        if (lname || lname == "") {
            if (!isValid(lname)) return res.status(400).send({ status: false, message: "Please provide Last Name" })
            if (!isValidName(lname)) return res.status(400).send({ status: false, message: "Last Name contains only letters" })
        }

    //==================================================Validation for Email=======================================================
        if (!email) return res.status(400).send({ status: false, message: "Email is Mandatory" })
        if (email || email == "") {
            if (!isValid(email)) return res.status(400).send({ status: false, message: "Please provide Email" })
            if (!isValidEmail(email.trim())) return res.status(400).send({ status: false, message: "Email is in Invalid Format" })
        }

        let duplicateEmail = await userModel.findOne({ email: email })
        if (duplicateEmail) return res.status(409).send({ status: false, message: `User is already registered with ${email} Email` })

    //==================================================Validation for mobile====================================================

        if (!phone) return res.status(400).send({ status: false, message: "Phone is Mandatory" })
        if (phone || phone == "") {
            if (!isValid(phone)) return res.status(400).send({ status: false, message: "Please provide Phone Number" })
            if ((!isvalidPhone(phone)) || (!isValid(phone))) return res.status(400).send({ status: false, message: "Invalid Format of mobile Number. Provide 10 digit Indian and Valid Phone Number" })
        }

        let duplicateMobile = await userModel.findOne({ phone: phone })
        if (duplicateMobile) return res.status(409).send({ status: false, message: `User is already registered with ${phone} mobile number` })


    //===========================================Validation for Password==============================================================
        if (!password) return res.status(400).send({ status: false, message: "Password is Mandatory" })
        if (password || password == "") {
            if (!isValid(password)) return res.status(400).send({ status: false, message: "Please provide Password" })
            if (!isValidPassword(password)) return res.status(400).send({ status: false, message: "Password length should be between 8-15" })
        }


    //=============================================Validation for Address==============================================================


    let addresss = JSON.parse(address)
    if (!address) return res.status(400).send({ status: false, message: "Please include address" });

    if (typeof address === "string")  {addresss = JSON.parse(address)}
    if (!isValidBody(address)) return res.status(400).send({ status: false, message: "address is required" })

    if (!addresss.shipping) { return res.status(400).send({ status: false, message: "Please include shipping address" }) };

    if (!isValidBody(addresss.shipping)) return res.status(400).send({ status: false, message: "shipping address is required" })

    if (!addresss.shipping.street) { return res.status(400).send({ status: false, message: "Please include shipping street" }) };
    if (!isValid(addresss.shipping.street)) {
        return res.status(400).send({ status: false, message: "street is required in shipping address!" });
    }

    if (!addresss.shipping.city) { return res.status(400).send({ status: false, message: "Please include shipping city" }) };
    if (!isValid(addresss.shipping.city)) {
        return res.status(400).send({ status: false, message: "city is required in shipping address!" });
    }

    if (!addresss.shipping.pincode) return res.status(400).send({ status: false, message: "please provide shipping pincode" });
    if (!isvalidPincode(addresss.shipping.pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode." })


    if (!addresss.billing) { return res.status(400).send({ status: false, message: "Please include billing address" }) };
    if (!isValidBody(addresss.billing)) return res.status(400).send({ status: false, message: "billing address is required" })

    if (!addresss.billing.street) { return res.status(400).send({ status: false, message: "Please include billing street" }) };
    if (!isValid(addresss.billing.street)) {
        return res.status(400).send({ status: false, message: "street is required in billing address!" });
    }

    if (!addresss.billing.city) { return res.status(400).send({ status: false, message: "Please include billing city" }) };
    if (!isValid(addresss.billing.city)) {
        return res.status(400).send({ status: false, message: "city is required in billing address!" });
    }

    if (!addresss.billing.pincode) return res.status(400).send({ status: false, message: "please provide billing address!" });
    if (!isvalidPincode(addresss.billing.pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode." })

    data.address = addresss

    //==============================================Encrypting Password=================================================
    let securedPass = await bcrypt.hash(password, 10)
    data.password = securedPass //updating key 

    //=================================Validation for ProfileImage======================================================
    if (file.length == 0) return res.status(400).send({ status: false, message: "ProfileImage field is Mandatory" });

        //____________________________If wrong key is given incase of ProfileImage__________________________
        if (file[0].fieldname !== "profileImage") {
            return res.status(400).send({ status: false, message: "Valid key is ProfileImage. Please provide file with key profileImage" });
        }

        if (file && file.length > 0) {
            let uploadImage = await uploadFile(file[0]);
            data.profileImage = uploadImage
            if (!validImage(data.profileImage)) return res.status(400).send({ status: false, message: "Invalid format of image" })
        }
    
    //=============================================Creating User===================================================================

        const createUser = await userModel.create(data)
        res.status(201).send({ status: true, message: "User registered succesfully", data: createUser });
    }

    catch (err) {
        res.status(500).send({ message: "Server Error", err: err.message })
    }
}


//*****************************************************Login User**************************************************

const userLogin = async function (req, res) {
    try {
        let data = req.body
        const { email, password, ...rest } = data

        if (!isValidBody(data)) { return res.status(400).send({ status: false, msg: "request body canot be empty" }) }

        if (isValidBody(rest)) { return res.status(400).send({ status: false, msg: "Just provide Email and Password to login. No extra keys" }) }

        if (!email) { return res.status(400).send({ status: false, message: "Please provide Email to login" }) }

        if (email || email == "") {
            if (!isValid(email)) return res.status(400).send({ status: false, msg: "Please Provide Email!" })
            if (!isValidEmail(email.trim())) return res.status(400).send({ status: false, msg: "Invalid email format" });
        }

        if (!password) { return res.status(400).send({ status: false, message: "Please provide Password to login" }) }

        if (password || password == "") {
            if (!isValid(password)) return res.status(400).send({ status: false, msg: "Please Provide Password!" })
            if (!isValidPassword(password)) return res.status(400).send({ status: false, msg: "Please Provide Valid Password!" })
        }

        const findUser = await userModel.findOne({ email: email })
        if (!findUser) return res.status(401).send({ status: false, message: "Wrong Email! Invalid Credentials" })

        //Using comapre method of bcrypt to match the db password and password given by user
        let validUser = await bcrypt.compare(password, findUser.password)
        if (!validUser) return res.status(401).send({ status: false, message: "Invalid Credentials! Wrong Password" })

        let token = jwt.sign({ userId: findUser._id }
            , "verysecretkeyofgroup27"
            , { expiresIn: "24h" })

        let decode = jwt.decode(token, "verysecretkeyofgroup27")

        res.status(201).send({ status: true, message: "User logged in Successful", data: { token: token, userId: decode.userId } })

    }

    catch (error) {
        res.status(500).send({ status: false, err: error.message })
    }
}


//*************************************************************** Get Profile Details ***************************************************************

const getProfile = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!isvalidObjectId(userId)) { return res.status(400).send({ status: false, message: "Invalid userId in params." }); }

        const findUserProfile = await userModel.findOne({ _id: userId });
        if (!findUserProfile) { return res.status(400).send({ status: false, message: `User doesn't exists by ${userId}` }); }

        return res.status(200).send({ status: true, message: "Profile found successfully.", data: findUserProfile, });
    }

    catch (err) {
        return res.status(500).send({ status: false, message: "Server Error", err: err.message });
    }
};



//********************************************************Update Profile API*************************************************

const updateuser = async function (req, res) {
    try{
    let user = req.params.userId
    let obj = {}

    //=========================================Invalid Format of UserId is given==============================================
    if (!isvalidObjectId(user)) {
        return res.status(400).send({ status: false, message: "Please provide a valid userId" })
    }

    //=========================================Updating Profile Image==============================================================

    let file = req.files
    if (file && file.length > 0) {
        if (!isValidBody(file)) { return res.status(400).send({ status: false, message: "Please provide product image" })}

         //__________________________________If wrong key is given incase of ProfileImage__________________________

        if(file[0].fieldname !== "productImage") { return res.status(400).send({ status: false, message: "Valid key is ProductImage. Please provide file with key productImage" })}

        var uploadImage = await uploadFile(file[0]);
        obj.profileImage = uploadImage

        if(!validImage(obj.profileImage)) return res.status(400).send({ status: false, message: "Please provide valid format of image" })
    }

    //==========================================Destructuring body data==========================================================

    let { fname, lname, email, phone, password, address, profileImage, ...rest } = req.body

    //====================================If body is empty======================================================================

    if (!isValidBody(req.body)) return res.status(400).send({ status: false, message: "Please Provide data to update the user" })

    if (isValidBody(rest)) return res.status(400).send({ status: false, message: "You can update your profile only using fname, lname, email, phone, password, address, profileImage " })

    
    //====================================Updating fname========================================================================

    if(fname || fname=="") {
        if(!isValid(fname)) { return res.status(400).send({ status: false, message: "Please enter new fname to update" })}
        if(!isValidName(fname)) { return res.status(400).send({ status: false, message: "please enter valid fname" })}
        obj.fname = fname
    }

    //====================================Updating lname=========================================================================

    if(lname || lname=="") {
        if(!isValid(lname)) { return res.status(400).send({ status: false, message: "Please enter new lname to update" })}
        if(!isValidName(lname)) { return res.status(400).send({ status: false, message: "Please enter valid lname" })}
        obj.lname = lname
    }
    

    //=========================================Updating email===============================================================

    if (email || email=="") {
        if(!isValid(email)) { return res.status(400).send({ status: false, message: "Please enter email to update" })}
        if (!isValidEmail(email)) { return res.status(400).send({ status: false, message: "Please enter valid email" })}

        //______________________________________Checking duplicate email____________________________________

        let checkEmail = await userModel.findOne({ email: email })
        if (checkEmail) { return res.status(409).send({ status: false, message: "Email is already used!" })}
        obj.email = email
    }

    //===================================Updating Password==========================================================================

    if (password || password=="") {
        if(!isValid(password)) return res.status(400).send({ status: false, message: "Please provide Password that contains 8-15 characters" })
        if (!isValidPassword(password)) return res.status(400).send({ status: false, message: "Password must contains 8-15 characters" })
        let bcryptPassword = await bcrypt.hash(password, 10)
        obj.password = bcryptPassword
    }

    //====================================updating Phone number=======================================================================
    if (phone || phone=="") {
        if(!isValid(phone)) return res.status(400).send({ status: false, message: "Please provide Indian Mobile Number" })
        if (!isvalidPhone(phone)) { return res.status(400).send({ status: false, message: "Please enter valid 10 digit Indian Mobile number" })}

        //____________________________________Checking duplicate phone_______________________________________________
        
        let duplicatePhone = await userModel.findOne({ phone: phone })
        if (duplicatePhone) { return res.status(409).send({ status: false, message: "Phone number is already used!" })}
        obj.phone = phone
    }

    //==========================================Updating Address==========================================


    if (address) {
        if (typeof address === "string") { address = JSON.parse(address) }
        if (!isValidBody(address)) return res.status(400).send({ status: false, message: "address is required" })

    //==================================================Updating Shipping Address========================================================

        if (address.shipping) {
            if (!isValidBody(address.shipping)) return res.status(400).send({ status: false, message: "shipping address is required" })
            if (address.shipping.street) {
                if (!isValid(address.shipping.street)) {
                    return res.status(400).send({ status: false, message: "street is required in billing address!" });
                }
                obj['address.shipping.street'] = address.shipping.street;
            }

            if (address.shipping.city) {
                if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "city is required in billing address!" });
                obj['address.shipping.city'] = address.shipping.city;
            }

            if (address.shipping.pincode) {
                let pinCode = parseInt(address.shipping.pincode)
                if (!isvalidPincode(pinCode)) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                obj['address.shipping.pincode'] = pinCode;
            }
        }
    
    //==============================================Updating Billing Address==============================================================
        if (address.billing) {
            if (!isValidBody(address.billing)) return res.status(400).send({ status: false, message: "billing address is required" })

            if (address.billing.street) {
                if (!isValid(address.billing.street)) {
                    return res.status(400).send({ status: false, message: "street is required in billing address!" });
                }
                obj['address.billing.street'] = address.billing.street;
            }

            if (address.billing.city) {
                if (!isValid(address.billing.city)) {
                    return res.status(400).send({ status: false, message: "city is required in billing address!" });
                }
                obj['address.billing.city'] = address.billing.city;
            }


            if (address.billing.pincode) {
                let pinCode = parseInt(address.billing.pincode)
                if (!isvalidPincode(pinCode)) return res.status(400).send({ status: false, message: "provide a valid pincode." })
                obj['address.billing.pincode'] = pinCode;
            }
        }
    }

    //====================================Updating Profile======================================================================================================================================
        const update = await userModel.findOneAndUpdate({ _id: user }, { $set: obj }, { new: true }).select({ __v: 0 })
        if (!update) {
            return res.status(404).send({ status: false, message: "userId not found" })
        }
        return res.status(200).send({ status: true, message: "User profile Updated Successfully :)", data: update })

  }
  
  catch(err){
    res.status(500).send({status : false, message : err.message})
  }
}


//***************************************************************Modules*****************************************************************


module.exports = { registerUser, userLogin, getProfile, updateuser };











