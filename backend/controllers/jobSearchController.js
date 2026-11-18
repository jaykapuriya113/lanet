const Job = require("../models/jobModel");

/**
 * Escapes every regex special character in a user-supplied string so it can
 * be safely embedded inside a MongoDB $regex without altering its meaning.
 */
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// show jobs with optional keyword + location filters
exports.showJobs = async (req, res, next) => {
  // ── keyword filter ──────────────────────────────────────────────────────
  // Trim and reject the literal string "undefined" that can appear when the
  // client passes an empty param via query string.
  const rawKeyword =
    typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
  const hasKeyword =
    rawKeyword.length > 0 && rawKeyword.toLowerCase() !== "undefined";

  // Always escape special regex characters so user input like "C++" or
  // "(react)" doesn't produce a malformed MongoDB regex.
  const keywordFilter = hasKeyword
    ? {
        $or: [
          { title:               { $regex: escapeRegex(rawKeyword), $options: "i" } },
          { companyName:         { $regex: escapeRegex(rawKeyword), $options: "i" } },
          { AdditionalInformation: { $regex: escapeRegex(rawKeyword), $options: "i" } },
        ],
      }
    : {};

  const now = new Date();
  const baseJobQuery = {
    isDeleted: false,
    available: true,
    applicationDeadline: { $gte: now },
    ...keywordFilter,
  };

  // ── unique locations from the active results for the current keyword ─────
  const jobByLocation = await Job.find(baseJobQuery, { location: 1 }).lean();
  const uniqueLocations = new Map();
  jobByLocation.forEach(({ location }) => {
    const normalizedLocation = location?.trim().replace(/\s+/g, " ");
    if (normalizedLocation) {
      const locationKey = normalizedLocation.toLocaleLowerCase();
      if (!uniqueLocations.has(locationKey)) {
        uniqueLocations.set(locationKey, normalizedLocation);
      }
    }
  });
  const setUniqueLocation = [...uniqueLocations.values()];

  // ── location filter ──────────────────────────────────────────────────────
  // Use a partial (contains) match with case-insensitive flag so that:
  //   "Sur"  matches "Surat"
  //   "surat" matches "Surat"
  //   "SURAT" matches "Surat"
  // Special regex characters in the user's input are escaped first.
  const selectedLocation =
    typeof req.query.location === "string" ? req.query.location.trim() : "";
  const hasSelectedLocation =
    selectedLocation.length > 0 &&
    selectedLocation.toLowerCase() !== "undefined";

  const exactLocationPattern = selectedLocation
    .split(/\s+/)
    .map(escapeRegex)
    .join("\\s+");
  const locationFilter = hasSelectedLocation
    ? {
        location: {
          $regex: `^\\s*${exactLocationPattern}\\s*$`,
          $options: "i",
        },
      }
    : {};

  // ── combine filters; always exclude deleted jobs and only show currently open jobs
  const jobQuery = {
    ...baseJobQuery,
    ...locationFilter,
  };

  // keyword-based searches (including click-through company searches) should return
  // all matching openings for that company, not just the first page slice.
  const pageSize = hasKeyword ? 1000 : 5;
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
