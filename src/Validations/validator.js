const moment = require("moment");
const mongoose = require("mongoose");

//============================================Validation for Body================================================

const isValidBody = function (data) {
  return Object.keys(data).length > 0;
};

//============================================Validation for Valid Value=============================================
const isValid = function (value) {
  if (typeof value !== "string") return false;
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  if (typeof value === "string") return true;
};

//============================================Validation for Email=============================================

const isValidEmail = function (mail) {
  if (/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(mail)) {
    return true;
  }
  return false;
};

//============================================Validation for Password=============================================

const isValidPassword = function (pass) {
  //if (/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(pass)) return true;
  if (/^[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(pass)) return true;
  return false;
};

//============================================Validation for Name=============================================

const isValidName = function (name) {
  if (/^[A-Za-z\s]{1,35}$/.test(name)) return true;
  return false;
};

//============================================Validation for Valid ObjectId=============================================

const isvalidObjectId = function (objectId) {
  return mongoose.Types.ObjectId.isValid(objectId);
};

//============================================Validation for Phone Number=============================================

const isvalidPhone = function (mobile) {
  if (/^(\+91[\-\s]?)?[0]?[6789]\d{9}$/.test(mobile)) return true;
  return false;
};

//================================================Validation for Pincode=============================================

const isvalidPincode = function (pincode) {
  if (/^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/.test(pincode)) return true;
  return false;
};

//============================================Validation for Installment============================================

const validInstallment = function isInteger(value) {
  if (value < 0) return false;
  if (value % 1 == 0) return true;
};

//============================================Validation for Value to Check Spaces=============================================
const validString = function (value) {
  if (typeof value === "string" && value.trim().length === 0) return false; //it checks whether the string contain only space or not
  return true;
};

//=============================================Validation for Price=================================================

const isValidPrice = function (price) {
  return /^[1-9]\d{0,7}(?:\.\d{1,2})?$/.test(price);
};

const validQuantity = function isInteger(value) {
  if (value < 1) return false;
  if (isNaN(Number(value))) return false;
  if (value % 1 == 0) return true;
};

module.exports = {
  validInstallment,
  isValidEmail,
  isValidName,
  isValidBody,
  validString,
  isValidPassword,
  isvalidPhone,
  isvalidPincode,
  isValid,
  isvalidObjectId,
  isValidPrice,
  validQuantity,
};
