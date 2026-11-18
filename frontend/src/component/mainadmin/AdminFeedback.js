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
  Rating,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DataGrid, GridToolbar, gridClasses } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import {
  adminLoadFeedbackAction,
  adminUpdateFeedbackStatusAction,
  adminDeleteFeedbackAction,
} from "../../redux/actions/userAction";

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  pending:   "warning",
  reviewed:  "info",
  resolved:  "success",
  submitted: "default",   // application feedback not yet reviewed
};

const ROLE_OPTIONS = [
  { value: "",          label: "All Roles" },
  { value: "recruiter", label: "Recruiter" },
  { value: "user",      label: "User" },
];

const STATUS_OPTIONS = [
  { value: "",          label: "All Statuses" },
  { value: "pending",   label: "Pending" },
  { value: "reviewed",  label: "Reviewed" },
  { value: "resolved",  label: "Resolved" },
  { value: "submitted", label: "Submitted (User)" },
];

const findSidebarContentItem = (node) => {
  let contentItem = node;
  while (contentItem?.parentElement) {
    const currentItem = contentItem;
    const flexContainer = currentItem.parentElement;
    let hasSidebarSibling = false;
    for (const sibling of flexContainer.children) {
      if (
        sibling !== currentItem &&
        (sibling.matches(".ps-sidebar-root") ||
          sibling.querySelector(".ps-sidebar-root"))
      ) {
        hasSidebarSibling = true;
        break;
      }
    }
    if (
      hasSidebarSibling &&
      window.getComputedStyle(flexContainer).display === "flex"
    ) {
      return currentItem;
    }
    contentItem = flexContainer;
  }
  return null;
};

// ── component ─────────────────────────────────────────────────────────────────

const AdminFeedback = () => {
  const dispatch = useDispatch();
  const { loading, feedback = [], error } = useSelector(
    (state) => state.adminFeedback,
  );

  const [roleFilter,   setRoleFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText,   setSearchText]   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Delete-confirm dialog state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, senderName }
  const [deleting,     setDeleting]     = useState(false);
  const gridWrapperRef = React.useRef(null);
  const followScrollEndRef = React.useRef(false);
  const [actionsOverflow, setActionsOverflow] = useState(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const load = useCallback(() => {
    dispatch(
      adminLoadFeedbackAction({
        role:   roleFilter,
        status: statusFilter,
        search: debouncedSearch,
      }),
    );
  }, [dispatch, roleFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  React.useLayoutEffect(() => {
    const contentItem = findSidebarContentItem(gridWrapperRef.current);
    if (!contentItem) return undefined;
    const previousMinWidth = contentItem.style.minWidth;
    contentItem.style.minWidth = "0";
    return () => {
      contentItem.style.minWidth = previousMinWidth;
    };
  }, []);

  const measureActionsOverflow = React.useCallback(() => {
    const grid = gridWrapperRef.current;
    const actionsCells = grid?.querySelectorAll(
      ".MuiDataGrid-cell[data-field='actions']",
    );
    const virtualContent = grid?.querySelector(
      ".MuiDataGrid-virtualScrollerContent",
    );
    if (!actionsCells?.length || !virtualContent) return;

    const contentRight = virtualContent.getBoundingClientRect().right;
    const overflow = Array.from(actionsCells).reduce((maxOverflow, cell) => {
      const buttons = Array.from(cell.querySelectorAll(".MuiButton-root"));
      const cellOverflow = Math.max(0, cell.scrollWidth - cell.clientWidth);
      const rightmostButton = buttons.reduce((rightmost, button) => {
        const buttonRect = button.getBoundingClientRect();
        return Math.max(
          rightmost,
          buttonRect.right + Math.max(0, button.scrollWidth - button.clientWidth),
        );
      }, contentRight);
      return Math.max(
        maxOverflow,
        cellOverflow,
        Math.ceil(rightmostButton - contentRight),
      );
    }, 0);
    const scroller = grid.querySelector(".MuiDataGrid-virtualScroller");
    const isAtRightEdge = scroller &&
      scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft <= 1;
    setActionsOverflow((current) => {
      if (current === overflow) return current;
      if (overflow > current && isAtRightEdge) {
        followScrollEndRef.current = true;
      }
      return overflow;
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!followScrollEndRef.current) return;
    followScrollEndRef.current = false;
    const scroller = gridWrapperRef.current?.querySelector(
      ".MuiDataGrid-virtualScroller",
    );
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }, [actionsOverflow]);

  useEffect(() => {
    const grid = gridWrapperRef.current;
    if (!grid) return undefined;

    let frame = 0;
    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measureActionsOverflow);
    };
    const mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(grid, { childList: true, subtree: true });
    const scroller = grid.querySelector(".MuiDataGrid-virtualScroller");
    scroller?.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    scheduleMeasure();

    return () => {
      mutationObserver.disconnect();
      scroller?.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      window.cancelAnimationFrame(frame);
    };
  }, [measureActionsOverflow]);

  const handleStatusChange = (id, status) => {
    dispatch(adminUpdateFeedbackStatusAction(id, status));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await dispatch(adminDeleteFeedbackAction(deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── columns ───────────────────────────────────────────────────────────────

  const columns = [
    {
      field: "senderName",
      headerName: "Sender",
      width: 180,
    },
    {
      field: "senderEmail",
      headerName: "Email",
      width: 210,
    },
    {
      field: "senderRole",
      headerName: "Role",
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.row.senderRole}
          size="small"
          color={params.row.senderRole === "Recruiter" ? "primary" : "secondary"}
          variant="outlined"
        />
      ),
    },
    {
      field: "feedbackType",
      headerName: "Type",
      width: 160,
      renderCell: (params) => (
        <Typography variant="caption" color="text.secondary">
          {params.row.feedbackType === "recruiter_platform"
            ? "Platform Rating"
            : "Application Review"}
        </Typography>
      ),
    },
    {
      field: "rating",
      headerName: "Rating",
      width: 140,
      renderCell: (params) =>
        params.row.rating ? (
          <Rating value={params.row.rating} readOnly size="small" />
        ) : (
          <Typography variant="caption" color="text.secondary">—</Typography>
        ),
    },
    {
      field: "message",
      headerName: "Message",
      width: 280,
      renderCell: (params) => (
        <Tooltip title={params.row.message}>
          <Typography
            variant="body2"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 260,
            }}
          >
            {params.row.message}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "date",
      headerName: "Date",
      width: 130,
      renderCell: (params) =>
        params.row.date
          ? moment(params.row.date).format("YYYY-MM-DD")
          : "—",
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={
            params.row.status.charAt(0).toUpperCase() +
            params.row.status.slice(1)
          }
          color={STATUS_COLOR[params.row.status] || "default"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 260,
      sortable: false,
      renderCell: (params) => {
        const { _id } = params.row;

        return (
          <ButtonGroup size="small" variant="outlined" disableElevation>
            <Tooltip title="Mark Reviewed">
              <span>
                <Button
                  color="info"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => handleStatusChange(_id, "reviewed")}
                >
                  Review
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Mark Resolved">
              <span>
                <Button
                  color="success"
                  startIcon={<TaskAltIcon />}
                  onClick={() => handleStatusChange(_id, "resolved")}
                >
                  Resolve
                </Button>
              </span>
            </Tooltip>
            <Tooltip
              title="Delete feedback"
            >
              <span>
                <Button
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={() =>
                    setDeleteTarget({ id: _id, senderName: params.row.senderName })
                  }
                >
                  Delete
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
          User &amp; Recruiter Feedback
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
            label="Search sender, email, or message"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 280 }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              {ROLE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
            {loading
              ? ""
              : `${feedback.length} result${feedback.length !== 1 ? "s" : ""}`}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ bgcolor: "secondary.midNightBlue" }}>
          <Box ref={gridWrapperRef} sx={{ height: 600, width: "100%", minWidth: 0 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                getRowId={(row) => row._id}
                rows={feedback}
                columns={columns}
                slots={{ toolbar: GridToolbar }}
                disableColumnVirtualization
                initialState={{
                  pagination: { paginationModel: { page: 0, pageSize: 10 } },
                }}
                pageSizeOptions={[10, 25, 50]}
                density="comfortable"
                disableRowSelectionOnClick
                sx={{
                  color: "black",
                  "& .MuiTablePagination-displayedRows": { color: "black" },
                  "& .MuiDataGrid-row:not(.MuiDataGrid-row--dynamicHeight) > .MuiDataGrid-cell[data-field='actions']": {
                    overflow: "visible",
                  },
                  "& .MuiDataGrid-virtualScrollerContent::after": {
                    content: '""',
                    display: "block",
                    width: `calc(100% + ${actionsOverflow}px)`,
                    height: 0,
                    pointerEvents: "none",
                  },
                  [`& .${gridClasses.row}`]: {},
                  button: { color: "black" },
                }}
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Confirm-delete dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
      >
        <DialogTitle>Delete Feedback</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Permanently delete the platform feedback from{" "}
            <strong>{deleteTarget?.senderName}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFeedback;
