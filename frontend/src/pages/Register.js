import { Avatar, Box, CircularProgress } from "@mui/material";
import Footer from "../component/Footer";
import Navbar from "../component/Navbar";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { userSignUpAction } from "../redux/actions/userAction";
import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const validationSchema = yup.object().shape({
  profilePhoto: yup.string().required("Profile photo is required"),
  role: yup.string().required("Role is required"),
  resume: yup.string().when("role", ([role], schema) => {
    return role === "0" ? schema.required("Resume is required") : schema;
  }),
  firstName: yup
    .string()
    .min(3, "First Name should be of minimum 3 characters length")
    .required("First Name is required"),
  lastName: yup
    .string()
    .min(3, "Last Name should be of minimum 3 characters length")
    .required("Last Name is required"),
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [images, setImages] = useState();
  const [role, setRole] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const formik = useFormik({
    initialValues: {
      profilePhoto: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      resume: "",
      role: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values, actions) => {
      const finalValues = { ...values };

      dispatch(userSignUpAction(finalValues));
      navigate("/login");
      actions.resetForm();
    },
  });

  const handleRoleChange = (event) => {
    setRole(event.target.value);
    formik.setFieldValue("role", event.target.value);
  };

  const uploadFileToServer = async (file) => {
    if (!file) {
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const photoupload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert("Please upload an image first!");
      return;
    }

    setProfileLoading(true);
    setIsUploading(true);
    const upload = await uploadFileToServer(file);
    if (upload?.url) {
      formik.setFieldValue("profilePhoto", upload.url);
      setImages(upload.url);
    } else {
      formik.setFieldError(
        "profilePhoto",
        "Profile photo upload failed. Start the backend and try again.",
      );
    }
    setProfileLoading(false);
    setIsUploading(false);
  };

  const resumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert("Please upload a resume file first!");
      return;
    }

    setResumeLoading(true);
    setIsUploading(true);
    const upload = await uploadFileToServer(file);
    if (upload?.url) {
      formik.setFieldValue("resume", upload.url);
    } else {
      formik.setFieldError(
        "resume",
        "Resume upload failed. Start the backend and try again.",
      );
    }
    setResumeLoading(false);
    setIsUploading(false);
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          height: "81vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "primary.white",
          flexDirection: "column",
          minHeight: "84vh",
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
              mt: -2,
              mb: -3,
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "primary.main", mb: 1 }}>
              <LockOpenIcon />
            </Avatar>
            <div style={{ marginBottom: 1 }}> Register as</div>
            <div style={{ marginBottom: 10 }}>
              <div>
                <input
                  type="radio"
                  name="role"
                  value="0"
                  checked={role === "0"}
                  onChange={handleRoleChange}
                  required
                />
                User
                <input
                  type="radio"
                  name="role"
                  value="1"
                  checked={role === "1"}
                  onChange={handleRoleChange}
                  required
                />
                Recruiter
                {formik.touched.role && formik.errors.role && (
                  <div style={{ color: "red", marginTop: 8 }}>
                    {formik.errors.role}
                  </div>
                )}
              </div>
            </div>
            <TextField
              sx={{
                mb: 3,
                "& .MuiInputBase-root": {
                  color: "text.secondary",
                },
                fieldset: { borderColor: "rgb(231, 235, 240)" },
              }}
              fullWidth
              id="profilePhoto"
              label="profilePhoto"
              name="profilePhoto"
              type="file"
              InputLabelProps={{
                shrink: true,
              }}
              placeholder="profile Photo"
              onChange={photoupload}
              onBlur={formik.handleBlur}
              error={
                formik.touched.profilePhoto &&
                Boolean(formik.errors.profilePhoto)
              }
              helperText={
                formik.touched.profilePhoto && formik.errors.profilePhoto
              }
            />
            <TextField
              sx={{
                mb: 3,
                "& .MuiInputBase-root": {
                  color: "text.secondary",
                },
                fieldset: { borderColor: "rgb(231, 235, 240)" },
              }}
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              InputLabelProps={{
                shrink: true,
              }}
              placeholder="First Name"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.firstName && Boolean(formik.errors.firstName)
              }
              helperText={formik.touched.firstName && formik.errors.firstName}
            />
            <TextField
              sx={{
                mb: 3,
                "& .MuiInputBase-root": {
                  color: "text.secondary",
                },
                fieldset: { borderColor: "rgb(231, 235, 240)" },
              }}
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              InputLabelProps={{
                shrink: true,
              }}
              placeholder="Last Name"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.lastName && Boolean(formik.errors.lastName)}
              helperText={formik.touched.lastName && formik.errors.lastName}
            />
            <TextField
              sx={{
                mb: 3,
                "& .MuiInputBase-root": {
                  color: "text.secondary",
                },
                fieldset: { borderColor: "rgb(231, 235, 240)" },
              }}
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
              sx={{
                mb: 3,
                "& .MuiInputBase-root": {
                  color: "text.secondary",
                },
                fieldset: { borderColor: "rgb(231, 235, 240)" },
              }}
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
            {role === "0" && (
              <>
                <TextField
                  sx={{
                    mb: 3,
                    "& .MuiInputBase-root": {
                      color: "text.secondary",
                    },
                    fieldset: { borderColor: "rgb(231, 235, 240)" },
                  }}
                  fullWidth
                  id="resume"
                  name="resume"
                  label="Resume"
                  type="file"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  placeholder="Resume"
                  onChange={resumeUpload}
                  onBlur={formik.handleBlur}
                  error={formik.touched.resume && Boolean(formik.errors.resume)}
                  helperText={formik.touched.resume && formik.errors.resume}
                />
                {resumeLoading && <CircularProgress />}{" "}
              </>
            )}
            <Button
              type="submit"
              disabled={isUploading || profileLoading || resumeLoading}
              variant="contained"
              sx={{
                color: "white",
                bgcolor: "primary.main",
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              }}
              fullWidth
            >
              Register
            </Button>
            <div class="container signin">
              <p>
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{ color: "#2196f3", textDecoration: "none" }}
                >
                  Login
                </Link>
              </p>
            </div>
          </Box>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default Register;
