import { useTheme } from "@emotion/react";
import { Avatar, Box, Card, CardContent, Link, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import React from "react";
import EditAdminData from "./data/EditAdminData";

// ── helper — show "Not provided" for blank values ─────────────────────────────
const display = (val) =>
  val && String(val).trim() ? String(val).trim() : "Not provided";

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.userprofile);
  const { palette } = useTheme();

  const isRecruiter =
    user && Number(user?.role?.role ?? user?.role ?? 0) === 1;

  return (
    <Box sx={{ maxWidth: "480px", margin: "auto", pt: 6 }}>
      <Card sx={{ minWidth: 275, bgcolor: palette.secondary.midNightBlue }}>
        <CardContent>
          <Avatar
            src={user?.profilePhoto || undefined}
            alt={`${user?.firstName || ""} profile photo`}
            sx={{ width: 96, height: 96, mb: 2 }}
          >
            {`${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`}
          </Avatar>

          <Typography sx={{ fontSize: 16 }} color="black" gutterBottom>
            Personal Info
          </Typography>
          <hr style={{ marginBottom: "20px" }} />

          <Typography variant="h6" sx={{ color: "black" }}>
            First name: {display(user?.firstName)}
          </Typography>
          <Typography variant="h6" sx={{ color: "black" }}>
            Last name: {display(user?.lastName)}
          </Typography>
          <Typography variant="h6" sx={{ color: "black" }}>
            E-mail: {display(user?.email)}
          </Typography>
          <Typography variant="h6" sx={{ color: "black" }}>
            Phone: {display(user?.phoneNumber)}
          </Typography>

          {/* Company section — visible to recruiters only */}
          {isRecruiter && (
            <>
              <hr style={{ margin: "20px 0 16px" }} />
              <Typography sx={{ fontSize: 16 }} color="black" gutterBottom>
                Company Info
              </Typography>
              <Typography variant="h6" sx={{ color: "black" }}>
                Company: {display(user?.companyName)}
              </Typography>
              <Typography variant="h6" sx={{ color: "black" }}>
                Address: {display(user?.companyAddress)}
              </Typography>
              <Typography variant="h6" sx={{ color: "black" }}>
                Website:{" "}
                {user?.companyWebsite && user.companyWebsite.trim() ? (
                  <Link
                    href={
                      user.companyWebsite.startsWith("http")
                        ? user.companyWebsite
                        : `https://${user.companyWebsite}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                  >
                    {user.companyWebsite}
                  </Link>
                ) : (
                  "Not provided"
                )}
              </Typography>
            </>
          )}

          <Box sx={{ mt: 2 }}>
            <EditAdminData />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminDashboard;
