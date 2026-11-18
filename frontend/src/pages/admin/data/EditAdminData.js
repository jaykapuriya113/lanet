import React, { useEffect, useState } from "react";
import { Button, TextField } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import EditIcon from "@mui/icons-material/Edit";
import { useDispatch, useSelector } from "react-redux";
import { editUserAction } from "../../../redux/actions/userAction";

const INITIAL_STATE = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  companyName: "",
  companyWebsite: "",
  companyAddress: "",
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EditAdminData = () => {
  const { user } = useSelector((state) => state.userprofile);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [formdata, setFormdata] = useState(INITIAL_STATE);

  const isRecruiter =
    user && Number(user?.role?.role ?? user?.role ?? 0) === 1;

  useEffect(() => {
    if (user) {
      setFormdata({
        firstName:      user.firstName      || "",
        lastName:       user.lastName       || "",
        phoneNumber:    user.phoneNumber    || "",
        companyName:    user.companyName    || "",
        companyWebsite: user.companyWebsite || "",
        companyAddress: user.companyAddress || "",
      });
    }
  }, [user]);

  const handleClickOpen = () => setOpen(true);
  const handleClose    = () => setOpen(false);

  const changeHandler = (e) => {
    const { name, value } = e.target;
    setFormdata((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    dispatch(editUserAction(user._id, formdata));
    window.location.reload();
    setOpen(false);
  };

  return (
    <div>
      <EditIcon onClick={handleClickOpen} style={{ cursor: "pointer" }} />

      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <form onSubmit={onSubmitHandler}>
            {user && (
              <DialogContentText component="div">
                <TextField
                  sx={{ mb: 3, mt: 1 }}
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  value={formdata.firstName}
                  onChange={changeHandler}
                  required
                />
                <TextField
                  sx={{ mb: 3 }}
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  value={formdata.lastName}
                  onChange={changeHandler}
                  required
                />
                <TextField
                  sx={{ mb: 3 }}
                  fullWidth
                  id="phoneNumber"
                  label="Phone Number"
                  name="phoneNumber"
                  value={formdata.phoneNumber}
                  onChange={changeHandler}
                />

                {/* Company fields — shown for recruiters only */}
                {isRecruiter && (
                  <>
                    <TextField
                      sx={{ mb: 3 }}
                      fullWidth
                      id="companyName"
                      label="Company Name"
                      name="companyName"
                      value={formdata.companyName}
                      onChange={changeHandler}
                    />
                    <TextField
                      sx={{ mb: 3 }}
                      fullWidth
                      id="companyWebsite"
                      label="Company Website"
                      name="companyWebsite"
                      placeholder="https://example.com"
                      value={formdata.companyWebsite}
                      onChange={changeHandler}
                    />
                    <TextField
                      sx={{ mb: 3 }}
                      fullWidth
                      id="companyAddress"
                      label="Company Address / Location"
                      name="companyAddress"
                      value={formdata.companyAddress}
                      onChange={changeHandler}
                    />
                  </>
                )}
              </DialogContentText>
            )}
            <DialogActions>
              <Button type="submit" variant="contained">Save</Button>
              <Button variant="outlined" onClick={handleClose}>Cancel</Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditAdminData;
