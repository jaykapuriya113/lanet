import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

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

const SuitableCandidates = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState("");

  const loadRecruiterJobs = async () => {
    setLoadingJobs(true);
    try {
      const { data } = await axios.get("/api/jobs/showalljobs", {
        withCredentials: true,
      });
      const recruiterJobs = (data?.jobs || []).filter(
        (job) =>
          String(job.user) ===
          String(
            localStorage.getItem("userInfo")
              ? JSON.parse(localStorage.getItem("userInfo")).role?._id ||
                  JSON.parse(localStorage.getItem("userInfo")).role
              : "",
          ),
      );
      setJobs(recruiterJobs);
      if (recruiterJobs.length && !selectedJobId) {
        setSelectedJobId(recruiterJobs[0]._id);
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Unable to load recruiter jobs.",
      );
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadSuitableCandidates = async (jobId) => {
    if (!jobId) return;
    setLoadingCandidates(true);
    setError("");
    try {
      const { data } = await axios.get(
        `/api/recruiter/jobs/${jobId}/candidates`,
        { withCredentials: true },
      );
      setCandidates(data?.candidates || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Unable to load suitable candidates.",
      );
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    loadRecruiterJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadSuitableCandidates(selectedJobId);
    }
  }, [selectedJobId]);

  const sortedCandidates = useMemo(
    () =>
      [...candidates].sort((first, second) => {
        const firstScore = Number.isFinite(first.score) ? first.score : -1;
        const secondScore = Number.isFinite(second.score) ? second.score : -1;
        return secondScore - firstScore;
      }),
    [candidates],
  );

  const shortlistCandidate = async (applicationId) => {
    try {
      const { data } = await axios.patch(
        `/api/recruiter/applications/${applicationId}/status`,
        { applicationStatus: "shortlisted" },
      );
      toast.success("Candidate shortlisted.");
      if (data?.emailNotification?.status === "failed") {
        toast.error(
          "Status was saved, but the candidate notification email could not be sent.",
        );
      } else if (data?.emailNotification?.status === "accepted") {
        toast.info("The SMTP provider accepted the candidate notification.");
      }
      if (selectedJobId) {
        loadSuitableCandidates(selectedJobId);
      }
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Unable to shortlist candidate.",
      );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ color: "black", mb: 2 }}>
        Suitable Candidates
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loadingJobs ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="job-select-label">Select Job</InputLabel>
            <Select
              labelId="job-select-label"
              value={selectedJobId}
              label="Select Job"
              onChange={(event) => setSelectedJobId(event.target.value)}
            >
              {jobs.map((job) => (
                <MenuItem key={job._id} value={job._id}>
                  {job.title} - {job.companyName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* View Job button — navigates to /job/:id for the selected job */}
          {selectedJobId && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                component={Link}
                to={`/job/${selectedJobId}`}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                View Job
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {loadingCandidates ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {sortedCandidates.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography color="text.secondary">
                No applications found for this job yet.
              </Typography>
            </Paper>
          ) : (
            sortedCandidates.map((candidate) => (
              <Card key={candidate.applicationId} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {candidate.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.email}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {candidate.score === null ||
                        typeof candidate.score === "undefined"
                          ? candidate.explanation || "A match score is unavailable."
                          : `${candidate.score}%`}
                      </Typography>
                      <Chip
                        label={candidate.applicationStatus || "pending"}
                        size="small"
                        sx={{ mt: 1 }}
                        color={
                          candidate.applicationStatus === "shortlisted"
                            ? "success"
                            : candidate.applicationStatus === "rejected"
                              ? "error"
                              : "default"
                        }
                      />
                    </Box>
                  </Stack>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Match Explanation
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {candidate.explanation || "Not enough data"}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Matched Skills
                    </Typography>
                    <Box
                      sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}
                    >
                      {candidate.matchedSkills?.length ? (
                        candidate.matchedSkills.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            color="success"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Missing Skills
                    </Typography>
                    <Box
                      sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}
                    >
                      {candidate.missingSkills?.length ? (
                        candidate.missingSkills.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            color="warning"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Resume / Profile
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {candidate.profileSummary}
                    </Typography>
                  </Box>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ mt: 3 }}
                  >
                    <Button
                      variant="contained"
                      onClick={() =>
                        window.open(
                          `/api/recruiter/applications/${candidate.applicationId}/resume`,
                          "_blank",
                        )
                      }
                      disabled={!candidate.resume}
                    >
                      View Resume
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() =>
                        window.open(
                          `/api/recruiter/applications/${candidate.applicationId}/resume`,
                          "_blank",
                        )
                      }
                      disabled={!candidate.resume}
                    >
                      Download {getResumeFileName(candidate.resume)}
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() =>
                        shortlistCandidate(candidate.applicationId)
                      }
                    >
                      Shortlist
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      )}
    </Box>
  );
};

export default SuitableCandidates;
