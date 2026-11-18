import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridToolbar, gridClasses } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { adminLoadApplicationsAction } from "../../redux/actions/userAction";

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Applied" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLOR = {
  pending: "default",
  under_review: "info",
  shortlisted: "warning",
  interview: "primary",
  selected: "success",
  accepted: "success",
  rejected: "error",
};

const STATUS_LABEL = {
  pending: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  accepted: "Selected",
  rejected: "Rejected",
};

// ── component ─────────────────────────────────────────────────────────────────

const AdminApplications = () => {
  const dispatch = useDispatch();
  const { loading, applications = [], error } = useSelector(
    (state) => state.adminApplications,
  );

  // Local filter state — debounce search to avoid hammering the API
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce: update debouncedSearch 400 ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const load = useCallback(() => {
    dispatch(
      adminLoadApplicationsAction({
        status: statusFilter,
        search: debouncedSearch,
      }),
    );
  }, [dispatch, statusFilter, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  // ── columns ────────────────────────────────────────────────────────────────

  const columns = [
    {
      field: "applicantName",
      headerName: "Applicant",
      width: 180,
    },
    {
      field: "applicantEmail",
      headerName: "Email",
      width: 220,
    },
    {
      field: "jobTitle",
      headerName: "Job Title",
      width: 200,
    },
    {
      field: "companyName",
      headerName: "Company / Recruiter",
      width: 200,
    },
    {
      field: "appliedAt",
      headerName: "Applied Date",
      width: 160,
      renderCell: (params) =>
        params.row.appliedAt
          ? moment(params.row.appliedAt).format("YYYY-MM-DD")
          : "—",
    },
    {
      field: "applicationStatus",
      headerName: "Status",
      width: 160,
      renderCell: (params) => (
        <Chip
          label={STATUS_LABEL[params.row.applicationStatus] || "Applied"}
          color={STATUS_COLOR[params.row.applicationStatus] || "default"}
          size="small"
          variant="outlined"
        />
      ),
    },
  ];

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <Box display="flex" justifyContent="center" mt={3}>
      <Box width="90%">
        <Typography variant="h4" sx={{ color: "black", pb: 2 }}>
          Monitor Applications
        </Typography>

        {/* Filters */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            label="Search applicant, email, or job"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 280 }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
            {loading ? "" : `${applications.length} result${applications.length !== 1 ? "s" : ""}`}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ bgcolor: "secondary.midNightBlue" }}>
          <Box sx={{ height: 580, width: "100%" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                getRowId={(row) => row._id}
                rows={applications}
                columns={columns}
                slots={{ toolbar: GridToolbar }}
                initialState={{
                  pagination: { paginationModel: { page: 0, pageSize: 10 } },
                }}
                pageSizeOptions={[10, 25, 50]}
                density="comfortable"
                disableRowSelectionOnClick
                sx={{
                  color: "black",
                  "& .MuiTablePagination-displayedRows": { color: "black" },
                  [`& .${gridClasses.row}`]: {},
                  button: { color: "black" },
                }}
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminApplications;
