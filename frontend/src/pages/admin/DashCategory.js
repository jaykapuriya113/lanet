import React, { useEffect } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { DataGrid, gridClasses, GridToolbar } from "@mui/x-data-grid";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { useDispatch, useSelector } from "react-redux";
import {
  adminJobTypeLoadAction,
  deleteJobTypeAction,
} from "../../redux/actions/jobTypeAction";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import UpdateJobType from "./data/AdminEditCategory";

const DashCategory = () => {
  const dispatch = useDispatch();
  const [render, setRender] = React.useState(false);
  const renderHandler = () => {
    setRender(!render);
  };
  // useEffect(() => {
  //   dispatch(jobTypeLoadAction());
  // }, []);

  // const { jobType, loading } = useSelector((state) => state.jobTypeAll);

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    const user = JSON.parse(userInfo);
    const id = user.role._id;
    dispatch(adminJobTypeLoadAction(id));
  }, []);

  const { jobType, loading } = useSelector((state) => state.jobType);
  let data = [];
  let jobsT;
  if (jobType) {
    jobsT = jobType.jobs;
  }
  data = jobsT !== undefined && jobsT.length > 0 ? jobsT : [];

  //delete job by Id
  const deleteJobCategoryById = (e, id) => {
    dispatch(deleteJobTypeAction(id));
    window.location.reload();
  };

  const columns = [
    {
      field: "_id",
      headerName: "Category ID",
      width: 300,
    },
    {
      field: "jobTypeName",
      headerName: "Category",
      width: 200,
    },
    {
      field: "createdAt",
      headerName: "Create At",
      width: 200,
      renderCell: (params) =>
        moment(params.row.createdAt).format("YYYY-MM-DD HH:MM:SS"),
    },

    {
      field: "Actions",
      width: 250,
      renderCell: (values) => (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100px",
            gap: 2,
          }}
        >
          <UpdateJobType jobData={values.row} renderHandler={renderHandler} />
          <Button
            onClick={(e) => deleteJobCategoryById(e, values.row._id)}
            variant="contained"
            color="error"
            sx={{
              bgcolor: "#e7c5c5",
              "&:hover": {
                bgcolor: "#dd8181",
              },
            }}
          >
            <div style={{ color: "red" }}>Delete</div>
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box display="flex" justifyContent="center" mt={3}>
      <Box width="75%">
        <Typography
          variant="h4"
          sx={{
            color: "black",
            pb: -3,
            display: "flex",
            justifyContent: "left",
          }}
        >
          All category
        </Typography>
        <Box sx={{ pb: 2, display: "flex", justifyContent: "right" }}>
          <Button variant="contained" color="success" startIcon={<AddIcon />}>
            <Link
              style={{ color: "white", textDecoration: "none" }}
              to="/recruiter/category/create"
            >
              Create category
            </Link>
          </Button>
        </Box>
        <Box sx={{ pb: 0, display: "flex", justifyContent: "center" }}></Box>
        <Paper sx={{ bgcolor: "secondary.midNightBlue" }}>
          <Box sx={{ height: 500, width: "100%" }}>
            <DataGrid
              getRowId={(row) => row._id}
              sx={{
                "& .MuiTablePagination-displayedRows": {
                  color: "black",
                },
                color: "black",
                [`& .${gridClasses.row}`]: {},
                button: {
                  color: "black",
                },
              }}
              rows={data}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              checkboxSelection
              slots={{ toolbar: GridToolbar }}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 },
                },
              }}
              pageSizeOptions={[5, 10]}
              density="comfortable"
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
export default DashCategory;
