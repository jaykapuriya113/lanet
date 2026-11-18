import {
  Alert,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { loadUserApplicationsAction } from "../../redux/actions/userAction";
import CardElement1 from "../../component/CardElement1";

const formatTimelineDate = (value) => {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const UserJobsHistory = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isFeedbackView = new URLSearchParams(location.search).get("view") === "feedback";
  const {
    applications = [],
    loading,
    error,
  } = useSelector((state) => state.userApplications || {});

  useEffect(() => {
    dispatch(loadUserApplicationsAction());
  }, [dispatch]);

  useEffect(() => {
    const applicationId = location.state?.applicationId;
    if (!applicationId || loading) return;

    document
      .getElementById(`application-${applicationId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [applications, loading, location.state]);

  return (
    <Box>
      <Typography variant="h4" sx={{ color: "black", mb: 3 }}>
        {isFeedbackView ? "Feedback" : "Track Applications"}
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress aria-label="Loading applications" />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : applications.length === 0 ? (
        <Typography sx={{ mt: 2, color: "text.secondary" }}>
          No applications yet.
        </Typography>
      ) : (
        <Box>
          {applications.map((application) => {
            const timelineEntries = Array.isArray(application?.statusHistory)
              ? application.statusHistory.slice().sort(
                  (first, second) =>
                    new Date(first?.timestamp || 0) -
                    new Date(second?.timestamp || 0),
                )
              : [];

            return (
              <Box key={application?._id} sx={{ mb: 4 }}>
                <CardElement1
                  id={application?._id}
                  applicationStatus={application?.applicationStatus}
                  jobTitle={
                    application?.jobTitle ||
                    application?.title ||
                    "Job application"
                  }
                  companyName={application?.companyName || "Company"}
                  description={application?.description}
                  salary={application?.salary}
                  location={application?.location}
                  appliedDate={
                    application?.appliedDate || application?.createdAt
                  }
                  resume={application?.resume}
                  jobId={application?.jobId?._id || application?.jobId}
                  interview={application?.interview}
                  feedback={application?.feedback}
                  expandFeedback={isFeedbackView}
                />

                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                    Application Timeline
                  </Typography>

                  {timelineEntries.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No status changes recorded yet.
                    </Typography>
                  ) : (
                    <Timeline sx={{ m: 0, p: 0 }}>
                      {timelineEntries.map((entry, index) => (
                        <TimelineItem key={`${entry?.status}-${entry?.timestamp}-${index}`} sx={{ minHeight: 40 }}>
                          <TimelineSeparator>
                            <TimelineDot color={index === 0 ? "primary" : "grey"} />
                            {index < timelineEntries.length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent sx={{ py: 0, px: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {entry?.status || "Status"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimelineDate(entry?.timestamp)}
                            </Typography>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default UserJobsHistory;
