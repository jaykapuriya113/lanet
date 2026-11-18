import * as React from "react";
import axios from "axios";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Alert,
  Rating,
  Stack,
  TextField,
  Step,
  StepLabel,
  Stepper,
  useTheme,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Link } from "react-router-dom";

const STATUS_STEPS = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Selected / Rejected",
];

const STATUS_LABELS = {
  pending: "Applied",
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  accepted: "Selected",
  rejected: "Rejected",
};

const STATUS_STEPS_BY_VALUE = {
  pending: 0,
  applied: 0,
  under_review: 1,
  shortlisted: 2,
  interview: 3,
  selected: 4,
  accepted: 4,
  rejected: 4,
};

const formatInterviewTime = (value) => {
  if (!value) return "Not available";
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const CardElement1 = ({
  jobTitle,
  description,
  category,
  location,
  id,
  salary,
  applicationStatus,
  companyName,
  appliedDate,
  resume,
  jobId,
  interview,
  feedback,
  expandFeedback = false,
}) => {
  const { palette } = useTheme();
  const getInterviewResponse = (value) =>
    typeof value === "string" ? value : value?.status || "pending";
  const [interviewResponse, setInterviewResponse] = React.useState(
    getInterviewResponse(interview?.response),
  );
  const [savingInterviewResponse, setSavingInterviewResponse] =
    React.useState(false);
  const [interviewResponseError, setInterviewResponseError] =
    React.useState("");
  const [savedFeedback, setSavedFeedback] = React.useState(feedback || null);
  const [feedbackOpen, setFeedbackOpen] = React.useState(expandFeedback);
  const [feedbackAnswers, setFeedbackAnswers] = React.useState({
    overallExperience: "",
    likedMost: "",
    suggestedImprovements: "",
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = React.useState(false);
  const [savingFeedback, setSavingFeedback] = React.useState(false);
  const [feedbackError, setFeedbackError] = React.useState("");

  React.useEffect(() => {
    setInterviewResponse(getInterviewResponse(interview?.response));
  }, [interview]);

  React.useEffect(() => {
    setSavedFeedback(feedback || null);
  }, [feedback]);

  React.useEffect(() => {
    setFeedbackOpen(expandFeedback);
  }, [expandFeedback]);

  const submitFeedback = async () => {
    setSavingFeedback(true);
    setFeedbackError("");
    try {
      const { data } = await axios.post(
        `/api/user/applications/${encodeURIComponent(id)}/feedback`,
        feedbackAnswers,
      );
      setSavedFeedback(data.feedback);
      setFeedbackOpen(false);
      setFeedbackSubmitted(true);
    } catch (error) {
      setFeedbackError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Unable to submit feedback.",
      );
    } finally {
      setSavingFeedback(false);
    }
  };

  const respondToInterview = async (response) => {
    setSavingInterviewResponse(true);
    setInterviewResponseError("");
    try {
      const { data } = await axios.patch(
        `/api/user/applications/${encodeURIComponent(id)}/interview-response`,
        { response },
      );
      setInterviewResponse(getInterviewResponse(data.interview.response));
    } catch (error) {
      setInterviewResponseError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Unable to save your interview response.",
      );
    } finally {
      setSavingInterviewResponse(false);
    }
  };

  const normalizedStatus = String(applicationStatus || "pending")
    .trim()
    .toLowerCase();
  const statusLabel =
    STATUS_LABELS[normalizedStatus] ||
    normalizedStatus
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const activeStep = STATUS_STEPS_BY_VALUE[normalizedStatus] ?? -1;
  const statusColor =
    normalizedStatus === "rejected"
      ? "error"
      : normalizedStatus === "selected" || normalizedStatus === "accepted"
        ? "success"
        : "primary";
  const formattedAppliedDate = appliedDate
    ? new Date(appliedDate).toLocaleDateString()
    : "Not available";

  return (
    <Card id={id ? `application-${id}` : undefined} sx={{ mb: 3 }}>
      <CardContent>
        <Typography
          variant="h5"
          component="div"
          sx={{ mb: 1, fontWeight: 700 }}
        >
          {jobTitle}
        </Typography>
        {companyName && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1,
              fontFamily: "Roboto, sans-serif",
              fontWeight: 600,
            }}
          >
            {companyName}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <IconButton disableRipple size="small" sx={{ pl: 0 }}>
            <LocationOnIcon
              sx={{ color: palette.secondary.main, fontSize: 18 }}
            />
          </IconButton>
          <Typography variant="body2">
            {location || "Location not listed"}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Applied: {formattedAppliedDate}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="subtitle2">Current status</Typography>
          <Chip label={statusLabel} color={statusColor} size="small" />
        </Box>
        <Box sx={{ overflowX: "auto", py: 1, mb: 2 }}>
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{ minWidth: 560 }}
          >
            {STATUS_STEPS.map((step) => (
              <Step key={step}>
                <StepLabel>{step}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        {interview?.status === "completed" &&
          normalizedStatus !== "interview" && (
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
              Interview Completed
            </Typography>
          )}
        {normalizedStatus === "interview" && interview && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
              {interview.status === "completed"
                ? "Interview Completed"
                : "Interview Scheduled"}
            </Typography>
            <Typography variant="body2">
              Date:{" "}
              {new Date(`${interview.date}T12:00:00`).toLocaleDateString(
                undefined,
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                },
              )}
            </Typography>
            <Typography variant="body2">
              Time: {formatInterviewTime(interview.time)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              Mode: Online
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              Your response:{" "}
              {interviewResponse.charAt(0).toUpperCase() +
                interviewResponse.slice(1)}
            </Typography>
            {interviewResponseError && (
              <Alert severity="error" sx={{ mb: 1.5 }}>
                {interviewResponseError}
              </Alert>
            )}
            {interviewResponse === "pending" && (
              <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                <Button
                  variant="contained"
                  disabled={savingInterviewResponse}
                  onClick={() => respondToInterview("accepted")}
                >
                  {savingInterviewResponse ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Accept Interview"
                  )}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={savingInterviewResponse}
                  onClick={() => respondToInterview("declined")}
                >
                  Decline Interview
                </Button>
              </Box>
            )}
            <Typography
              variant="body2"
              sx={{ mb: 1.5, overflowWrap: "anywhere" }}
            >
              Meeting Link:{" "}
              <Box
                component="a"
                href={interview.meetingLink}
                target="_blank"
                rel="noreferrer"
              >
                {interview.meetingLink}
              </Box>
            </Typography>
            <Button
              component="a"
              href={interview.meetingLink}
              target="_blank"
              rel="noreferrer"
              variant="contained"
              disabled={!interview.meetingLink}
            >
              Join Interview
            </Button>
          </Box>
        )}
        <Box
          sx={{
            mb: 2,
            p: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            Feedback
          </Typography>
          {savedFeedback ? (
            <>
              {feedbackSubmitted && (
                <Alert severity="success" sx={{ mb: 1.5 }}>
                  Feedback submitted successfully.
                </Alert>
              )}
              {[
                ["What was your overall experience with the company?", savedFeedback.overallExperience],
                ["What did you like most about the company and recruitment process?", savedFeedback.likedMost],
                ["What improvements would you suggest for the company or recruitment process?", savedFeedback.suggestedImprovements],
              ].some(([, answer]) => answer) ? (
                <Stack spacing={2}>
                  {[
                    ["What was your overall experience with the company?", savedFeedback.overallExperience],
                    ["What did you like most about the company and recruitment process?", savedFeedback.likedMost],
                    ["What improvements would you suggest for the company or recruitment process?", savedFeedback.suggestedImprovements],
                  ].map(([question, answer]) => (
                    <Box key={question}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {question}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                        {answer || "No answer provided."}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <>
                  {savedFeedback.rating && <Rating value={savedFeedback.rating} readOnly />}
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                    {savedFeedback.comment}
                  </Typography>
                </>
              )}
              <Typography variant="caption" color="text.secondary">
                Submitted{" "}
                {new Date(savedFeedback.submittedAt).toLocaleDateString()}
              </Typography>
            </>
          ) : !feedbackOpen ? (
            <Button variant="outlined" onClick={() => setFeedbackOpen(true)}>
              Give Feedback
            </Button>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Share your experience with this company and its recruitment process.
              </Typography>
              {[
                {
                  name: "overallExperience",
                  question: "What was your overall experience with the company?",
                },
                {
                  name: "likedMost",
                  question: "What did you like most about the company and recruitment process?",
                },
                {
                  name: "suggestedImprovements",
                  question: "What improvements would you suggest for the company or recruitment process?",
                },
              ].map(({ name, question }) => (
                <TextField
                  key={name}
                  fullWidth
                  multiline
                  minRows={3}
                  label={question}
                  value={feedbackAnswers[name]}
                  onChange={(event) =>
                    setFeedbackAnswers((current) => ({
                      ...current,
                      [name]: event.target.value,
                    }))
                  }
                  inputProps={{ maxLength: 5000 }}
                  required
                  sx={{ my: 1 }}
                />
              ))}
              {feedbackError && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {feedbackError}
                </Alert>
              )}
              <Button
                variant="contained"
                disabled={
                  savingFeedback ||
                  Object.values(feedbackAnswers).some((answer) => !answer.trim())
                }
                onClick={submitFeedback}
              >
                {savingFeedback ? (
                  <CircularProgress size={20} />
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </>
          )}
        </Box>
        {category && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {category}
          </Typography>
        )}
        {description && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {description.split(" ").slice(0, 15).join(" ")}
            {description.split(" ").length > 15 ? "..." : ""}
          </Typography>
        )}
        {salary && (
          <Typography variant="body2" sx={{ fontWeight: "bold", mb: 2 }}>
            Salary: ${salary}
          </Typography>
        )}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {resume && (
            <Button
              component="a"
              href={resume}
              target="_blank"
              rel="noreferrer"
              variant="outlined"
            >
              View Resume
            </Button>
          )}
          {jobId && (
            <Button component={Link} to={`/job/${jobId}`} variant="outlined">
              View Details
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CardElement1;
