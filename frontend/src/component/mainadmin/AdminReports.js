import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import { DataGrid, GridToolbar, gridClasses } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import {
  adminLoadReportsAction,
  adminUpdateReportStatusAction,
  adminRemoveReportedJobAction,
} from "../../redux/actions/userAction";

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  pending: "warning",
  reviewed: "info",
  dismissed: "default",
  resolved: "success",
};

const REASON_LABELS = {
  spam: "Spam",
  fake_job: "Fake Job",
  inappropriate_content: "Inappropriate Content",
  misleading_info: "Misleading Info",
  scam: "Scam",
  other: "Other",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
  { value: "resolved", label: "Resolved" },
];

// ── component ─────────────────────────────────────────────────────────────────

const AdminReports = () => {
  const dispatch = useDispatch();
  const { loading, reports = [], error } = useSelector(
    (state) => state.adminReports,
  );

  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Confirm-remove dialog state
  const [removeTarget, setRemoveTarget] = useState(null); // { reportId, jobTitle }
  const [removing, setRemoving] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const load = useCallback(() => {
    dispatch(
      adminLoadReportsAction({ status: statusFilter, search: debouncedSearch }),
    );
  }, [dispatch, statusFilter, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = (reportId, status) => {
    dispatch(adminUpdateReportStatusAction(reportId, status));
  };

  const handleRemoveJob = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    await dispatch(adminRemoveReportedJobAction(removeTarget.reportId));
    setRemoving(false);
    setRemoveTarget(null);
    // Reload so the row reflects the resolved status
    dispatch(adminLoadReportsAction({ status: statusFilter, search: debouncedSearch }));
  };

  // ── columns ───────────────────────────────────────────────────────────────

  const columns = [
    {
      field: "contentType",
      headerName: "Type",
      width: 90,
      renderCell: () => (
        <Chip label="Job" size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: "jobTitle",
      headerName: "Reported Job",
      width: 200,
      valueGetter: (params) =>
        params.row.job?.title || params.row.jobTitle || "—",
    },
    {
      field: "companyName",
      headerName: "Company",
      width: 170,
      valueGetter: (params) => params.row.job?.companyName || "—",
    },
    {
      field: "reason",
      headerName: "Reason",
      width: 190,
      renderCell: (params) => (
        <Chip
          label={REASON_LABELS[params.row.reason] || params.row.reason}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "reporter",
      headerName: "Reported By",
      width: 200,
      valueGetter: (params) => {
        const r = params.row.reporter;
        if (!r) return "—";
        return `${r.firstName || ""} ${r.lastName || ""} (${r.email || ""})`.trim();
      },
    },
    {
      field: "createdAt",
      headerName: "Report Date",
      width: 150,
      renderCell: (params) =>
        params.row.createdAt
          ? moment(params.row.createdAt).format("YYYY-MM-DD")
          : "—",
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.row.status.charAt(0).toUpperCase() + params.row.status.slice(1)}
          color={STATUS_COLOR[params.row.status] || "default"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 310,
      sortable: false,
      renderCell: (params) => {
        const { _id, status, job } = params.row;
        const isResolved = status === "resolved" || status === "dismissed";
        const jobAlreadyDeleted = job?.isDeleted === true;
        return (
          <ButtonGroup size="small" variant="outlined" disableElevation>
            <Tooltip title="Mark Reviewed">
              <span>
                <Button
                  disabled={isResolved || status === "reviewed"}
                  color="info"
                  startIcon={<VerifiedIcon />}
                  onClick={() => handleStatusChange(_id, "reviewed")}
                >
                  Review
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Dismiss Report">
              <span>
                <Button
                  disabled={isResolved}
                  color="inherit"
                  startIcon={<CancelOutlinedIcon />}
                  onClick={() => handleStatusChange(_id, "dismissed")}
                >
                  Dismiss
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Mark Resolved">
              <span>
                <Button
                  disabled={isResolved}
                  color="success"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => handleStatusChange(_id, "resolved")}
                >
                  Resolve
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={jobAlreadyDeleted ? "Job already removed" : "Remove Job"}>
              <span>
                <Button
                  disabled={jobAlreadyDeleted}
                  color="error"
                  startIcon={<DeleteForeverIcon />}
                  onClick={() =>
                    setRemoveTarget({
                      reportId: _id,
                      jobTitle: job?.title || params.row.jobTitle || "this job",
                    })
                  }
                >
                  Remove Job
                </Button>
              </span>
            </Tooltip>
          </ButtonGroup>
        );
      },
    },
  ];

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <Box display="flex" justifyContent="center" mt={3}>
      <Box width="95%">
        <Typography variant="h4" sx={{ color: "black", pb: 2 }}>
          Reported / Suspicious Content
        </Typography>

        {/* Filters */}
        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            label="Search job, company, or reporter"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 280 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
            {loading ? "" : `${reports.length} result${reports.length !== 1 ? "s" : ""}`}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ bgcolor: "secondary.midNightBlue" }}>
          <Box sx={{ height: 600, width: "100%" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                getRowId={(row) => row._id}
                rows={reports}
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

      {/* Confirm remove-job dialog */}
      <Dialog
        open={Boolean(removeTarget)}
        onClose={() => !removing && setRemoveTarget(null)}
      >
        <DialogTitle>Remove Reported Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will soft-delete{" "}
            <strong>&quot;{removeTarget?.jobTitle}&quot;</strong> so it is no
            longer visible to users. The report record is kept for audit
            purposes. This action cannot be automatically undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRemoveTarget(null)}
            disabled={removing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemoveJob}
            color="error"
            variant="contained"
            disabled={removing}
          >
            {removing ? "Removing…" : "Remove Job"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminReports;
