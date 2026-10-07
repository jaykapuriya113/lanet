import { useTheme } from "@emotion/react";
import { Avatar, Box, Card, CardContent, Typography } from "@mui/material";
import { useSelector } from "react-redux";

import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import EditAdminData from "./data/EditAdminData";

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.userprofile);
  const { palette } = useTheme();
  const [render, setRender] = React.useState(false);
  console.log(user);
  const renderHandler = () => {
    setRender(!render);
  };
  // console.log(user);
  return (
    <>
      <Box sx={{ maxWidth: "40%", margin: "auto", pt: 10 }}>
        <Card sx={{ minWidth: 275, bgcolor: palette.secondary.midNightBlue }}>
          <CardContent>
            <Avatar
              src={user?.profilePhoto || undefined}
              alt={`${user?.firstName || "Recruiter"} profile photo`}
              sx={{ width: 96, height: 96, mb: 2 }}
            >
              {`${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`}
            </Avatar>
            <Typography sx={{ fontSize: 16 }} color="black" gutterBottom>
              Personal Info
            </Typography>
            <hr style={{ marginBottom: "30px" }} />
            <Typography variant="h6" component="div" sx={{ color: "black" }}>
              First name: {user && user.firstName}
            </Typography>
            <Typography variant="h6" component="div" sx={{ color: "black" }}>
              Last name: {user && user.lastName}
            </Typography>
            <Typography variant="h6" component="div" sx={{ color: "black" }}>
              E-mail: {user && user.email}
            </Typography>
            <EditAdminData onClick={renderHandler}>Edit</EditAdminData>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default AdminDashboard;
