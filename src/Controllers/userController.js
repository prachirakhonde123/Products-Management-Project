const userModel = require('../Models/userModel')
const uploadFile= require('../Aws/aws')
const { isValidEmail, isValidName, isValidBody, isValidPassword, isvalidPhone, isvalidPincode, isValid, isvalidObjectId } = require('../Validations/validator')
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
        if (duplicateEmail) return res.status(400).send({ status: false, message: `User is already registered with ${email} Email` })

        //____________________________________Validation for mobile_______________________________________________________

        if (!phone) return res.status(400).send({ status: false, message: "Phone is Mandatory" })
        if ((!isvalidPhone(phone)) || (!isValid(phone))) return res.status(400).send({ status: false, message: "Invalid Format of mobile Number. Provide 10 digit Indian and Valid Phone Number" })

        let duplicateMobile = await userModel.findOne({ phone: phone })
        if (duplicateMobile) return res.status(400).send({ status: false, message: `User is already registered with ${phone} mobile number` })

        //___________________________________Validation for Password_______________________________________________________
        if (!password) return res.status(400).send({ status: false, message: "Password is Mandatory" })
        if (!isValidPassword(password)) return res.status(400).send({ status: false, message: "Password length should be between 8-15" })

        
        //_____________________________________If address field is not given__________________________________________________

        if (!address) {
            return res.status(400).send({ status: false, message: "Please Provide Address :)" })
        }

        //____________________________________Validation for Shipping Address_______________________________________________________

        if (!address.shipping) {
            return res.status(400).send({ status: false, message: "Please Provide Shipping Address"})
        }
        if (address.shipping) {
            if (!address.shipping.street) {
                return res.status(400).send({ status: false, message: "Shipping : Steet feild is Mandatory" })
            }
            if (address.shipping.street) {
                if (!isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "Shipping : Steet feild is Invalid" })
            }
            if (!address.shipping.city) {
                return res.status(400).send({ status: false, message: "Shipping : City feild is Mandatory" })
            }
            if (address.shipping.city) {
                if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "Shipping : City feild is Invalid" })
            }

            if (!address.shipping.pincode) {
                return res.status(400).send({ status: false, message: "Shipping : Pincode feild is Mandatory" })
            }
            if (address.shipping.pincode) {
                if (!isvalidPincode(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Shipping : Pincode feild is Invalid" })
            }
        }

        //______________________________________Validation for Billing Address__________________________________________
        if (!address.billing) {
            return res.status(400).send({ status: false, message: "Please Provide Billing Address" })
        }
        if(address.billing) {
            if (!address.billing.street) {
                return res.status(400).send({ status: false, message: "Billing : Steet feild is Mandatory" })
            }
            if (address.billing.street) {
                if (!isValid(address.billing.street)) return res.status(400).send({ status: false, message: "Billing : Steet feild is Invalid" })
            }
            if (!address.billing.city) {
                return res.status(400).send({ status: false, message: "Billing : City feild is Mandatory" })
            }
            if (address.billing.city) {
                if (!isValid(address.billing.city)) return res.status(400).send({ status: false, message: "Billing : City feild is Invalid" })
            }
            if (!address.billing.pincode) {
                return res.status(400).send({ status: false, message: "Billing : Pincode feild is Mandatory" })
            }
            if (address.billing.pincode) {
                if (!isvalidPincode(address.billing.pincode)) return res.status(400).send({ status: false, message: "Billing : Pincode feild is Invalid" })
            }
        }

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
            const createUser = await userModel.create(data)
            res.status(201).send({ status: true, message: "User registered succesfully", data: createUser });
        }
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
    }

    let { fname, lname, email, phone, password, address } = req.body
    
    //====================================If body is empty======================================================================

    if(!isValidBody(req.body) && (file.length == 0)){
        return res.status(400).send({ status: false, message: "Please provide a data to update User" })
    }


    //===============================================Validation Starts================================================================

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
            //__________________Checking duplicate email_____________________________________
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
            //___________________________Checking duplicate phone________________________________________________
            let duplicatePhone = await userModel.findOne({ phone: phone })
            if (duplicatePhone) {
                return res.status(409).send({ status: false, message: "Phone number is already used!" })
            }
            obj.phone = phone
        }

        //==========================================Updating Address==========================================
        if (address) {
            if (address.shipping) {
                if (address.shipping.street) {
                    if (!address.shipping.street) {
                        return res.status(400).send({ status: false, message: "Shipping : Steet feild is Mandatory" })
                    }
                    if (address.shipping.street) {
                        if (!isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "Shipping : Steet feild is Invalid" })
                    }
                    obj["address.shipping.street"]= address.shipping.street
                }
                if (address.shipping.city) {
                    if (!address.shipping.city) {
                        return res.status(400).send({ status: false, message: "Shipping : City feild is Mandatory" })
                    }
                    if (address.shipping.city) {
                        if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "Shipping : City feild is Invalid" })
                    }
                    obj["address.shipping.city"]= address.shipping.city
                }
                if (address.shipping.pincode) {
                    if (!address.shipping.pincode) {
                        return res.status(400).send({ status: false, message: "Shipping : Pincode feild is Mandatory" })
                    }
                    if (address.shipping.pincode) {
                        if (!isvalidPincode(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Shipping : Pincode feild is Invalid" })
                    }
                    obj["address.shipping.pincode"]= address.shipping.pincode
                }
            }
            if (address.billing) {
                if (address.billing.street) {
                    if (!address.billing.street) {
                        return res.status(400).send({ status: false, message: "billing : Street feild is Mandatory" })
                    }
                    if (address.billing.street) {
                        if (!isValid(address.billing.street)) return res.status(400).send({ status: false, message: "billing : Street feild is Invalid" })
                    }
                    obj["address.billing.street"]= address.billing.street
                }
                if (address.billing.city) {
                    if(!address.billing.city) {
                        return res.status(400).send({ status: false, message: "Billing : City feild is Mandatory" })
                    }
                    if (address.billing.city) {
                        if (!isValid(address.billing.city)) return res.status(400).send({ status: false, message: "billing : City feild is Invalid" })
                    }
                    obj["address.billing.city"]= address.billing.city
                }
                if (address.billing.pincode) {
                    if (!address.billing.pincode) {
                        return res.status(400).send({ status: false, message: "billing : Pincode feild is Mandatory" })
                    }
                    if (address.billing.pincode) {
                        if (!isvalidPincode(address.billing.pincode)) return res.status(400).send({ status: false, message: "billing : Pincode feild is Invalid" })
                    }
                    obj["address.billing.pincode"]= address.billing.pincode
                }
            }
        }
    }

    //====================================Updating Profile=====================================================================================================================================================================
    const update = await userModel.findOneAndUpdate({_id : user},{$set : obj},{new : true}).select({__v : 0})
    if (!update) {
        return res.status(404).send({ status: false, message: "userId not found" })
    }

    return res.status(200).send({ status: true, message: "User profile Updated Successfully :)", data: update })
}

module.exports = { registerUser, userLogin, getProfile, updateuser };












