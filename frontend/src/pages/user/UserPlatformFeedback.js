import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const formatSubmissionDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

const UserPlatformFeedback = () => {
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadFeedback = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await axios.get("/api/user/platform-feedback");
      setFeedbackItems(data.feedback || []);
    } catch (error) {
      setLoadError(
        error.response?.data?.error || "Unable to load your feedback.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const submitFeedback = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitted(false);
    try {
      const { data } = await axios.post("/api/user/platform-feedback", {
        rating,
        feedback,
      });
      setFeedbackItems((current) => [data.feedback, ...current]);
      setRating(0);
      setFeedback("");
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error.response?.data?.error || "Unable to submit your feedback.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h4" sx={{ color: "black", mb: 1 }}>
        Platform Feedback
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Share your feedback about the Job Portal platform.
      </Typography>

      {submitted && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Your feedback was submitted successfully.
        </Alert>
      )}
      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <Paper component="form" onSubmit={submitFeedback} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Typography component="legend" sx={{ mb: 1, fontWeight: 600 }}>
          How would you rate the Job Portal?
        </Typography>
        <Rating
          name="user-platform-rating"
          value={rating}
          onChange={(event, value) => setRating(value || 0)}
          precision={1}
          size="large"
          aria-label="Rate the Job Portal from 1 to 5 stars"
        />
        <TextField
          label="Your platform feedback"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          multiline
          minRows={4}
          fullWidth
          required
          inputProps={{ maxLength: 2000 }}
          helperText={`${feedback.length}/2000 characters`}
          sx={{ mt: 2, mb: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={submitting || rating < 1 || !feedback.trim()}
        >
          {submitting ? <CircularProgress size={20} /> : "Submit Feedback"}
        </Button>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Your Feedback
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress aria-label="Loading your feedback" />
        </Box>
      ) : feedbackItems.length === 0 ? (
        <Typography color="text.secondary">
          You have not submitted any platform feedback yet.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {feedbackItems.map((item) => (
            <Paper key={item._id} sx={{ p: { xs: 2, sm: 3 } }}>
              <Rating value={item.rating} readOnly />
              <Typography sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                {item.feedback}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Submitted {formatSubmissionDate(item.submittedAt)}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default UserPlatformFeedback;