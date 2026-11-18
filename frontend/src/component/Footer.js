import React from "react";
import { Box, Container, Divider, Grid, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const FooterLink = ({ to, children, component = "span" }) => (
  <Typography
    component={to ? Link : component}
    {...(to ? { to } : {})}
    variant="body2"
    sx={{
      color: "rgba(255,255,255,0.8)",
      textDecoration: "none",
      ...(to && {
        transition: "color 0.2s ease",
        "&:hover": { color: "#fff", textDecoration: "underline" },
      }),
    }}
  >
    {children}
  </Typography>
);

const quickAccessByRole = {
  0: [
    { label: "My Profile", to: "/user/info" },
    { label: "My Applications", to: "/user/jobs" },
    { label: "Saved Jobs", to: "/user/saved-jobs" },
  ],
  1: [
    { label: "Recruiter Dashboard", to: "/recruiter/dashboard" },
    { label: "Manage Jobs", to: "/recruiter/jobs" },
    { label: "Applications", to: "/recruiter/users" },
    { label: "Interviews", to: "/recruiter/users" },
  ],
  2: [
    { label: "Admin Dashboard", to: "/mainadmin/stats" },
    { label: "User Management", to: "/mainadmin" },
    { label: "Recruiter Management", to: "/mainadmin/recruiters" },
    { label: "Reports", to: "/mainadmin/reports" },
  ],
};

const getSupportItems = (role) => {
  const feedbackPath = role === 0
    ? "/user/jobs"
    : role === 1
      ? "/recruiter/platform-feedback"
      : role === 2
        ? "/mainadmin/feedback"
        : "/login";

  return [
    { label: "Help & FAQ", to: "/help" },
    { label: "Contact", to: "/about" },
    { label: "Feedback", to: feedbackPath },
  ];
};

const Footer = () => {
  const { userInfo } = useSelector((state) => state.signIn);
  const role = Number(userInfo?.role?.role ?? userInfo?.role ?? -1);
  const quickAccessLinks = quickAccessByRole[role] || quickAccessByRole[0];
  const supportItems = getSupportItems(role);

  return (
    <Box sx={{ bgcolor: "#1565c0", color: "white", pt: 4, pb: 3, mt: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="flex-start">
          <Grid item xs={12} md={4}>
            <Box sx={{ maxWidth: 300 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                JOB PORTAL
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.8 }}>
                Find the right opportunity for you.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, textTransform: "uppercase" }}>
              QUICK ACCESS
            </Typography>
            <Stack spacing={1}>
              {quickAccessLinks.map((item) => (
                <FooterLink key={item.label} to={item.to}>
                  {item.label}
                </FooterLink>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, textTransform: "uppercase" }}>
              SUPPORT
            </Typography>
            <Stack spacing={1}>
              {supportItems.map((item) => (
                <FooterLink key={item.label} to={item.to}>
                  {item.label}
                </FooterLink>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 3 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.5}
        >
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
            © 2026 Job Portal
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <FooterLink>Privacy</FooterLink>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)" }}>
              |
            </Typography>
            <FooterLink>Terms</FooterLink>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
