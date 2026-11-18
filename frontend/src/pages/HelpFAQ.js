import React from "react";
import { Box, Container, Link as MuiLink, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import Footer from "../component/Footer";
import Navbar from "../component/Navbar";

const commonQuestions = [
  {
    question: "How do I find available jobs?",
    answer: "Open the Jobs page to browse current openings. You can also use the search controls on the home page to narrow results.",
  },
  {
    question: "How do I apply for a job?",
    answer: "Sign in or create a candidate account, open a job listing, and use its application option. Your applications are available from My Applications.",
  },
  {
    question: "Where can I find my saved jobs?",
    answer: "Sign in to your candidate account and open Saved Jobs from your account navigation.",
  },
  {
    question: "How can recruiters manage applications?",
    answer: "Recruiters can sign in and open Applications from their dashboard navigation to review submitted applications.",
  },
];

const HelpFAQ = () => (
  <>
    <Navbar />
    <Box component="main" sx={{ minHeight: "65vh", py: { xs: 5, md: 8 } }}>
      <Container maxWidth="md">
        <Typography variant="overline" color="primary" fontWeight={700}>
          HELP CENTER
        </Typography>
        <Typography variant="h3" component="h1" fontWeight={700} sx={{ mt: 1, mb: 1 }}>
          Help &amp; FAQ
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Answers to common questions about using Job Portal.
        </Typography>
        <Stack spacing={3}>
          {commonQuestions.map(({ question, answer }) => (
            <Box key={question}>
              <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 0.75 }}>
                {question}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {answer}
              </Typography>
            </Box>
          ))}
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 4 }}>
          Need more help? Visit <MuiLink component={Link} to="/about">About Job Portal</MuiLink>.
        </Typography>
      </Container>
    </Box>
    <Footer />
  </>
);

export default HelpFAQ;