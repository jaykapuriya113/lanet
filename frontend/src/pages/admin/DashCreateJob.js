import { Box, MenuItem, Typography } from "@mui/material";
import React, { useEffect } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { jobTypeLoadAction } from "../../redux/actions/jobTypeAction";
import { registerAjobAction } from "../../redux/actions/jobAction";
import { useNavigate } from "react-router-dom";

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const validationSchema = yup.object({
  title: yup.string("Enter a job title").required("title is required"),
  companyName: yup
    .string("Enter a companyName")
    .required("companyName is required"),
  description: yup
    .string("Enter a description")
    .min(6, "Description should be of minimum 6 characters length")
    .required("Description is required"),
  salary: yup.number("Enter a salary").required("Salary is required"),
  location: yup.string("Enter a location").required("Location is required"),
  jobType: yup.string("Enter a Category").required("Category is required"),
  applicationDeadline: yup
    .string()
    .required("Application Deadline is required")
    .test(
      "valid-application-deadline",
      "Enter a valid Application Deadline",
      (value) => Boolean(value && isValidDate(value)),
    )
    .test(
      "future-application-deadline",
      "Application Deadline cannot be in the past",
      (value) => !value || value >= getTodayDate(),
    ),
});

const DashCreateJob = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { jobType } = useSelector((state) => state.jobTypeAll);

  useEffect(() => {
    dispatch(jobTypeLoadAction());
  }, [dispatch]);

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      companyName: "",
      salary: "",
      location: "",
      jobType: "",
      applicationDeadline: "",
      AdditionalInformation: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const createdJob = await dispatch(registerAjobAction(values));
      if (!createdJob) return;

      navigate("/recruiter/jobs");
      window.location.reload();
    },
  });

  const fieldProps = (name) => ({
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && Boolean(formik.errors[name]),
    helperText: formik.touched[name] && formik.errors[name],
  });

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pt: 4,
      }}
    >
      <Box
        onSubmit={formik.handleSubmit}
        component="form"
        noValidate
        className="form_style border-style"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Typography variant="h5" component="h2" sx={{ pb: 3 }}>
            Register a Job
          </Typography>
          <TextField
            sx={{ mb: 3 }}
            fullWidth
            id="applicationDeadline"
            label="Application Deadline"
            type="date"
            required
            inputProps={{ min: getTodayDate() }}
            InputLabelProps={{ shrink: true }}
            {...fieldProps("applicationDeadline")}
          />
          <TextField
            sx={{ mb: 3 }}
            fullWidth
            id="title"
            label="Title"
            placeholder="Title"
            InputLabelProps={{ shrink: true }}
            {...fieldProps("title")}
          />
          <TextField
            sx={{ mb: 3 }}
            fullWidth
            id="description"
            label="Description"
            placeholder="Description"
            InputLabelProps={{ shrink: true }}
            {...fieldProps("description")}
          />
          <TextField
            sx={{ mb: 3 }}
            fullWidth
            id="AdditionalInformation"
            label="AdditionalInformation"
            placeholder="AdditionalInformation"
            InputLabelProps={{ shrink: true }}
            {...fieldProps("AdditionalInformation")}
          />
          <TextField
            sx={{ mb: 3 }}
            fullWidth
            id="companyName"
            label="companyName"
            placeholder="Company name"
            InputLabelProps={{ shrink: true }}
            {...fieldProps("companyName")}
          />
          <TextField
            sx={{ mb: 3 }}
            fullWidth
            id="salary"
            label="Salary"
            placeholder="Salary"
            InputLabelProps={{ shrink: true }}
            {...fieldProps("salary")}
          />
          <TextField
            sx={{ mb: 3 }}
            fullWidth
            id="location"
            label="Location"
            placeholder="Location"
            InputLabelProps={{ shrink: true }}
            {...fieldProps("location")}
          />
          <TextField
            sx={{ mb: 3 }}
            fullWidth
            id="jobType"
            label="Category"
            select
            {...fieldProps("jobType")}
          >
            <MenuItem value="">Select a category</MenuItem>
            {jobType?.map((category) => (
              <MenuItem key={category._id} value={category._id}>
                {category.jobTypeName}
              </MenuItem>
            ))}
          </TextField>
          <Button fullWidth variant="contained" type="submit">
            Create job
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DashCreateJob;
