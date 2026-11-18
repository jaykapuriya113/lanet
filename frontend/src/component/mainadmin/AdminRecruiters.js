import React, { useEffect, useState } from "react";
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
  Link,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon        from "@mui/icons-material/Delete";
import PauseCircleIcon   from "@mui/icons-material/PauseCircle";
import VerifiedIcon      from "@mui/icons-material/Verified";
import CancelIcon        from "@mui/icons-material/Cancel";
import { DataGrid, GridToolbar, gridClasses } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import {
  adminLoadRecruitersAction,
  adminDeactivateRecruiterAction,
  adminDeleteRecruiterAction,
  adminVerifyRecruiterAction,
} from "../../redux/actions/userAction";

// ── helper display ────────────────────────────────────────────────────────────
const display = (val) => (val && String(val).trim() ? String(val).trim() : "—");

const ActiveChip = ({ isActive }) =>
  isActive === false ? (
    <Chip label="Deactivated" color="error"   size="small" variant="outlined" />
  ) : (
    <Chip label="Active"      color="success" size="small" variant="outlined" />
  );

const VerifyChip = ({ status }) => {
  const map = {
    pending:  { label: "Pending",  color: "warning" },
    verified: { label: "Verified", color: "success" },
    rejected: { label: "Rejected", color: "error"   },
  };
  const { label, color } = map[status] || map.pending;
  return <Chip label={label} color={color} size="small" />;
};

const CONFIRM_TYPES = {
  deactivate: {
    title: "Deactivate Recruiter",
    body: "The recruiter's login access will be removed and all their active jobs will be unpublished. Application history is preserved. Continue?",
    action: "Deactivate",
    color: "warning",
  },
  verify: {
    title: "Verify Recruiter",
    body: "Mark this recruiter as Verified. They will be able to post jobs normally.",
    action: "Verify",
    color: "success",
  },
  reject: {
    title: "Reject Recruiter",
    body: "Mark this recruiter as Rejected. Their account will be deactivated and their jobs will be unpublished.",
    action: "Reject",
    color: "error",
  },
  delete: {
    title: "Delete Recruiter",
    body: "This soft-deletes the recruiter account. Their jobs and application history are preserved in the database. This cannot be undone.",
    action: "Delete",
    color: "error",
  },
};

// ── component ─────────────────────────────────────────────────────────────────
const AdminRecruiters = () => {
  const dispatch = useDispatch();
  const { loading, recruiters = [], error } = useSelector((s) => s.adminRecruiters);
  const { pending: statusPending } = useSelector((s) => s.adminRecruiterStatus);

  const [confirm, setConfirm]         = useState(null); // { type, id }
  const [actionPending, setActionPending] = useState(false);
  const gridWrapperRef = React.useRef(null);

  useEffect(() => {
    dispatch(adminLoadRecruitersAction());
  }, [dispatch]);

  React.useLayoutEffect(() => {
    let contentItem = gridWrapperRef.current;
    while (contentItem?.parentElement) {
      const currentItem = contentItem;
      const flexContainer = currentItem.parentElement;
      const hasSidebarSibling = Array.from(flexContainer.children).some(
        (sibling) =>
          sibling !== currentItem &&
          (sibling.matches(".ps-sidebar-root") ||
            sibling.querySelector(".ps-sidebar-root")),
      );
      if (
        hasSidebarSibling &&
        window.getComputedStyle(flexContainer).display === "flex"
      ) {
        const recruiterContent = contentItem;
        const previousMinWidth = recruiterContent.style.minWidth;
        recruiterContent.style.minWidth = "0";
        return () => {
          recruiterContent.style.minWidth = previousMinWidth;
        };
      }
      contentItem = flexContainer;
    }
    return undefined;
  }, []);

  const openConfirm  = (type, id) => setConfirm({ type, id });
  const closeConfirm = () => setConfirm(null);

  const handleConfirm = async () => {
    if (!confirm) return;
    setActionPending(true);
    const { type, id } = confirm;
    if (type === "deactivate") await dispatch(adminDeactivateRecruiterAction(id));
    if (type === "verify")     await dispatch(adminVerifyRecruiterAction(id, "verified"));
    if (type === "reject")     await dispatch(adminVerifyRecruiterAction(id, "rejected"));
    if (type === "delete")     await dispatch(adminDeleteRecruiterAction(id));
    setActionPending(false);
    closeConfirm();
  };

  const columns = [
    { field: "firstName",  headerName: "First",   width: 120,
      valueGetter: (p) => display(p.row.firstName) },
    { field: "lastName",   headerName: "Last",    width: 120,
      valueGetter: (p) => display(p.row.lastName) },
    { field: "email",      headerName: "Email",   width: 210,
      valueGetter: (p) => display(p.row.email) },
    { field: "phoneNumber", headerName: "Phone",  width: 140,
      valueGetter: (p) => display(p.row.phoneNumber) },
    { field: "companyName", headerName: "Company", width: 160,
      valueGetter: (p) => display(p.row.companyName) },
    {
      field: "companyWebsite",
      headerName: "Website",
      width: 170,
      renderCell: (p) => {
        const val = p.row.companyWebsite;
        if (!val?.trim()) return <Typography variant="body2" color="text.secondary">—</Typography>;
        const href = val.startsWith("http") ? val : `https://${val}`;
        return (
          <Tooltip title={val}>
            <Link href={href} target="_blank" rel="noopener noreferrer" underline="hover" variant="body2">
              {val}
            </Link>
          </Tooltip>
        );
      },
    },
    { field: "jobCount", headerName: "Jobs", width: 80, type: "number" },
    {
      field: "isActive",
      headerName: "Account",
      width: 130,
      renderCell: (p) => <ActiveChip isActive={p.row.isActive} />,
    },
    {
      field: "verificationStatus",
      headerName: "Verification",
      width: 130,
      renderCell: (p) => <VerifyChip status={p.row.verificationStatus} />,
    },
    {
      field: "createdAt",
      headerName: "Registered",
      width: 160,
      renderCell: (p) => moment(p.row.createdAt).format("YYYY-MM-DD"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 480,
      minWidth: 480,
      sortable: false,
      renderCell: (p) => {
        const isVerified    = p.row.verificationStatus === "verified";
        const isRejected    = p.row.verificationStatus === "rejected";
        return (
          <ButtonGroup size="small" variant="outlined">
            {/* Verify */}
            <Tooltip title={isVerified ? "Already verified" : "Mark as Verified"}>
              <span>
                <Button
                  color="success"
                  startIcon={<VerifiedIcon />}
                  disabled={isVerified || actionPending || !!statusPending}
                  onClick={() => openConfirm("verify", p.row._id)}
                >
                  Verify
                </Button>
              </span>
            </Tooltip>

            {/* Reject */}
            <Tooltip title={isRejected ? "Already rejected" : "Reject recruiter"}>
              <span>
                <Button
                  color="error"
                  startIcon={<CancelIcon />}
                  disabled={isRejected || actionPending || !!statusPending}
                  onClick={() => openConfirm("reject", p.row._id)}
                >
                  Reject
                </Button>
              </span>
            </Tooltip>

            <Button
              color="error"
              startIcon={<DeleteIcon />}
              disabled={actionPending || !!statusPending}
              onClick={() => openConfirm("delete", p.row._id)}
            >
              Delete
            </Button>
              <Button
                color="warning"
                startIcon={<PauseCircleIcon />}
                disabled={actionPending || !!statusPending}
                onClick={() => openConfirm("deactivate", p.row._id)}
              >
                Deactivate
              </Button>
          </ButtonGroup>
        );
      },
    },
  ];

  const cfg = confirm ? CONFIRM_TYPES[confirm.type] : null;

  return (
    <Box display="flex" justifyContent="center" mt={3}>
      <Box width="98%">
        <Typography variant="h4" sx={{ color: "black", pb: 3 }}>
          Recruiter Management
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ bgcolor: "secondary.midNightBlue" }}>
          <Box ref={gridWrapperRef} sx={{ height: 600, width: "100%", minWidth: 0 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                getRowId={(row) => row._id}
                rows={recruiters}
                columns={columns}
                slots={{ toolbar: GridToolbar }}
                checkboxSelection
                disableColumnVirtualization
                initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
                pageSizeOptions={[10, 25]}
                density="comfortable"
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

      {/* Confirmation dialog */}
      <Dialog open={Boolean(confirm)} onClose={closeConfirm}>
        <DialogTitle>{cfg?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{cfg?.body}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} disabled={actionPending}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            color={cfg?.color || "primary"}
            variant="contained"
            disabled={actionPending}
          >
            {actionPending ? "Working…" : cfg?.action}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminRecruiters;
