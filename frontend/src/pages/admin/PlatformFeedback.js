import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Rating,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";

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

const PlatformFeedback = () => {
  const [savedFeedback, setSavedFeedback] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadFeedback = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get("/api/recruiter/platform-feedback");
      setSavedFeedback(data.feedback);
      setLoadFailed(false);
    } catch (requestError) {
      setLoadFailed(true);
      setError(
        requestError.response?.data?.error ||
          "Unable to load platform feedback.",
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
    setError("");
    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/recruiter/platform-feedback", {
        rating,
        feedback,
      });
      setSavedFeedback(data.feedback);
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        try {
          const { data } = await axios.get("/api/recruiter/platform-feedback");
          setSavedFeedback(data.feedback);
          setError("");
          return;
        } catch (loadError) {
          setError(
            loadError.response?.data?.error ||
              "Unable to load your saved platform feedback.",
          );
          return;
        }
      }
      setError(
        requestError.response?.data?.error ||
          "Unable to submit platform feedback.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress aria-label="Loading platform feedback" />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Typography variant="h4" sx={{ color: "black", mb: 1 }}>
        Platform Feedback
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Share your feedback about the Job Portal platform.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            !savedFeedback && (
              <Button color="inherit" size="small" onClick={loadFeedback}>
                Retry
              </Button>
            )
          }
        >
          {error}
        </Alert>
      )}

      {loadFailed ? null : savedFeedback ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Thank you for your feedback
          </Typography>
          <Rating value={savedFeedback.rating} readOnly />
          <Typography sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
            {savedFeedback.feedback}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Submitted {formatSubmissionDate(savedFeedback.submittedAt)}
          </Typography>
        </Paper>
      ) : (
        <Paper
          component="form"
          onSubmit={submitFeedback}
          sx={{ p: { xs: 2, sm: 3 } }}
        >
          <Typography component="legend" sx={{ mb: 1, fontWeight: 600 }}>
            How would you rate the Job Portal?
          </Typography>
          <Rating
            name="platform-rating"
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
            minRows={5}
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
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default PlatformFeedback;
