const ErrorResponse = require("../utils/errorResponse");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Verify a JWT string. Returns the decoded payload or null (never throws).
const tryVerify = (token) => {
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
};

//check user is authenticated
exports.isAuthenticated = async (req, res, next) => {
  // Try cookie first, then Authorization: Bearer header as fallback.
  // Each source is verified independently so an expired cookie does not
  // block a valid Bearer token (e.g. from localStorage via chat pages).
  const cookieToken = req.cookies?.token;
  const authHeader  = req.headers?.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

  const decoded = tryVerify(cookieToken) || tryVerify(bearerToken);

  if (!decoded) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return next(new ErrorResponse("Not authorized to access this route", 401));
    }
    if (req.user.isActive === false) {
      return next(new ErrorResponse("Your account has been deactivated.", 403));
    }
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
