const ErrorResponse = require("../utils/errorResponse");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

//check user is authenticated

exports.isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  console.log(token);
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decode.id);
    next();
  } catch (error) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
};
//admin middleware
exports.isAdmin = (req, res, next) => {
  const role = Number(req.user.role);
  if (role === 0) {
    return next(new ErrorResponse("Access denied, you must an admin", 401));
  }
  next();
};

//mainadmin middleware
exports.isMainAdmin = (req, res, next) => {
  const role = Number(req.user.role);
  if (role === 0 || role === 1) {
    return next(new ErrorResponse("Access denied, you must an admin", 401));
  }
  next();
};
