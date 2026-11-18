import React, { useEffect } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import WorkIcon from "@mui/icons-material/Work";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import { adminStatsAction } from "../../redux/actions/userAction";

const STAT_CARDS = [
  {
    key: "totalUsers",
    label: "Total Users",
    to: "/mainadmin",
    icon: <PeopleIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    color: "#e3f2fd",
  },
  {
    key: "totalRecruiters",
    label: "Total Recruiters",
    to: "/mainadmin/recruiters",
    icon: <BusinessCenterIcon sx={{ fontSize: 40, color: "success.main" }} />,
    color: "#e8f5e9",
  },
  {
    key: "totalJobs",
    label: "Total Jobs",
    to: "/mainadmin/alljobs",
    icon: <WorkIcon sx={{ fontSize: 40, color: "warning.main" }} />,
    color: "#fff8e1",
  },
  {
    key: "activeJobs",
    label: "Active Jobs",
    to: "/mainadmin/alljobs",
    icon: <CheckCircleIcon sx={{ fontSize: 40, color: "success.dark" }} />,
    color: "#f1f8e9",
  },
  {
    key: "totalApplications",
    label: "Total Applications",
    to: "/mainadmin/applications",
    icon: <AssignmentIcon sx={{ fontSize: 40, color: "secondary.main" }} />,
    color: "#fce4ec",
  },
];

const AdminStats = () => {
  const dispatch = useDispatch();
  const { loading, stats, error } = useSelector((state) => state.adminStats);

  useEffect(() => {
    dispatch(adminStatsAction());
  }, [dispatch]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ color: "black", mb: 1 }}>
        Admin Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Platform-wide statistics overview.
      </Typography>

      <Grid container spacing={3}>
        {STAT_CARDS.map(({ key, label, to, icon, color }) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Card
              component={RouterLink}
              to={to}
              elevation={2}
              style={{ backgroundColor: color }}
              sx={{
                display: "flex",
                width: "100%",
                minHeight: 128,
                borderRadius: 3,
                height: "100%",
                boxSizing: "border-box",
                padding: "24px 16px",
                backgroundColor: `${color} !important`,
                boxShadow: 3,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  width: "100%",
                  p: 0,
                }}
              >
                {icon}
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    {label}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {stats?.[key] ?? 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminStats;
