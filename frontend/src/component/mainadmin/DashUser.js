import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid, GridToolbar, gridClasses } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import {
  adminLoadUsersAction,
  adminDeactivateUserAction,
  adminReactivateUserAction,
  adminSafeDeleteUserAction,
} from "../../redux/actions/userAction";

// ── helpers ───────────────────────────────────────────────────────────────────
const StatusChip = ({ isActive }) =>
  isActive === false ? (
    <Chip label="Deactivated" color="error" size="small" variant="outlined" />
  ) : (
    <Chip label="Active" color="success" size="small" variant="outlined" />
  );

const CONFIRM_TYPES = {
  deactivate: {
    title: "Deactivate User",
    body: "The user will lose login access immediately. Their applications and history are preserved. Continue?",
    action: "Deactivate",
    color: "warning",
  },
  reactivate: {
    title: "Reactivate User",
    body: "The user will regain login access. Continue?",
    action: "Reactivate",
    color: "success",
  },
  delete: {
    title: "Delete User",
    body: "This permanently soft-deletes the account. The user cannot log in and will not appear in lists. Application history is preserved. This cannot be undone.",
    action: "Delete",
    color: "error",
  },
};

// ── component ─────────────────────────────────────────────────────────────────
const DashAllUsers = () => {
  const dispatch = useDispatch();
  const { loading, users = [], error } = useSelector((s) => s.adminUsers);

  const [confirm, setConfirm] = useState(null); // { type, id }
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    dispatch(adminLoadUsersAction());
  }, [dispatch]);

  const openConfirm = (type, id) => setConfirm({ type, id });
  const closeConfirm = () => setConfirm(null);

  const handleConfirm = async () => {
    if (!confirm) return;
    setActionPending(true);
    const { type, id } = confirm;
    if (type === "deactivate")  await dispatch(adminDeactivateUserAction(id));
    if (type === "reactivate")  await dispatch(adminReactivateUserAction(id));
    if (type === "delete")      await dispatch(adminSafeDeleteUserAction(id));
    setActionPending(false);
    closeConfirm();
  };

  const columns = [
    { field: "_id",       headerName: "User ID",       width: 220 },
    { field: "firstName", headerName: "First Name",    width: 130 },
    { field: "lastName",  headerName: "Last Name",     width: 130 },
    { field: "email",     headerName: "Email",         width: 220 },
    {
      field: "isActive",
      headerName: "Status",
      width: 130,
      renderCell: (p) => <StatusChip isActive={p.row.isActive} />,
    },
    {
      field: "createdAt",
      headerName: "Registered",
      width: 180,
      renderCell: (p) => moment(p.row.createdAt).format("YYYY-MM-DD HH:mm"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 280,
      sortable: false,
      renderCell: (p) => {
        const isDeactivated = p.row.isActive === false;
        return (
          <Stack direction="row" spacing={0.5}>
            {isDeactivated ? (
              <Button
                size="small" variant="outlined" color="success"
                onClick={() => openConfirm("reactivate", p.row._id)}
              >
                Reactivate
              </Button>
            ) : (
              <Button
                size="small" variant="outlined" color="warning"
                onClick={() => openConfirm("deactivate", p.row._id)}
              >
                Deactivate
              </Button>
            )}
            <Button
              size="small" variant="contained" color="error"
              onClick={() => openConfirm("delete", p.row._id)}
              sx={{ bgcolor: "#e7c5c5", color: "red", "&:hover": { bgcolor: "#dd8181" } }}
            >
              Delete
            </Button>
          </Stack>
        );
      },
    },
  ];

  const cfg = confirm ? CONFIRM_TYPES[confirm.type] : null;

  return (
    <Box display="flex" justifyContent="center" mt={3}>
      <Box width="95%">
        <Typography variant="h4" sx={{ color: "black", pb: 3 }}>
          User Management
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ bgcolor: "secondary.midNightBlue" }}>
          <Box sx={{ height: 560, width: "100%" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                getRowId={(row) => row._id}
                rows={users}
                columns={columns}
                slots={{ toolbar: GridToolbar }}
                checkboxSelection
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

export default DashAllUsers;
