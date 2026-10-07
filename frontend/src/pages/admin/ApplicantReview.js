import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
  Grid,
  Link,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";

const STATUS_OPTIONS = [
  { label: "Applied", value: "pending" },
  { label: "Under Review", value: "under_review" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Selected", value: "selected" },
  { label: "Rejected", value: "rejected" },
];

const formatStatus = (status) => {
  if (!status) return "Applied";

  const statusMap = {
    pending: "Applied",
    under_review: "Under Review",
    shortlisted: "Shortlisted",
    interview: "Interview",
    selected: "Selected",
    accepted: "Selected",
    rejected: "Rejected",
  };

  return statusMap[status] || status.replace(/_/g, " ");
};

const safeValue = (value, fallback = "N/A") => {
  if (value === undefined || value === null || value === "") return fallback;
  return value;
};

const getResumeFileName = (resumeUrl) => {
  if (!resumeUrl) return "resume.pdf";

  try {
    const cleanUrl = resumeUrl.split("?")[0];
    const fileName = cleanUrl.split("/").pop() || "resume.pdf";
    return decodeURIComponent(fileName);
  } catch (error) {
    return "resume.pdf";
  }
};

const getLocalDateValue = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatInterviewDate = (value) =>
  value
    ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not scheduled";

const formatInterviewTime = (value) => {
  if (!value) return "Not scheduled";
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const ApplicantReview = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [savingInterview, setSavingInterview] = useState(false);
  const [completingInterview, setCompletingInterview] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    date: "",
    time: "",
    mode: "online",
    meetingLink: "",
  });
  const [error, setError] = useState("");

  const loadApplication = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.get(
        `/api/recruiter/applications/${applicationId}`,
      );
      const loadedApplication = data?.application || null;
      setApplication(loadedApplication);
      setSelectedStatus(loadedApplication?.applicationStatus || "pending");
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Unable to load applicant profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const handleStatusUpdate = async () => {
    if (!application) return;

    setSavingStatus(true);
    try {
      const { data } = await axios.patch(
        `/api/recruiter/applications/${applicationId}/status`,
        {
          applicationStatus: selectedStatus,
        },
      );

      setApplication((current) => ({
        ...current,
        applicationStatus: data?.applicationStatus || selectedStatus,
      }));
      toast.success("Application status updated successfully.");
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Unable to update status.",
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const previewResume = () => {
    if (!application?.user?.resume) {
      toast.error("No resume is available for this applicant.");
      return;
    }

    window.open(
      `/api/recruiter/applications/${applicationId}/resume`,
      "_blank",
    );
  };

  const downloadResume = () => {
    if (!application?.user?.resume) {
      toast.error("No resume is available for this applicant.");
      return;
    }

    const link = document.createElement("a");
    link.href = `/api/recruiter/applications/${applicationId}/resume`;
    link.download = getResumeFileName(application.user.resume);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInterviewDialog = () => {
    const scheduledInterview = application?.interview || {};
    setInterviewForm({
      date: scheduledInterview.date || "",
      time: scheduledInterview.time || "",
      mode: scheduledInterview.mode || "online",
      meetingLink: scheduledInterview.meetingLink || "",
    });
    setInterviewDialogOpen(true);
  };

  const saveInterview = async (event) => {
    event.preventDefault();
    setSavingInterview(true);
    try {
      const isReschedule = Boolean(application?.interview);
      const { data } = await axios.request({
        method: isReschedule ? "patch" : "post",
        url: `/api/recruiter/applications/${applicationId}/interview`,
        data: interviewForm,
      });
      setApplication((current) => ({
        ...current,
        interview: data.interview,
        applicationStatus: data.application.applicationStatus,
      }));
      setSelectedStatus(data.application.applicationStatus);
      setInterviewDialogOpen(false);
      toast.success(
        isReschedule ? "Interview updated." : "Interview scheduled.",
      );
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Unable to save interview details.",
      );
    } finally {
      setSavingInterview(false);
    }
  };

  const completeInterview = async () => {
    setCompletingInterview(true);
    try {
      const { data } = await axios.patch(
        `/api/recruiter/applications/${applicationId}/interview/complete`,
      );
      setApplication((current) => ({
        ...current,
        interview: data.interview,
      }));
      toast.success("Interview marked as completed.");
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Unable to complete interview.",
      );
    } finally {
      setCompletingInterview(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/recruiter/users")}
        >
          Back to Received Applications
        </Button>
      </Box>
    );
  }

  if (!application) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Applicant application not found.</Alert>
      </Box>
    );
  }

  const user = application.user || {};
  const job = application.jobId || {};
  const resumeActive = Boolean(user.resume);
  const matchScore = application.matchScore ?? null;
  const matchedSkills = application.matchedSkills || [];
  const missingSkills = application.missingSkills || [];
  const matchExplanation =
    application.matchExplanation || "No AI match explanation available.";

  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
        onClick={() => navigate("/recruiter/users")}
      >
        Back to Received Applications
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" sx={{ color: "#111827", fontWeight: 700 }}>
              Applicant Review
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Review all applicant information and manage the recruiting
              decision.
            </Typography>
          </Box>

          <Chip
            label={formatStatus(application.applicationStatus)}
            color={
              application.applicationStatus === "rejected"
                ? "error"
                : application.applicationStatus === "selected" ||
                    application.applicationStatus === "accepted"
                  ? "success"
                  : "primary"
            }
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                AI Job Match
              </Typography>

              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                {matchScore === null || typeof matchScore === "undefined"
                  ? "Not enough data"
                  : `${matchScore}%`}
              </Typography>

              <Typography sx={{ mt: 1, color: "text.secondary" }}>
                {matchExplanation}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Matched Skills
                </Typography>
                <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {matchedSkills.length ? (
                    matchedSkills.map((skill) => (
                      <Box
                        key={skill}
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 999,
                          bgcolor: "rgba(76,175,80,0.12)",
                          color: "success.dark",
                        }}
                      >
                        {skill}
                      </Box>
                    ))
                  ) : (
                    <Typography color="text.secondary">
                      No matched skills found.
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Missing Skills
                </Typography>
                <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {missingSkills.length ? (
                    missingSkills.map((skill) => (
                      <Box
                        key={skill}
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 999,
                          bgcolor: "rgba(255,152,0,0.12)",
                          color: "warning.dark",
                        }}
                      >
                        {skill}
                      </Box>
                    ))
                  ) : (
                    <Typography color="text.secondary">
                      No skill gaps identified.
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Applicant Details
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Applicant Name
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {safeValue(
                      application.applicantName ||
                        `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                      "Not provided",
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {safeValue(
                      application.applicantEmail ||
                        application.email ||
                        user.email,
                      "Not provided",
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Contact Details
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {safeValue(
                      user.phoneNumber || user.contactDetails,
                      "Not provided",
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Job Applied For
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {safeValue(
                      application.jobTitle || job.title || application.title,
                      "Not available",
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Applied Date
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {application.createdAt
                      ? new Date(application.createdAt).toLocaleDateString()
                      : "Not available"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Current Status
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {formatStatus(application.applicationStatus)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Education
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {safeValue(user.education, "Not provided")}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Skills
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {safeValue(user.skills, "Not provided")}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Experience
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {safeValue(user.experience, "Not provided")}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Profile Information
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {safeValue(user.profileInformation, "Not provided")}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recruiter Action
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Update application status
              </Typography>
              <Select
                fullWidth
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                sx={{ mb: 2 }}
              >
                {application.interview && (
                  <MenuItem value="interview">Interview</MenuItem>
                )}
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              {application.applicationStatus === "shortlisted" &&
                !application.interview && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    onClick={openInterviewDialog}
                    sx={{ mb: 2 }}
                  >
                    Schedule Interview
                  </Button>
                )}

              {application.interview && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    Interview Scheduled
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Date: {formatInterviewDate(application.interview.date)}
                  </Typography>
                  <Typography variant="body2">
                    Time: {formatInterviewTime(application.interview.time)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Mode: Online
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Candidate response:{" "}
                    {(typeof application.interview.response === "string"
                      ? application.interview.response
                      : application.interview.response?.status || "pending"
                    ).replace(/^\w/, (letter) => letter.toUpperCase())}
                  </Typography>
                  {(application.interview.status || "").toLowerCase() !==
                    "completed" &&
                    ["pending", "accepted"].includes(
                      typeof application.interview.response === "string"
                        ? application.interview.response
                        : application.interview.response?.status || "pending",
                    ) && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        disabled={completingInterview}
                        onClick={completeInterview}
                        sx={{ mb: 1.5 }}
                      >
                        {completingInterview ? (
                          <CircularProgress size={20} />
                        ) : (
                          "Mark Interview as Completed"
                        )}
                      </Button>
                    )}
                  <Link
                    href={application.interview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    underline="hover"
                    sx={{ overflowWrap: "anywhere" }}
                  >
                    Meeting Link
                  </Link>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={openInterviewDialog}
                    sx={{ mt: 1.5 }}
                  >
                    Reschedule Interview
                  </Button>
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleStatusUpdate}
                disabled={savingStatus}
              >
                {savingStatus ? <CircularProgress size={20} /> : "Save Status"}
              </Button>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>
                Resume
              </Typography>

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={previewResume}
                  disabled={!resumeActive}
                >
                  View Resume
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={downloadResume}
                  disabled={!resumeActive}
                >
                  Download Resume
                </Button>
              </Stack>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Uploaded Resume
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {resumeActive
                    ? getResumeFileName(user.resume)
                    : "No resume available"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={interviewDialogOpen}
        onClose={() => !savingInterview && setInterviewDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={saveInterview}>
          <DialogTitle>
            {application.interview
              ? "Reschedule Interview"
              : "Schedule Interview"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Interview Date"
                type="date"
                value={interviewForm.date}
                onChange={(event) =>
                  setInterviewForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                inputProps={{ min: getLocalDateValue() }}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
              />
              <TextField
                label="Interview Time"
                type="time"
                value={interviewForm.time}
                onChange={(event) =>
                  setInterviewForm((current) => ({
                    ...current,
                    time: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
              />
              <FormControl required fullWidth>
                <InputLabel id="interview-mode-label">
                  Interview Mode
                </InputLabel>
                <Select
                  labelId="interview-mode-label"
                  label="Interview Mode"
                  value={interviewForm.mode}
                  onChange={(event) =>
                    setInterviewForm((current) => ({
                      ...current,
                      mode: event.target.value,
                    }))
                  }
                >
                  <MenuItem value="online">Online</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Meeting Link"
                type="url"
                value={interviewForm.meetingLink}
                onChange={(event) =>
                  setInterviewForm((current) => ({
                    ...current,
                    meetingLink: event.target.value,
                  }))
                }
                required={interviewForm.mode === "online"}
                fullWidth
                helperText="Enter a valid online meeting URL."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setInterviewDialogOpen(false)}
              disabled={savingInterview}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingInterview}
            >
              {savingInterview ? (
                <CircularProgress size={20} />
              ) : (
                "Save Interview"
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ApplicantReview;
