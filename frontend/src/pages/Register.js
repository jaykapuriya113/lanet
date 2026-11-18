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

const RESUME_FILE_TYPE_ERROR =
  "Only PDF or Word documents (.pdf, .doc, .docx) are allowed.";
const PROFILE_PHOTO_REQUIRED_ERROR = "Profile photo is required.";
const PROFILE_PHOTO_SIZE_ERROR = "Profile photo must be 20 KB or smaller.";
const PROFILE_PHOTO_TYPE_ERROR = "Only JPG, JPEG, and PNG images are allowed.";
const MAX_PROFILE_PHOTO_SIZE = 20 * 1024;
const PROFILE_PHOTO_EXTENSIONS = ["jpg", "jpeg", "png"];
const PROFILE_PHOTO_MIME_TYPES = ["image/jpeg", "image/png"];

const isSupportedProfilePhoto = (file) => {
  const extension = file.name?.split(".").pop()?.toLowerCase();
  return (
    PROFILE_PHOTO_EXTENSIONS.includes(extension) &&
    (!file.type || PROFILE_PHOTO_MIME_TYPES.includes(file.type.toLowerCase()))
  );
};

export const validationSchema = yup.object().shape({
  profilePhoto: yup
    .mixed()
    .test(
      "profile-photo-required",
      PROFILE_PHOTO_REQUIRED_ERROR,
      (value) =>
        typeof value === "string" ? Boolean(value.trim()) : Boolean(value),
    )
    .test(
      "profile-photo-type",
      PROFILE_PHOTO_TYPE_ERROR,
      (value) =>
        !value ||
        typeof value === "string" ||
        isSupportedProfilePhoto(value),
    )
    .test(
      "profile-photo-size",
      PROFILE_PHOTO_SIZE_ERROR,
      (value) =>
        !value ||
        typeof value === "string" ||
        value.size <= MAX_PROFILE_PHOTO_SIZE,
    ),
  role: yup
    .string()
    .test("not-blank", "Role is required", (value) =>
      Boolean(value?.trim()),
    )
    .required("Role is required"),
  resume: yup.string().when("role", ([role], schema) => {
    return role === "0"
      ? schema
          .test("not-blank", "Resume is required", (value) =>
            Boolean(value?.trim()),
          )
          .required("Resume is required")
      : schema;
  }),
  firstName: yup
    .string()
    .min(3, "First Name should be of minimum 3 characters length")
    .test("not-blank", "First Name is required", (value) =>
      Boolean(value?.trim()),
    )
    .matches(
      /^[\p{L}\p{M}][\p{L}\p{M}' -]*$/u,
      "First Name can contain only letters, spaces, apostrophes, and hyphens",
    )
    .required("First Name is required"),
  lastName: yup
    .string()
    .min(3, "Last Name should be of minimum 3 characters length")
    .test("not-blank", "Last Name is required", (value) =>
      Boolean(value?.trim()),
    )
    .matches(
      /^[\p{L}\p{M}][\p{L}\p{M}' -]*$/u,
      "Last Name can contain only letters, spaces, apostrophes, and hyphens",
    )
    .required("Last Name is required"),
  email: yup
    .string()
    .email("Enter a valid email")
    .test(
      "email-username-start",
      "Email username must start with a letter",
      (value) => !value || /^[A-Za-z]/.test(value),
    )
    .required("Email is required"),
  password: yup
    .string()
    .test("not-blank", "Password is required", (value) =>
      Boolean(value?.trim()),
    )
    .min(8, "Password should be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[^A-Za-z0-9\s]/,
      "Password must contain at least one special character",
    )
    .required("Password is required"),
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [images, setImages] = useState();
  const [role, setRole] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeTypeError, setResumeTypeError] = useState("");

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
    onSubmit: async (values, actions) => {
      if (resumeTypeError) {
        return;
      }

      const finalValues = { ...values };

      const result = await dispatch(userSignUpAction(finalValues));
      if (result?.success) {
        actions.resetForm();
        navigate(
          `/verify-email?email=${encodeURIComponent(result.email || values.email)}`,
        );
      }
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
      return;
    }

    formik.setFieldTouched("profilePhoto", true, false);
    formik.setFieldValue("profilePhoto", file, false);
    setImages(null);

    if (!isSupportedProfilePhoto(file)) {
      formik.setFieldValue("profilePhoto", "", false);
      formik.setFieldError("profilePhoto", PROFILE_PHOTO_TYPE_ERROR);
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      formik.setFieldValue("profilePhoto", "", false);
      formik.setFieldError("profilePhoto", PROFILE_PHOTO_SIZE_ERROR);
      return;
    }

    setProfileLoading(true);
    setIsUploading(true);
    const upload = await uploadFileToServer(file);
    if (upload?.url) {
      formik.setFieldValue("profilePhoto", upload.url);
      setImages(upload.url);
    } else {
      formik.setFieldValue("profilePhoto", "", false);
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

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(extension)) {
      setResumeTypeError(RESUME_FILE_TYPE_ERROR);
      formik.setFieldTouched("resume", true, false);
      formik.setFieldValue("resume", "", false);
      formik.setFieldError("resume", RESUME_FILE_TYPE_ERROR);
      return;
    }

    setResumeTypeError("");
    formik.setFieldValue("resume", "", false);
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
                />
                User
                <input
                  type="radio"
                  name="role"
                  value="1"
                  checked={role === "1"}
                  onChange={handleRoleChange}
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
              inputProps={{ accept: ".jpg,.jpeg,.png,image/jpeg,image/png" }}
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
                  inputProps={{ accept: ".pdf,.doc,.docx" }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  placeholder="Resume"
                  onChange={resumeUpload}
                  onBlur={formik.handleBlur}
                  error={
                    Boolean(resumeTypeError) ||
                    (formik.touched.resume && Boolean(formik.errors.resume))
                  }
                  helperText={
                    resumeTypeError ||
                    (formik.touched.resume && formik.errors.resume)
                  }
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
