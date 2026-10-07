const Job = require("../models/jobModel");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  //jobs by location
  const jobByLocation = await Job.find(
    { isDeleted: false },
    { location: 1 },
  );
  const uniqueLocations = new Map();
  jobByLocation.forEach(({ location }) => {
    const normalizedLocation = location?.trim();
    if (normalizedLocation) {
      const locationKey = normalizedLocation.toLowerCase();
      if (!uniqueLocations.has(locationKey)) {
        uniqueLocations.set(locationKey, normalizedLocation);
      }
    }
  });
  const setUniqueLocation = [...uniqueLocations.values()];
  const selectedLocation =
    typeof req.query.location === "string" ? req.query.location.trim() : "";
  const hasSelectedLocation =
    selectedLocation && selectedLocation.toLowerCase() !== "undefined";
  const locationFilter = hasSelectedLocation
    ? {
        location: {
          $regex: `^\\s*${escapeRegex(selectedLocation)}\\s*$`,
          $options: "i",
        },
      }
    : {};
  const jobQuery = { ...keyword, ...locationFilter };

  //pagination
  const pageSize = 5;
  const page = Number(req.query.pageNumber) || 1;
  const count = await Job.find(jobQuery).countDocuments();
  try {
    const jobs = await Job.find(jobQuery)
      .sort({ createdAt: -1 })
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
exports.showAllJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};
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
