import React from "react";
import { Box, Container, Typography } from "@mui/material";
import Footer from "../component/Footer";
import Navbar from "../component/Navbar";

const AboutUs = () => (
  <>
    <Navbar />
    <Box component="main" sx={{ minHeight: "65vh", py: { xs: 5, md: 8 } }}>
      <Container maxWidth="md">
        <Typography variant="overline" color="primary" fontWeight={700}>
          ABOUT JOB PORTAL
        </Typography>
        <Typography variant="h3" component="h1" fontWeight={700} sx={{ mt: 1, mb: 3 }}>
          Find the right opportunity for you.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
          Job Portal brings candidates and recruiters together. Candidates can explore job openings, save roles, submit applications, and follow their progress from one place.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
          Recruiters can publish openings, review applications, and identify suitable candidates. Our goal is to make each step of finding or filling a role clear and manageable.
        </Typography>
      </Container>
    </Box>
    <Footer />
  </>
);

export default AboutUs;