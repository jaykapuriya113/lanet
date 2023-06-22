// import { useTheme } from "@emotion/react";
// import { Box, Card, CardContent, Typography } from "@mui/material";
// import { useSelector } from "react-redux";
// import EditUser from "./EditUser";
// import React from "react";
// import EditIcon from "@mui/icons-material/Edit";

// const UserInfoDashboard = () => {
//   const { user } = useSelector((state) => state.userprofile);
//   const { palette } = useTheme();
//   const [render, setRender] = React.useState(false);

//   const renderHandler = () => {
//     setRender(!render);
//   };
//   // console.log(user);
//   return (
//     <>
//       <Box sx={{ maxWidth: "50%", margin: "auto", pt: 10 }}>
//         <Card sx={{ minWidth: 275, bgcolor: palette.secondary.midNightBlue }}>
//           <CardContent>
//             <Typography sx={{ fontSize: 16 }} color="black" gutterBottom>
//               Personal Info
//             </Typography>
//             <hr style={{ marginBottom: "30px" }} />
//             <Typography variant="h6" component="div" sx={{ color: "black" }}>
//               First name: {user && user.firstName}
//             </Typography>
//             <Typography variant="h6" component="div" sx={{ color: "black" }}>
//               Last name: {user && user.lastName}
//             </Typography>
//             <Typography variant="h6" component="div" sx={{ color: "black" }}>
//               E-mail: {user && user.email}
//             </Typography>
//             <EditUser onClick={renderHandler}>Edit</EditUser>
//           </CardContent>
//         </Card>
//       </Box>
//     </>
//   );
// };

// export default UserInfoDashboard;
import { useTheme } from "@emotion/react";
import { Box, Card, CardContent, Typography, Avatar, IconButton, Button } from "@mui/material";
import { useSelector } from "react-redux";
import EditUser from "./EditUser";
import React from "react";
import EditIcon from "@mui/icons-material/Edit";

const UserInfoDashboard = () => {
  const { user } = useSelector((state) => state.userprofile);
  const { palette } = useTheme();
  const [render, setRender] = React.useState(false);

  const renderHandler = () => {
    setRender(!render);
  };

  return (
    <Box sx={{ maxWidth: "500px", margin: "auto", pt: 7 }}>
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px",
          backgroundColor: "whitesmoke",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.3)",
        }}
      >
        <Avatar
          sx={{
            width: 120,
            height: 120,
            marginBottom: "20px",
            backgroundColor: "white",
            boxShadow: "0 0 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          <img
            src={user && user.profilePhoto}
            alt="Profile Pic"
            style={{
              width: "100%",
              height: "auto",
              objectFit: "cover",
            }}
          />
        </Avatar>

        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Typography variant="h6" component="div" sx={{ color: "black" }}>
            First name: {user && user.firstName}
          </Typography>
          <Typography variant="h6" component="div" sx={{ color: "black" }}>
            Last name: {user && user.lastName}
          </Typography>
          <Typography variant="h6" component="div" sx={{ color: "black" }}>
            E-mail: {user && user.email}
          </Typography>

          <EditUser
            sx={{
              alignSelf: "flex-end",
              marginTop: "20px",
              backgroundColor: palette.primary.main,
              color: "white",
            }}
            
          >
            <Button onClick={renderHandler}>EDIT</Button>
          </EditUser>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserInfoDashboard;
