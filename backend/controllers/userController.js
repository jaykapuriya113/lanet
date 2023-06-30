const User = require("../models/userModel");
const ErrorResponse = require("../utils/errorResponse");
const UserHistory = require("./../models/jobHistory");

//load all user

exports.allUser = async (req, res, next) => {
  //pagination
  const page = Number(req.query.pageNumber) || 1;
  const pageSize = Number(req.query.pageSize) || 3;
  const count = await User.find({}).estimatedDocumentCount();

  try {
    const users = await User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .select("-password")
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    res.status(200).json({
      success: true,
      users,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
    next();
  } catch (error) {
    return next(error);
  }
};


exports.ShowAllUser = async (req, res, next) => {
  try {
    const users = await User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .select("-password")
    res.status(200).json({
      success: true,
      users,
    });
    next();
  } catch (error) {
    return next(error);
  }
};
//show single user
exports.singleUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json({
      success: true,
      user,
    });
    next();
  } catch (error) {
    return next(error);
  }
};

//edit user
exports.editUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({
      success: true,
      user,
    });
    next();
  } catch (error) {
    return next(error);
  }
};

//delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
    });
    res.status(200).json({
      success: true,
      message: "user deleted",
    });
    next();
  } catch (error) {
    return next(error);
  }
};

// jobs history
exports.createUserJobsHistory = async (req, res, next) => {
  const { title, description, salary, location, id, coverLetter, assessment } =
    req.body;
  try {
    const existingApplication = await UserHistory.findOne({
      user: req.user._id,
      jobId: id,
    });
    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job.",
      });
    }
    const currentUser = await User.findOne({ _id: req.user._id });
    console.log(coverLetter);
    if (!currentUser) {
      return next(new ErrorResponse("You must log in", 401));
    } else {
      console.log(coverLetter);
      const addJobHostory = {
        title,
        description,
        salary,
        location,
        user: req.user._id,
        jobId: id,
        coverLetter,
        assessment,
      };
      console.log(coverLetter);

      // currentUser.jobsHistory.push(addJobHostory);
      const currentUser = await UserHistory.create(addJobHostory);
      // await currentUser.save();

      res.status(200).json({
        success: true,
        currentUser,
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
