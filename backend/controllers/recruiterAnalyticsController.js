const Job = require("../models/jobModel");
const UserHistory = require("../models/jobHistory");

exports.recruiterAnalytics = async (req, res, next) => {
  try {
    const recruiterJobs = await Job.find({
      user: req.user._id,
      isDeleted: false,
    })
      .select("_id title createdAt available")
      .lean();
    const jobIds = recruiterJobs.map((job) => job._id);
    const applications = await UserHistory.find({ jobId: { $in: jobIds } })
      .select("jobId applicationStatus createdAt")
      .lean();

    const statusKey = (status) => status || "pending";
    const statuses = [
      "pending",
      "under_review",
      "shortlisted",
      "interview",
      "selected",
      "rejected",
    ];
    const statusDistribution = statuses.map((status) => ({
      status,
      count: applications.filter((application) => {
        const current = statusKey(application.applicationStatus);
        return status === "selected"
          ? current === "selected" || current === "accepted"
          : current === status;
      }).length,
    }));
    const jobAnalytics = recruiterJobs.map((job) => {
      const jobApplications = applications.filter(
        (application) => String(application.jobId) === String(job._id),
      );
      const count = (status) =>
        jobApplications.filter((application) => {
          const current = statusKey(application.applicationStatus);
          return status === "selected"
            ? current === "selected" || current === "accepted"
            : current === status;
        }).length;
      return {
        jobId: job._id,
        title: job.title,
        totalApplications: jobApplications.length,
        pending: count("pending"),
        underReview: count("under_review"),
        shortlisted: count("shortlisted"),
        interview: count("interview"),
        selected: count("selected"),
        rejected: count("rejected"),
      };
    });

    const applicationsOverTime = Object.values(
      applications.reduce((result, application) => {
        const date = new Date(application.createdAt).toISOString().slice(0, 10);
        result[date] = result[date] || { date, applications: 0 };
        result[date].applications += 1;
        return result;
      }, {}),
    ).sort((first, second) => first.date.localeCompare(second.date));

    res.status(200).json({
      success: true,
      summary: {
        totalJobs: recruiterJobs.length,
        activeJobs: recruiterJobs.filter((job) => job.available).length,
        totalApplications: applications.length,
        pendingApplications: statusDistribution.find(
          (item) => item.status === "pending",
        ).count,
        shortlistedCandidates: statusDistribution.find(
          (item) => item.status === "shortlisted",
        ).count,
        interviews: statusDistribution.find(
          (item) => item.status === "interview",
        ).count,
        selectedCandidates: statusDistribution.find(
          (item) => item.status === "selected",
        ).count,
        rejectedCandidates: statusDistribution.find(
          (item) => item.status === "rejected",
        ).count,
      },
      statusDistribution,
      applicationsPerJob: jobAnalytics.map((job) => ({
        title: job.title,
        applications: job.totalApplications,
      })),
      applicationsOverTime,
      hiringFunnel: [
        { stage: "Applied", count: applications.length },
        {
          stage: "Under Review",
          count: statusDistribution.find(
            (item) => item.status === "under_review",
          ).count,
        },
        {
          stage: "Shortlisted",
          count: statusDistribution.find(
            (item) => item.status === "shortlisted",
          ).count,
        },
        {
          stage: "Interview",
          count: statusDistribution.find((item) => item.status === "interview")
            .count,
        },
        {
          stage: "Selected",
          count: statusDistribution.find((item) => item.status === "selected")
            .count,
        },
        {
          stage: "Rejected",
          count: statusDistribution.find((item) => item.status === "rejected")
            .count,
        },
      ],
      jobs: jobAnalytics,
    });
  } catch (error) {
    next(error);
  }
};
