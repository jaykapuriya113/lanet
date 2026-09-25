const ErrorResponse = require("../utils/errorResponse");

exports.uploadFile = async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse("No file uploaded", 400));
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, url: fileUrl });
};
