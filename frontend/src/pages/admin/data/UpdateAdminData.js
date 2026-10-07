import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import TextField from "@mui/material/TextField";
import EditIcon from "@mui/icons-material/Edit";
import { useDispatch, useSelector } from "react-redux";
import { editJobAction } from "../../../redux/actions/jobAction";
import { loadJobAction } from "../../../redux/actions/generalActions";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const UpdateJob = ({ jobData }) => {
  const INITIAL_STATE = {
    id: jobData._id,
    title: jobData.title,
    salary: jobData.salary,
    applicationDeadline: getInputDate(jobData.applicationDeadline),
  };
  const dispatch = useDispatch();
  const data = useSelector((state) => state.signIn);
  const [open, setOpen] = useState(false);
  const [formdata, setFormdata] = useState(INITIAL_STATE);
  const [deadlineError, setDeadlineError] = useState("");

  const handleClickOpen = () => {
    setDeadlineError(
      formdata.applicationDeadline &&
        formdata.applicationDeadline < getTodayDate()
        ? "Application Deadline cannot be in the past"
        : "",
    );
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const chageHandler = (e) => {
    const { name, value } = e.target;
    setFormdata({ ...formdata, [name]: value });
    if (name === "applicationDeadline") {
      setDeadlineError(
        value && value < getTodayDate()
          ? "Application Deadline cannot be in the past"
          : "",
      );
    }
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (
      formdata.applicationDeadline &&
      formdata.applicationDeadline < getTodayDate()
    ) {
      setDeadlineError("Application Deadline cannot be in the past");
      return;
    }

    const updateData = { ...formdata };
    if (!updateData.applicationDeadline) {
      delete updateData.applicationDeadline;
    }
    dispatch(editJobAction(updateData.id, updateData, data.userInfo.role._id));
    dispatch(loadJobAction());
    setOpen(!open);
    window.location.reload();
  };

  return (
    <div>
      <Button
        onClick={handleClickOpen}
        sx={{
          bgcolor: "#70b5dc",
          "&:hover": {
            bgcolor: "#4b8cb5",
          },
        }}
      >
        <div style={{ color: "blue" }}>Edit</div>
      </Button>

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
            <div>
              <DialogContentText id="alert-dialog-slide-description">
                <br />
                <TextField
                  sx={{ mb: 3 }}
                  fullWidth
                  id="title"
                  label="Title"
                  name="title"
                  placeholder="Title"
                  value={formdata.title}
                  onChange={chageHandler}
                  required
                ></TextField>
                <br />
                <br />
                <TextField
                  sx={{ mb: 3 }}
                  fullWidth
                  id="salary"
                  name="salary"
                  label="Salary"
                  type="text"
                  value={formdata.salary}
                  onChange={chageHandler}
                  required
                />
                <TextField
                  sx={{ mb: 3 }}
                  fullWidth
                  id="applicationDeadline"
                  name="applicationDeadline"
                  label="Application Deadline"
                  type="date"
                  value={formdata.applicationDeadline}
                  onChange={chageHandler}
                  inputProps={{ min: getTodayDate() }}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(deadlineError)}
                  helperText={deadlineError}
                />
              </DialogContentText>
              <DialogActions>
                <Button type="submit">Edit</Button>
                <Button variant="outlined" onClick={handleClose}>
                  Cancel
                </Button>
              </DialogActions>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdateJob;
