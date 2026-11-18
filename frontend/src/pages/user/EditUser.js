import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import TextField from "@mui/material/TextField";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { userProfileAction } from "../../redux/actions/userAction";

const INITIAL_STATE = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  contactDetails: "",
  education: "",
  skills: "",
  experience: "",
  profileInformation: "",
  resume: "",
  profilePhoto: "",
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EditUser = (props) => {
  const { user } = useSelector((state) => state.userprofile);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [formdata, setFormdata] = useState(INITIAL_STATE);
  const [profilePreview, setProfilePreview] = useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };

  useEffect(() => {
    let fn = user && user.firstName;
    let ln = user && user.lastName;
    let re = user && user.resume;
    let pr = user && user.profilePhoto;

    setFormdata({
      firstName: fn,
      lastName: ln,
      email: user && user.email,
      phoneNumber: user && user.phoneNumber,
      contactDetails: user && user.contactDetails,
      education: user && user.education,
      skills: user && user.skills,
      experience: user && user.experience,
      profileInformation: user && user.profileInformation,
      resume: re,
      profilePhoto: pr,
    });
  }, [user]);

  const handleClose = () => {
    setOpen(false);
  };

  const changeHandler = (e) => {
    const { name, value } = e.target;
    setFormdata({ ...formdata, [name]: value });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/user/edit/${user._id}`, formdata);
      await dispatch(userProfileAction());
      toast.success("Profile updated successfully.");
      setOpen(false);
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Unable to update your profile.",
      );
    }
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

  const uploadProfilePhoto = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert("Please upload an image first!");
      return;
    }

    setProfileLoading(true);
    const upload = await uploadFileToServer(file);
    if (upload?.url) {
      setFormdata((prevData) => ({
        ...prevData,
        profilePhoto: upload.url,
      }));
      setProfilePreview(upload.url);
    }
    setProfileLoading(false);
  };

  const uploadResume = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert("Please upload a resume file first!");
      return;
    }

    setResumeLoading(true);
    const upload = await uploadFileToServer(file);
    if (upload?.url) {
      setFormdata((prevData) => ({
        ...prevData,
        resume: upload.url,
      }));
    }
    setResumeLoading(false);
  };

  return (
    <div>
      <Button onClick={handleClickOpen}>EDIT</Button>

      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
      >
        <DialogTitle>
          {"Please Enter Your New Employee Data Here!!"}
        </DialogTitle>
        <DialogContent>
          <form action="" onSubmit={onSubmitHandler}>
            {user && (
              <div>
                <DialogContentText id="alert-dialog-slide-description">
                  <br />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <Avatar
                      src={profilePreview || formdata.profilePhoto}
                      sx={{ width: 200, height: 200 }}
                    />
                  </Box>

                  <br />
                  <TextField
                    sx={{
                      mb: 0,
                      "& .MuiInputBase-root": {
                        color: "text.secondary",
                      },
                      fieldset: { borderColor: "rgb(231, 235, 240)" },
                    }}
                    fullWidth
                    id="profilePhoto"
                    name="profilePhoto"
                    label="Profile Photo"
                    type="file"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    placeholder="photo"
                    onChange={uploadProfilePhoto}
                  />
                  {profileLoading && <CircularProgress />}
                  <br />
                  <br />
                  <TextField
                    sx={{ mb: 3, mt: 2 }}
                    fullWidth
                    id="firstName"
                    label="First Name"
                    type="text"
                    name="firstName"
                    value={formdata.firstName}
                    onChange={changeHandler}
                    required
                  />
                  <br />
                  <br />
                  <TextField
                    sx={{ mb: 3 }}
                    fullWidth
                    id="lastName"
                    name="lastName"
                    label="Last Name"
                    type="text"
                    value={formdata.lastName}
                    onChange={changeHandler}
                    required
                  />
                  <br />
                  <br />
                  <TextField
                    sx={{ mb: 3 }}
                    fullWidth
                    id="phoneNumber"
                    name="phoneNumber"
                    label="Phone Number"
                    type="tel"
                    value={formdata.phoneNumber || ""}
                    onChange={changeHandler}
                  />
                  <TextField
                    sx={{ mb: 3 }}
                    fullWidth
                    id="contactDetails"
                    name="contactDetails"
                    label="Additional Contact Details"
                    value={formdata.contactDetails || ""}
                    onChange={changeHandler}
                  />
                  <TextField
                    sx={{ mb: 3 }}
                    fullWidth
                    id="education"
                    name="education"
                    label="Education"
                    value={formdata.education || ""}
                    onChange={changeHandler}
                  />
                  <TextField
                    sx={{ mb: 3 }}
                    fullWidth
                    id="skills"
                    name="skills"
                    label="Skills"
                    multiline
                    minRows={2}
                    value={formdata.skills || ""}
                    onChange={changeHandler}
                  />
                  <TextField
                    sx={{ mb: 3 }}
                    fullWidth
                    id="experience"
                    name="experience"
                    label="Experience"
                    multiline
                    minRows={2}
                    value={formdata.experience || ""}
                    onChange={changeHandler}
                  />
                  <TextField
                    sx={{ mb: 3 }}
                    fullWidth
                    id="profileInformation"
                    name="profileInformation"
                    label="Profile Information"
                    multiline
                    minRows={3}
                    value={formdata.profileInformation || ""}
                    onChange={changeHandler}
                  />
                  <TextField
                    sx={{
                      mb: 0,
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
                    onChange={uploadResume}
                  />
                  {resumeLoading && <CircularProgress />}
                  {formdata.resume && !resumeLoading && (
                    <a
                      href={formdata.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Preview your resume
                    </a>
                  )}
                  <br />
                  <br />
                </DialogContentText>
                <DialogActions>
                  <Button type="submit">Edit</Button>
                  <Button variant="outlined" onClick={handleClose}>
                    Cancel
                  </Button>
                </DialogActions>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditUser;
