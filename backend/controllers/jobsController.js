const Job = require("../models/jobModel");
const JobType = require("../models/jobTypeModel");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/userModel");
const UserHistory = require("../models/jobHistory");
const sendEmail = require("../utils/email");

//create jobtype
exports.createJob = async (req, res, next) => {
  try {
    const job = await Job.create({
      title: req.body.title,
      description: req.body.description,
      salary: req.body.salary,
      companyName: req.body.companyName,
      location: req.body.location,
      AdditionalInformation: req.body.AdditionalInformation,
      jobType: req.body.jobType,
      user: req.user.id,
    });
    res.status(201).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

//single job
exports.singleJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

//update job by id.
exports.updateJob = async (req, res, next) => {
  try {
    console.log("object");
    const job = await Job.findByIdAndUpdate(req.params.job_id, req.body, {
      new: true,
    })
      .populate("jobType", "jobTypeName")
      .populate("user", "firstName lastName");
    console.log(job);
    res.status(200).json({
      success: true,
      job,
    });
    console.log(job);
  } catch (error) {
    console.log(err);
    next(error);
  }
};

//show job by id.
exports.showJobs = async (req, res, next) => {
  const keyword = req.query.keyword
    ? {
        title: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
    : {};

  //filter by category ids
  let ids = [];
  const jobTypeCategory = await JobType.find({}, { _id: 1 });
  jobTypeCategory.forEach((cat) => {
    ids.push(cat._id);
  });
  let cat = req.query.cat;
  let categ = cat !== "" ? cat : ids;

  //jobs by location
  let locations = [];
  const jobByLocation = await Job.find({}, { location: 1 });
  jobByLocation.forEach((val) => {
    locations.push(val.location);
  });
  let setUniqueLocation = [...new Set(locations)];
  let location = req.query.location;
  let locationFilter = location !== "" ? location : setUniqueLocation;

  //pagination
  const pageSize = 5;
  const page = Number(req.query.pageNumber) || 1;
  const count = await Job.find({
    ...keyword,
    jobType: categ,
    location: locationFilter,
  }).countDocuments();
  try {
    const jobs = await Job.find({
      ...keyword,
      jobType: categ,
      location: locationFilter,
    })
      .sort({ createdAt: -1 })
      .populate("jobType", "jobTypeName")
      .populate("user", "firstName profilePhoto")
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    res.status(200).json({
      success: true,
      jobs,
      page,
      pages: Math.ceil(count / pageSize),
      count,
      setUniqueLocation,
    });
  } catch (error) {
    next(error);
  }
};
exports.showAllJobs= async (req, res, next) => {
  try {
      const jobs = await Job.find({})
        .sort({ createdAt: -1 })
      res.status(200).json({
        success: true,
        jobs,
      });
     } catch (error) {
    next(error);
    
  }
}
//show job by id.
exports.showJobsyByUser = async (req, res, next) => {
  try {
    const id = req.params.id;

    const jobs = await Job.find({
      user: id,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

//delete job
exports.deleteJobs = async (req, res, next) => {
  try {
    const jobT = await Job.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
    });
    res.status(200).json({
      success: true,
      message: "Job deleted",
    });
  } catch (error) {
    next(new ErrorResponse("server error", 500));
  }
};

//apply user user find by id
exports.showAdminUserApplyJob = async (req, res, next) => {
  try {
    const id = req.params.id;

    const jobs = await Job.find({
      user: id,
    });

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

exports.adminShowUserApplyJob = async (req, res) => {
  try {
    const availableJobs = await Job.find({ isDeleted: false })
      .populate({
        path: "userAppliedForJob",
        select:
          "_id  title description salary location interviewDate applicationStatus companyName coverLetter assessment",
        populate: {
          path: "user",
          select: "firstName lastName email resume",
        },
      })
      .lean();

    return res.status(200).json({
      availableJobs,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { applicationStatus } = req.body;
    console.log(applicationStatus);
    const currentApplication = await UserHistory.findOne({
      _id: req.body.user,
    });
    console.log(currentApplication);
    if (applicationStatus === "accepted") {
      currentApplication.applicationStatus = "accepted";
      await currentApplication.save();

      const user = await User.findById(currentApplication.user);
      console.log(user.email);
      await sendEmail({
        email: user.email,
        subject: `Your application with <b>JobApplied ID: </b>${currentApplication._id} ${currentApplication.title} is Accepted.`,
      });

      return res.status(200).json("sucess");
    } else if (applicationStatus === "rejected") {
      currentApplication.applicationStatus = "rejected";
      await currentApplication.save();

      return res.status(200).json("reject");
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
