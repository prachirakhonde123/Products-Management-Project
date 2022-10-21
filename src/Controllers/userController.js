const userModel = require('../Models/userModel')
const { uploadFile } = require('../Aws/aws')
const { isValidEmail, isValidName, isValidBody, isValidPassword, isvalidPhone,  isValid, isvalidObjectId,validImage } = require('../Validations/validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

//=========================================== Create or Register User ==============================================

const registerUser = async function (req, res) {
    try {
        const data = req.body
        let file = req.files
        const { fname, lname, email, phone, password, address } = data

        if (!isValidBody(data)) return res.status(400).send({ status: true, message: "Body can't be Empty!" })

        //____________________________Validation for First Name______________________________________________
        if (!fname) return res.status(400).send({ status: false, message: "First Name is Mandatory" })
        if (fname) {
            if (!isValid(fname)) return res.status(400).send({ status: false, message: "First Name is in Invalid Format" })

            if (!isValidName(fname)) return res.status(400).send({ status: false, message: "First Name contains only letters" })
        }

        //_____________________________Validation of Last Name___________________________________________________
        if (!lname) return res.status(400).send({ status: false, message: "Last Name is Mandatory" })
        if (lname) {
            if (!isValid(lname)) return res.status(400).send({ status: false, message: "Last Name is in Invalid Format" })

            if (!isValidName(lname)) return res.status(400).send({ status: false, message: "Last Name contains only letters" })
        }

        //________________________________________Validation for Email____________________________________________________
        if (!email) return res.status(400).send({ status: false, message: "Email is Mandatory" })

        if (!isValidEmail(email.trim())) return res.status(400).send({ status: false, message: "Email is in Invalid Format" })

        let duplicateEmail = await userModel.findOne({ email: email })
        if (duplicateEmail) return res.status(409).send({ status: false, message: `User is already registered with ${email} Email` })

        //____________________________________Validation for mobile_______________________________________________________

        if (!phone) return res.status(400).send({ status: false, message: "Phone is Mandatory" })
        if ((!isvalidPhone(phone)) || (!isValid(phone))) return res.status(400).send({ status: false, message: "Invalid Format of mobile Number. Provide 10 digit Indian and Valid Phone Number" })

        let duplicateMobile = await userModel.findOne({ phone: phone })
        if (duplicateMobile) return res.status(409).send({ status: false, message: `User is already registered with ${phone} mobile number` })

        //___________________________________Validation for Password_______________________________________________________
        if (!password) return res.status(400).send({ status: false, message: "Password is Mandatory" })
        if (!isValidPassword(password)) return res.status(400).send({ status: false, message: "Password length should be between 8-15" })

        
        //_____________________________________If address field is not given__________________________________________________

       
        if (!address || Object.keys(address).length === 0) {
            return res
              .status(400)
              .send({ status: false, message: "Address is required" });
          }

        const addresses = JSON.parse(address);

        if (
            !addresses.shipping ||
            (addresses.shipping &&
              (!addresses.shipping.street ||
                !addresses.shipping.city ||
                !addresses.shipping.pincode))
          ) {
            return res
              .status(400)
              .send({ status: false, message: "Shipping Address is required" });
          }

          if (
            !addresses.billing ||
            (addresses.billing &&
              (!addresses.billing.street ||
                !addresses.billing.city ||
                !addresses.billing.pincode))
          ) {
            return res
              .status(400)
              .send({ status: false, message: "Billing Address is required" });
          }
      
          data.address = addresses;
      

        //___________________Encrypting Password____________________________________
        let securedPass = await bcrypt.hash(password, 10)
        data.password = securedPass //updating key 

    

        //___________________________If ProfileImage is not Given______________________________________
        if (file.length == 0) return res.status(400).send({ status: false, message: "ProfileImage field is Mandatory" });

        //______________________If wrong key is given incase of ProfileImage__________________________
        if (file[0].fieldname !== "profileImage") {
            return res.status(400).send({ status: false, message: "Valid key is ProfileImage. Please provide file with key profileImage" });
        }

        if (file && file.length > 0) {
            let uploadImage = await uploadFile(file[0]);
            data.profileImage = uploadImage
            if(!validImage(data.profileImage)) return res.status(400).send({ status : false, message : "Invalid format of image"})
        }

        const createUser = await userModel.create(data)
        res.status(201).send({ status: true, message: "User registered succesfully", data: createUser });
    }

    catch (err) {
        res.status(500).send({ message: "Server Error", err: err.message })
    }
}



//===================================================== Login User ======================================================

const userLogin = async function (req, res) {
    try {
        let data = req.body
        const { email, password } = data

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, msg: "request body canot be empty" })
        }

        if (!email) {
            return res.status(400).send({ status: false, message: "Please provide Email to login" })
        }
        if (!isValidEmail(email.trim())) {
            return res.status(400).send({ status: false, msg: "invalid email format" });
        }
        if (!password) {
            return res.status(400).send({ status: false, message: "Please provide Password to login" })
        }
        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, msg: "Invalid password format!" });
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

    } catch (error) {
        res.status(500).send({ status: false, err: error.message })
    }
}


//============================================ Get Profile Details ================================================

const getProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        //const userIdFromToken = req.userId;

        //validation starts
        if (!isvalidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." });
        }

        //validation ends  
        const findUserProfile = await userModel.findOne({ _id: userId });
        if (!findUserProfile) {
            return res.status(400).send({ status: false, message: `User doesn't exists by ${userId}` });
        }

        return res.status(200).send({ status: true, message: "Profile found successfully.", data: findUserProfile, });
    }

    catch (err) {
        return res.status(500).send({ status: false, message: "Server Error", err: err.message });
    }
};


//========================================= Update Profile Details =================================================

const updateuser = async function (req, res) {
    let user = req.params.userId
    let obj = {}

    //=========================================Invalid Format of UserId is given==============================================
    if (!isvalidObjectId(user)) {
        return res.status(400).send({ status: false, message: "Please provide a valid userId" })
    }

    //=========================================Updating Profile Image==============================================================

    let file = req.files
    if(file && file.length > 0) {
        var uploadImage = await uploadFile(file[0]);
        obj.profileImage = uploadImage
        if(!validImage(obj.profileImage)) return res.status(400).send({ status: false, message: "Please provide valid format of image" })
    }

    let { fname, lname, email, phone, password, address } = req.body
    
    //====================================If body is empty======================================================================
    
    if (fname || lname || email || phone || password || address) {
        if (fname) {
            if (!isValidName(fname)) {
                return res.status(400).send({ status: false, message: "please enter valid fname" })
            }
            obj.fname = fname
        }

        //====================================Updating lname======================================================
        if (lname) {
            if (!isValidName(lname)) {
                return res.status(400).send({ status: false, message: "please enter valid lname" })
            }
            obj.lname = lname
        }

        //===============================Updating email===============================================================
        if (email) {
            if (!isValidEmail(email)) {
                return res.status(400).send({ status: false, message: "Please enter valid email" })
            }
            //_________________Checking duplicate email____________________________________
            let checkEmail = await userModel.findOne({ email: email })
            if (checkEmail) {
                return res.status(409).send({ status: false, message: "Email is already used!" })
            }
            obj.email = email
        }

          //===================================Updating Password=========================================================
          if (password) {
            if (!isValidPassword(password)) return res.status(400).send({ status: false, message: "Password must contains 8-15 characters" })
            let bcryptPassword = await bcrypt.hash(password, 10)
            obj.password = bcryptPassword
        }

        //====================================updating Phone number====================================================
        if (phone) {
            if (!isvalidPhone(phone)) {
                return res.status(400).send({ status: false, message: "please enter valid Mobile numbr" })
            }
            //__________________________Checking duplicate phone_______________________________________________
            let duplicatePhone = await userModel.findOne({ phone: phone })
            if (duplicatePhone) {
                return res.status(409).send({ status: false, message: "Phone number is already used!" })
            }
            obj.phone = phone
        }

        //==========================================Updating Address==========================================

        const addresses = JSON.parse(address);

        if (
            !addresses.shipping ||
            (addresses.shipping &&
              (!addresses.shipping.street ||
                !addresses.shipping.city ||
                !addresses.shipping.pincode))
          ) {
            return res
              .status(400)
              .send({ status: false, message: "Shipping Address is required" });
          }

          if (
            !addresses.billing ||
            (addresses.billing &&
              (!addresses.billing.street ||
                !addresses.billing.city ||
                !addresses.billing.pincode))
          ) {
            return res
              .status(400)
              .send({ status: false, message: "Billing Address is required" });
          }

          obj.address = addresses;

  //====================================Updating Profile=====================================================================================================================================================================
    const update = await userModel.findOneAndUpdate({_id : user},{$set : obj},{new : true}).select({__v : 0})
    if (!update) {
        return res.status(404).send({ status: false, message: "userId not found" })
    }

    return res.status(200).send({ status: true, message: "User profile Updated Successfully :)", data:update})
}
}






module.exports = { registerUser, userLogin, getProfile, updateuser };











