import { Box, Typography } from "@mui/material";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useFormik } from "formik";
import * as yup from "yup";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const validationSchema = yup.object({
  email: yup
    .string("Enter your email")
    .email("Enter a valid email address")
    .required("Email address is required"),
});

const ResetPassword = () => {
  const [email, setEmail] = useState({});

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values, actions) => {
      setEmail({ email: values.email });
      actions.resetForm();
    },
  });

  useEffect(() => {
    if (Object.keys(email).length === 0) return;

    axios
      .post("/api/forgetpassword", email)
      .then(() => {
        toast.success("Password reset link sent! Please check your email.");
      })
      .catch((err) => {
        // Extract a readable message from the API response.
        // The backend returns { error: "..." } — fall back gracefully
        // if the response shape is unexpected.
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          (typeof err.message === "string" ? err.message : null) ||
          "Something went wrong. Please try again.";
        toast.error(msg);
      });
  }, [email]);

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
            Reset Password
          </Typography>

          <TextField
            sx={{ mb: 3 }}
            fullWidth
            id="email"
            label="Enter your email address"
            name="email"
            type="email"
            InputLabelProps={{ shrink: true }}
            placeholder="name@example.com"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />

          <Button fullWidth variant="contained" type="submit">
            Send Reset Link
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ResetPassword;
