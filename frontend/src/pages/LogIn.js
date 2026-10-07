import { Avatar, Box, Button, TextField } from "@mui/material";
import React, { useEffect } from "react";
import Footer from "../component/Footer";
import LockClockOutlined from "@mui/icons-material/LockClockOutlined";
import Navbar from "../component/Navbar";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { userSignInAction } from "../redux/actions/userAction";
import { Link, useNavigate } from "react-router-dom";

const validationSchema = yup.object({
  email: yup
    .string("Enter your email")
    .email("Enter a valid email")
    .required("Email is required"),
  password: yup
    .string("Enter your password")
    .min(6, "Password should be of minimum 6 characters length")
    .required("Password is required"),
});

const LogIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, userInfo } = useSelector((state) => state.signIn);

  const extractUsername = (email) => {
    const atIndex = email.indexOf("@");
    if (atIndex !== -1) {
      const username = email.substring(0, atIndex);
      return username;
    }
    return null;
  };
  useEffect(() => {
    if (isAuthenticated) {
      const role = Number(userInfo?.role?.role ?? userInfo?.role ?? 0);
      if (role === 2) {
        navigate("/mainadmin");
      }
      if (role === 1) {
        navigate("/recruiter/dashboard");
      }
      if (role === 0) {
        navigate("/");
      }
    }
  }, [isAuthenticated, navigate, userInfo]);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values, actions) => {
      dispatch(userSignInAction(values));
      actions.resetForm();
    },
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Navbar />
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
              mb: -3,
              mt: -2,
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "primary.main", mb: 3 }}>
              <LockClockOutlined />
            </Avatar>
            <TextField
              sx={{ mb: 3 }}
              fullWidth
              id="email"
              label="E-mail"
              name="email"
              InputLabelProps={{
                shrink: true,
              }}
              placeholder="E-mail"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField
              sx={{ mb: 3 }}
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              InputLabelProps={{
                shrink: true,
              }}
              placeholder="Password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />
            <div
              style={{
                marginTop: -10,
                marginBottom: 12,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Link
                to={"/user/ResetPassword"}
                style={{ color: "#2196f3", textDecoration: "none" }}
              >
                Forgot Password?
              </Link>
            </div>
            <Button fullWidth variant="contained" type="submit">
              Log In
            </Button>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="container signin">
                <p>
                  Don't have an account?{" "}
                  <Link
                    to={"/register"}
                    style={{ color: "#2196f3", textDecoration: "none" }}
                  >
                    Register
                  </Link>
                </p>
              </div>
            </div>
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default LogIn;
