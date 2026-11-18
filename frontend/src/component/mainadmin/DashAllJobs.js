import React, { useEffect, useState, useCallback } from "react";
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
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon      from "@mui/icons-material/Delete";
import RestoreIcon     from "@mui/icons-material/Restore";
import ToggleOnIcon    from "@mui/icons-material/ToggleOn";
import ToggleOffIcon   from "@mui/icons-material/ToggleOff";
import { DataGrid, GridToolbar, gridClasses } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import {
  adminToggleJobAction,
  adminDeleteJobAction,
  adminLoadJobsAction,
  adminLoadDeletedJobsAction,
  adminRestoreJobAction,
} from "../../redux/actions/userAction";

// ── tab panel helper ──────────────────────────────────────────────────────────
const TabPanel = ({ children, value, index }) =>
  value === index ? <Box>{children}</Box> : null;

// ── component ─────────────────────────────────────────────────────────────────
const DashAllJobs = () => {
  const dispatch = useDispatch();

  // Active jobs slice
  const { jobs: activeJobs = [], loading: activeLoading, error: activeError } =
    useSelector((s) => s.adminJobs);

  // Deleted jobs slice
  const { jobs: deletedJobs = [], loading: deletedLoading, error: deletedError } =
    useSelector((s) => s.adminDeletedJobs);

  const { loading: toggling } = useSelector((s) => s.adminToggleJob);
  const { loading: deleting } = useSelector((s) => s.adminDeleteJob);
  const { loading: restoring } = useSelector((s) => s.adminRestoreJob);

  const [tab, setTab] = useState(0); // 0 = active, 1 = deleted

  // Dialog state
  const [confirmDelete,  setConfirmDelete]  = useState(null); // job._id
  const [confirmRestore, setConfirmRestore] = useState(null); // { id, title }

  // Load the appropriate list when tab changes
  const refreshActive  = useCallback(() => dispatch(adminLoadJobsAction()),        [dispatch]);
  const refreshDeleted = useCallback(() => dispatch(adminLoadDeletedJobsAction()), [dispatch]);

  useEffect(() => {
    refreshActive();
  }, [refreshActive]);

  useEffect(() => {
    if (tab === 1) refreshDeleted();
  }, [tab, refreshDeleted]);

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    await dispatch(adminToggleJobAction(id));
    refreshActive();
  };

  const handleDeleteConfirm = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    if (!id) return;
    await dispatch(adminDeleteJobAction(id));
    // Remove from active list, refresh deleted list if it's visible
    refreshActive();
    if (tab === 1) refreshDeleted();
  };

  const handleRestoreConfirm = async () => {
    const { id } = confirmRestore || {};
    setConfirmRestore(null);
    if (!id) return;
    await dispatch(adminRestoreJobAction(id));
    // The reducer already removes it from the deleted list optimistically;
    // also refresh active so it appears there immediately
    refreshActive();
  };

  // ── Active jobs columns ──────────────────────────────────────────────────────
  const activeColumns = [
    { field: "_id",   headerName: "Job ID",  width: 220 },
    { field: "title", headerName: "Title",   width: 200 },
    {
      field: "user",
      headerName: "Recruiter",
      width: 160,
      valueGetter: (p) => {
        const u = p.row?.user;
        return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || "—" : "—";
      },
    },
    {
      field: "available",
      headerName: "Status",
      width: 130,
      renderCell: (p) =>
        p.row.available ? (
          <Chip label="Available"   color="success" size="small" />
        ) : (
          <Chip label="Unavailable" color="default" size="small" />
        ),
    },
    {
      field: "salary",
      headerName: "Salary",
      width: 110,
      renderCell: (p) => `$${p.row.salary}`,
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 170,
      renderCell: (p) => moment(p.row.createdAt).format("YYYY-MM-DD HH:mm"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 240,
      sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title={p.row.available ? "Disable (keep listed)" : "Enable listing"}>
            <Button
              variant="outlined"
              size="small"
              disabled={!!toggling}
              startIcon={p.row.available ? <ToggleOffIcon /> : <ToggleOnIcon />}
              onClick={() => handleToggle(p.row._id)}
            >
              {p.row.available ? "Disable" : "Enable"}
            </Button>
          </Tooltip>
          <Tooltip title="Soft-delete (preserves history)">
            <Button
              variant="contained"
              size="small"
              color="error"
              disabled={!!deleting}
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDelete(p.row._id)}
              sx={{ bgcolor: "#e7c5c5", color: "red", "&:hover": { bgcolor: "#dd8181" } }}
            >
              Delete
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // ── Deleted jobs columns ─────────────────────────────────────────────────────
  const deletedColumns = [
    { field: "_id",   headerName: "Job ID",  width: 220 },
    { field: "title", headerName: "Title",   width: 200 },
    {
      field: "companyName",
      headerName: "Company",
      width: 170,
      valueGetter: (p) => p.row.companyName || "—",
    },
    {
      field: "user",
      headerName: "Recruiter",
      width: 160,
      valueGetter: (p) => {
        const u = p.row?.user;
        return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || "—" : "—";
      },
    },
    {
      field: "updatedAt",
      headerName: "Deleted At",
      width: 170,
      renderCell: (p) =>
        p.row.updatedAt
          ? moment(p.row.updatedAt).format("YYYY-MM-DD HH:mm")
          : "—",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      sortable: false,
      renderCell: (p) => (
        <Tooltip title="Restore job (makes it active again if recruiter is active)">
          <Button
            variant="outlined"
            size="small"
            color="success"
            disabled={!!restoring}
            startIcon={<RestoreIcon />}
            onClick={() =>
              setConfirmRestore({ id: p.row._id, title: p.row.title })
            }
          >
            Restore
          </Button>
        </Tooltip>
      ),
    },
  ];

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <Box display="flex" justifyContent="center" mt={3}>
      <Box width="95%">
        <Typography variant="h4" sx={{ color: "black", pb: 2 }}>
          Jobs Management
        </Typography>

        {/* Tab switcher */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Active Jobs
                {!activeLoading && (
                  <Chip
                    label={activeJobs.length}
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Deleted Jobs
                {!deletedLoading && tab === 1 && (
                  <Chip
                    label={deletedJobs.length}
                    size="small"
                    color="error"
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>

        {/* ── Active Jobs tab ────────────────────────────────────────────── */}
        <TabPanel value={tab} index={0}>
          {activeError && (
            <Alert severity="error" sx={{ mb: 2 }}>{activeError}</Alert>
          )}
          <Paper sx={{ bgcolor: "secondary.midNightBlue" }}>
            <Box sx={{ height: 540, width: "100%" }}>
              {activeLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <DataGrid
                  getRowId={(row) => row._id}
                  rows={activeJobs}
                  columns={activeColumns}
                  slots={{ toolbar: GridToolbar }}
                  checkboxSelection
                  initialState={{
                    pagination: { paginationModel: { page: 0, pageSize: 10 } },
                  }}
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
        </TabPanel>

        {/* ── Deleted Jobs tab ───────────────────────────────────────────── */}
        <TabPanel value={tab} index={1}>
          {deletedError && (
            <Alert severity="error" sx={{ mb: 2 }}>{deletedError}</Alert>
          )}
          {deletedJobs.length === 0 && !deletedLoading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No deleted jobs found.
            </Alert>
          )}
          <Paper sx={{ bgcolor: "secondary.midNightBlue" }}>
            <Box sx={{ height: 540, width: "100%" }}>
              {deletedLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <DataGrid
                  getRowId={(row) => row._id}
                  rows={deletedJobs}
                  columns={deletedColumns}
                  slots={{ toolbar: GridToolbar }}
                  initialState={{
                    pagination: { paginationModel: { page: 0, pageSize: 10 } },
                  }}
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
        </TabPanel>
      </Box>

      {/* ── Confirm soft-delete dialog ────────────────────────────────────── */}
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will soft-delete the job. It will no longer appear in public
            searches, the homepage, or company openings. Existing applications
            and hiring history are preserved. The job can be restored later.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={!!deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirm restore dialog ────────────────────────────────────────── */}
      <Dialog open={Boolean(confirmRestore)} onClose={() => setConfirmRestore(null)}>
        <DialogTitle>Restore Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Restore{" "}
            <strong>&quot;{confirmRestore?.title}&quot;</strong>? The job will
            become visible again, provided the recruiter&apos;s account is
            active. If the recruiter is deactivated, this will fail.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRestore(null)}>Cancel</Button>
          <Button
            onClick={handleRestoreConfirm}
            color="success"
            variant="contained"
            disabled={!!restoring}
          >
            {restoring ? "Restoring…" : "Restore"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashAllJobs;
