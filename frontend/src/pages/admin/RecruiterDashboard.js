import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import axios from "axios";
import { Chart } from "react-google-charts";
import { useNavigate } from "react-router-dom";

const STAT_ITEMS = [
  ["totalJobs", "Total Jobs Posted"],
  ["activeJobs", "Active Jobs"],
  ["totalApplications", "Total Applications"],
  ["pendingApplications", "Pending Applications"],
  ["shortlistedCandidates", "Shortlisted Candidates"],
  ["interviews", "Interviews"],
  ["selectedCandidates", "Selected Candidates"],
  ["rejectedCandidates", "Rejected Candidates"],
];

const formatStatus = (value) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/recruiter/analytics");
      setAnalytics(data);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Unable to load recruiter analytics",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const statusData = useMemo(
    () => [
      ["Status", "Applications"],
      ...(analytics?.statusDistribution || []).map((item) => [
        formatStatus(item.status),
        item.count,
      ]),
    ],
    [analytics],
  );
  const jobData = useMemo(
    () => [
      ["Job", "Applications"],
      ...(analytics?.applicationsPerJob || []).map((item) => [
        item.title,
        item.applications,
      ]),
    ],
    [analytics],
  );
  const timeData = useMemo(
    () => [
      ["Date", "Applications"],
      ...(analytics?.applicationsOverTime || []).map((item) => [
        item.date,
        item.applications,
      ]),
    ],
    [analytics],
  );
  const funnelData = useMemo(
    () => [
      ["Stage", "Candidates"],
      ...(analytics?.hiringFunnel || []).map((item) => [
        item.stage,
        item.count,
      ]),
    ],
    [analytics],
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" sx={{ color: "black", mb: 1 }}>
        Recruiter Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Hiring analytics for your jobs and applications.
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={() => navigate("/recruiter/users")}
        >
          View Received Applications
        </Button>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STAT_ITEMS.map(([key, label]) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  {label}
                </Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {analytics?.summary?.[key] || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {!analytics?.summary?.totalJobs && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Create a job posting to start seeing hiring analytics.
        </Alert>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 360 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Application Status Distribution
            </Typography>
            <Chart
              chartType="PieChart"
              width="100%"
              height="290px"
              data={statusData}
              options={{ legend: { position: "bottom" }, pieHole: 0.35 }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 360 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Applications per Job
            </Typography>
            <Chart
              chartType="BarChart"
              width="100%"
              height="290px"
              data={jobData}
              options={{
                legend: { position: "none" },
                bars: "horizontal",
                hAxis: { minValue: 0 },
              }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 360 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Applications Over Time
            </Typography>
            <Chart
              chartType="LineChart"
              width="100%"
              height="290px"
              data={timeData}
              options={{ legend: { position: "none" }, curveType: "function" }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 360 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Hiring Funnel
            </Typography>
            <Chart
              chartType="ColumnChart"
              width="100%"
              height="290px"
              data={funnelData}
              options={{ legend: { position: "none" }, vAxis: { minValue: 0 } }}
            />
          </Paper>
        </Grid>
      </Grid>
      <Paper sx={{ mt: 3, overflowX: "auto" }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Job-wise Analytics
        </Typography>
        <Table sx={{ minWidth: 850 }}>
          <TableHead>
            <TableRow>
              <TableCell>Job Title</TableCell>
              <TableCell>Total Applications</TableCell>
              <TableCell>Pending</TableCell>
              <TableCell>Shortlisted</TableCell>
              <TableCell>Interview</TableCell>
              <TableCell>Selected</TableCell>
              <TableCell>Rejected</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(analytics?.jobs || []).map((job) => (
              <TableRow key={job.jobId}>
                <TableCell>{job.title}</TableCell>
                <TableCell>{job.totalApplications}</TableCell>
                <TableCell>{job.pending}</TableCell>
                <TableCell>{job.shortlisted}</TableCell>
                <TableCell>{job.interview}</TableCell>
                <TableCell>{job.selected}</TableCell>
                <TableCell>{job.rejected}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default RecruiterDashboard;
