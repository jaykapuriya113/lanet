import React, { useEffect } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { DataGrid, gridClasses, GridToolbar } from "@mui/x-data-grid";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { useDispatch, useSelector } from "react-redux";
import {
  jobTypeLoadAction,
  deleteJobTypeAction,
} from "../../redux/actions/jobTypeAction";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";

const DashAllCategory = () => {
  const dispatch = useDispatch();

  // Load ALL categories (no owner filter) — this endpoint is public and returns
  // every category in the database, which is correct for the main admin view.
  useEffect(() => {
    dispatch(jobTypeLoadAction());
  }, [dispatch]);

  // jobTypeAll reducer stores the array under jobType (set from payload.jobT)
  const { jobType = [], loading } = useSelector((state) => state.jobTypeAll);

  const deleteJobCategoryById = (e, id) => {
    dispatch(deleteJobTypeAction(id));
    window.location.reload();
  };

  const columns = [
    {
      field: "_id",
      headerName: "Category ID",
      width: 220,
    },
    {
      field: "jobTypeName",
      headerName: "Category",
      width: 180,
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
      renderCell: (params) =>
        moment(params.row.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      field: "Actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (values) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <DeleteIcon
            onClick={(e) => deleteJobCategoryById(e, values.row._id)}
            sx={{ cursor: "pointer", color: "error.main" }}
          />
        </Box>
      ),
    },
  ];

  return (
    <Box display="flex" justifyContent="center" mt={3}>
      <Box width="75%">
        <Typography variant="h4" sx={{ color: "black", pb: 3 }}>
          All Categories
        </Typography>

        <Box sx={{ pb: 1, display: "flex", justifyContent: "right" }}>
          <Button variant="contained" color="success" startIcon={<AddIcon />}>
            <Link
              style={{ color: "white", textDecoration: "none" }}
              to="/recruiter/category/create"
            >
              Create Category
            </Link>
          </Button>
        </Box>

        <Paper sx={{ bgcolor: "secondary.midNightBlue" }}>
          <Box sx={{ height: 450, width: "100%" }}>
            <DataGrid
              getRowId={(row) => row._id}
              loading={loading}
              sx={{
                "& .MuiTablePagination-displayedRows": { color: "black" },
                color: "black",
                [`& .${gridClasses.row}`]: {},
                button: { color: "black" },
              }}
              rows={Array.isArray(jobType) ? jobType : []}
              columns={columns}
              slots={{ toolbar: GridToolbar }}
              initialState={{
                pagination: { paginationModel: { page: 0, pageSize: 10 } },
              }}
              pageSizeOptions={[10, 25]}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default DashAllCategory;
