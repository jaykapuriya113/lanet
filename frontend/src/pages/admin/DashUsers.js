import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbar, gridClasses } from "@mui/x-data-grid";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const formatStatus = (status) => {
  const statusMap = {
    pending: "Applied",
    under_review: "Under Review",
    shortlisted: "Shortlisted",
    interview: "Interview",
    selected: "Selected",
    accepted: "Selected",
    rejected: "Rejected",
  };

  return statusMap[status] || "Applied";
};

const DashUsers = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");

  const getApplicantName = (row = {}) => {
    const firstName =
      row?.user?.firstName || row?.applicantFirstName || row?.firstName || "";
    const lastName =
      row?.user?.lastName || row?.applicantLastName || row?.lastName || "";
    const directName = row?.applicantName || row?.name || "";

    if (directName) return directName;
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "Unknown";
  };

  const getJobTitle = (row = {}) => {
    return (
      row?.jobId?.title ||
      row?.jobTitle ||
      row?.title ||
      row?.job?.title ||
      "Not available"
    );
  };

  const getApplicantEmail = (row = {}) => {
    return (
      row?.user?.email ||
      row?.applicantEmail ||
      row?.email ||
      row?.userEmail ||
      row?.applicant?.email ||
      "Not available"
    );
  };

  const fetchApplications = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get("/api/recruiter/applications", {
        withCredentials: true,
      });
      const applications = Array.isArray(data?.applications)
        ? data.applications
        : [];
      if (process.env.NODE_ENV !== "production") {
        console.info(
          "Received applications API fields:",
          applications.map(({ email, jobTitle, matchScore }) => ({
            email,
            jobTitle,
            matchScore,
          })),
        );
      }
      setRows(applications);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Unable to load received applications.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openApplicationResume = async (applicationId) => {
    const resumeWindow = window.open("about:blank", "_blank");
    if (!resumeWindow) {
      toast.error("Allow pop-ups to view the applicant's resume.");
      return;
    }

    try {
      const { data } = await axios.get(
        `/api/recruiter/applications/${applicationId}/resume`,
        { responseType: "blob", withCredentials: true },
      );
      const objectUrl = URL.createObjectURL(data);
      resumeWindow.location.replace(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (requestError) {
      resumeWindow.close();
      let message =
        requestError.response?.data?.error ||
        requestError.response?.data?.message ||
        requestError.message ||
        "Unable to open this resume.";

      if (requestError.response?.data instanceof Blob) {
        try {
          const responseBody = JSON.parse(
            await requestError.response.data.text(),
          );
          message = responseBody.error || responseBody.message || message;
        } catch {}
      }

      toast.error(message);
    }
  };

  const updateApplicationStatus = async (applicationId, applicationStatus) => {
    setProcessingId(applicationId);
    try {
      const { data } = await axios.patch(
        `/api/recruiter/applications/${applicationId}/status`,
        { applicationStatus },
      );
      toast.success("Application status updated.");
      if (data?.emailNotification?.status === "failed") {
        toast.error(
          "Status was saved, but the candidate notification email could not be sent.",
        );
      } else if (data?.emailNotification?.status === "accepted") {
        toast.info("The SMTP provider accepted the candidate notification.");
      }
      fetchApplications();
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Unable to update status.",
      );
    } finally {
      setProcessingId("");
    }
  };

  const columns = [
    {
      field: "applicantName",
      headerName: "Applicant",
      width: 180,
      renderCell: (params) => getApplicantName(params.row),
    },
    {
      field: "jobTitle",
      headerName: "Job",
      width: 180,
      valueGetter: (params) => getJobTitle(params.row),
    },
    {
      field: "email",
      headerName: "Email",
      width: 220,
      valueGetter: (params) => getApplicantEmail(params.row),
    },
    {
      field: "matchScore",
      headerName: "Match Score",
      width: 140,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color:
              params.row.matchScore === null ||
              typeof params.row.matchScore === "undefined"
                ? "text.secondary"
                : params.row.matchScore >= 80
                  ? "success.main"
                  : params.row.matchScore >= 60
                    ? "warning.main"
                    : "text.secondary",
          }}
        >
          {params.row.matchScore === null ||
          typeof params.row.matchScore === "undefined"
            ? params.row.matchExplanation || "A match score is unavailable."
            : `${params.row.matchScore}%`}
        </Typography>
      ),
    },
    {
      field: "applicationStatus",
      headerName: "Status",
      width: 220,
      renderCell: (params) => (
        <Select
          size="small"
          value={params.row.applicationStatus || "pending"}
          onChange={(event) =>
            updateApplicationStatus(params.row._id, event.target.value)
          }
          disabled={processingId === params.row._id}
        >
          <MenuItem value="pending">Applied</MenuItem>
          <MenuItem value="under_review">Under Review</MenuItem>
          <MenuItem value="shortlisted">Shortlisted</MenuItem>
          {params.row.interview && (
            <MenuItem value="interview">Interview</MenuItem>
          )}
          <MenuItem value="selected">Selected</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </Select>
      ),
    },
    {
      field: "resume",
      headerName: "Resume",
      width: 170,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => openApplicationResume(params.row._id)}
          disabled={!params.row?.user?.resume}
        >
          View Resume
        </Button>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate(`/recruiter/application/${params.row._id}`)}
        >
          View Applicant
        </Button>
      ),
    },
  ];

  return (
    <Box display="flex" justifyContent="center" mt={3}>
      <Box width="82%">
        <Typography
          variant="h4"
          sx={{
            color: "black",
            pb: 3,
            display: "flex",
            justifyContent: "left",
          }}
        >
          Received Applications
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ bgcolor: "secondary.midNightBlue" }}>
          <Box sx={{ height: 560, width: "100%" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                getRowId={(row) => row._id}
                sx={{
                  "& .MuiTablePagination-displayedRows": { color: "black" },
                  color: "black",
                  [`& .${gridClasses.row}`]: {},
                  button: { color: "black" },
                }}
                rows={rows}
                columns={columns}
                slots={{ toolbar: GridToolbar }}
                checkboxSelection
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 5 },
                  },
                }}
                pageSizeOptions={[5, 10]}
                density="comfortable"
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default DashUsers;
