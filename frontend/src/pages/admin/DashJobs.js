import React, { useEffect } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { DataGrid, gridClasses, GridToolbar } from "@mui/x-data-grid";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { useDispatch, useSelector } from "react-redux";
import {
  adminLoadAction,
  deleteAjobAction,
} from "../../redux/actions/jobAction";
import DeleteIcon from "@mui/icons-material/Delete";
import UpdateJob from "./data/UpdateAdminData";

const DashJobs = () => {
  const dispatch = useDispatch();
  const [render, setRender] = React.useState(false);

  const renderHandler = () => {
    setRender(!render);
  };

  const { jobs } = useSelector((state) => state.adminCreateJob);
  const { loadJobs } = useSelector((state) => state.general);

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    const user = JSON.parse(userInfo);
    const id = user.role._id;
    dispatch(adminLoadAction(id));
  }, [loadJobs]);

  let data = [];
  data = jobs !== undefined && jobs.length > 0 ? jobs : [];

  //delete job by Id
  const deleteJobById = (e, id) => {
    console.log();
    dispatch(deleteAjobAction(id));
    window.location.reload();
  };

  const columns = [
    // {
    //   field: "_id",
    //   headerName: "Job ID",
    //   width: 150,
    //   editable: true,
    // },
    {
      field: "title",
      headerName: "Job name",
      width: 150,
    },
    // {
    //   field: "jobType",
    //   headerName: "Category",
    //   width: 150,
    //   valueGetter: (data) => data.row.jobType.jobTypeName,
    // },
    // {
    //   field: "user",
    //   headerName: "User",
    //   width: 150,
    //   valueGetter: (data) => data.row.user.firstName,
    // },
    {
      field: "available",
      headerName: "available",
      width: 150,
      renderCell: (values) => (values.row.available ? "Yes" : "No"),
    },

    {
      field: "salary",
      headerName: "Salary",
      type: Number,
      width: 150,
      renderCell: (values) => "$" + values.row.salary,
    },

    {
      field: "Actions",
      width: 200,
      renderCell: (values) => (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100px",
          }}
        >
          <UpdateJob jobData={values.row} renderHandler={renderHandler} />
          <DeleteIcon
            onClick={(e) => deleteJobById(e, values.row._id)}
            variant="contained"
            color="error"
          >
            Delete
          </DeleteIcon>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ color: "white", pb: 3 }}>
        Jobs list
      </Typography>
      <Box sx={{ pb: 2, display: "flex", justifyContent: "right" }}>
        <Button variant="contained" color="success" startIcon={<AddIcon />}>
          {" "}
          <Link
            style={{ color: "white", textDecoration: "none" }}
            to="/admin/job/create"
          >
            Create Job
          </Link>
        </Button>
      </Box>
      <Paper sx={{ bgcolor: "secondary.midNightBlue" }}>
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            getRowId={(row) => row._id}
            sx={{
              "& .MuiTablePagination-displayedRows": {
                color: "white",
              },
              color: "black",
              [`& .${gridClasses.row}`]: {},
              button: {
                color: "black",
              },
            }}
            rows={data}
            columns={columns}
            pageSize={3}
            rowsPerPageOptions={[3]}
            checkboxSelection
            slots={{ toolbar: GridToolbar }}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 3 },
              },
            }}
            pageSizeOptions={[5, 10]}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default DashJobs;
