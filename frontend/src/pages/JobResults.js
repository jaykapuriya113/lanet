import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  InputAdornment,
  OutlinedInput,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import SearchIcon     from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowBackIcon  from "@mui/icons-material/ArrowBack";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { jobLoadAction }      from "../redux/actions/jobAction";
import { savedJobsLoadAction } from "../redux/actions/savedJobAction";
import Navbar      from "../component/Navbar";
import Footer      from "../component/Footer";
import CardElement from "../component/CardElement";

// ── Sky-Blue palette (mirrors Home.js T tokens) ───────────────────────────────
const T = {
  ink:      "#2196F3",
  jade:     "#1689D5",
  ivory:    "#F0F8FF",
  text:     "#263238",
  white:    "#FFFFFF",
  border:   "#DCE8F2",
  inkLight: "#E3F2FD",
};

const JobResults = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from query string — preserved on refresh
  const qKeyword  = searchParams.get("keyword")  || "";
  const qLocation = searchParams.get("location") || "";

  const { jobs, setUniqueLocation, pages, loading } = useSelector((s) => s.loadJobs);
  const { userInfo } = useSelector((s) => s.signIn);
  const role = Number(userInfo?.role?.role ?? userInfo?.role ?? -1);

  const [page,     setPage]     = useState(1);
  const [keyword,  setKeyword]  = useState(qKeyword);
  const [location, setLocation] = useState(qLocation);

  // Reset inputs & page whenever query params change (e.g. browser back/forward)
  useEffect(() => {
    setKeyword(qKeyword);
    setLocation(qLocation);
    setPage(1);
  }, [qKeyword, qLocation]);

  // Fetch filtered jobs whenever params or page changes
  useEffect(() => {
    dispatch(jobLoadAction(page, qKeyword, "", qLocation));
  }, [dispatch, page, qKeyword, qLocation]);

  // Load saved-jobs state for the bookmark button in CardElement
  useEffect(() => {
    if (userInfo && role === 0)
      dispatch(savedJobsLoadAction(userInfo.role?._id || userInfo?._id));
  }, [dispatch, userInfo, role]);

  // ── re-search from the inputs on this page ─────────────────────────────────
  const handleSearch = (e) => {
    e?.preventDefault();
    const kw  = keyword.trim();
    const loc = location.trim();
    const params = {};
    if (kw)  params.keyword  = kw;
    if (loc) params.location = loc;
    setSearchParams(params);   // updates URL query string, triggers useEffect above
    setPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch(e);
  };

  // ── build heading text ──────────────────────────────────────────────────────
  const headingText =
    qKeyword && qLocation
      ? `Results for "${qKeyword}" in ${qLocation}`
      : qKeyword
      ? `Results for "${qKeyword}"`
      : qLocation
      ? `Jobs in ${qLocation}`
      : "All Jobs";

  const countText = loading
    ? ""
    : `${(jobs || []).length} job${(jobs || []).length !== 1 ? "s" : ""} on this page`;

  return (
    <Box sx={{ bgcolor: T.ivory, minHeight: "100vh" }}>
      <Navbar />

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: T.ink, py: { xs: 3, md: 4 } }}>
        <Container maxWidth="md">
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              display: "flex", flexDirection: { xs: "column", sm: "row" },
              gap: 1.5, bgcolor: T.white, borderRadius: "14px",
              p: { xs: 2, sm: 1.5 }, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            <OutlinedInput
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Job title, keyword, or company"
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: T.jade }} />
                </InputAdornment>
              }
              sx={{
                flex: 2, "& fieldset": { border: "none" },
                bgcolor: T.ivory, borderRadius: "10px", fontSize: "0.97rem",
                "&:hover": { bgcolor: "#E8F4FE" },
              }}
            />
            <OutlinedInput
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Location (city, remote…)"
              startAdornment={
                <InputAdornment position="start">
                  <LocationOnIcon sx={{ color: T.jade }} />
                </InputAdornment>
              }
              sx={{
                flex: 1.5, "& fieldset": { border: "none" },
                bgcolor: T.ivory, borderRadius: "10px", fontSize: "0.97rem",
                "&:hover": { bgcolor: "#E8F4FE" },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              sx={{
                px: 4, borderRadius: "10px", fontWeight: 800,
                textTransform: "none", bgcolor: T.ink, color: T.white,
                flexShrink: 0, fontSize: "1rem", boxShadow: "none",
                "&:hover": { bgcolor: T.jade, boxShadow: "none" },
              }}
            >
              Search
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      <Container maxWidth="xl" sx={{ py: 5 }}>

        {/* Heading + back link */}
        <Stack direction="row" alignItems="center" justifyContent="space-between"
          flexWrap="wrap" gap={1} mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: T.jade }}>
              {headingText}
            </Typography>
            {countText && (
              <Typography variant="body2" sx={{ color: T.jade, mt: 0.5 }}>
                {countText}
              </Typography>
            )}
          </Box>
          <Button
            component={Link} to="/"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            sx={{
              textTransform: "none", fontWeight: 600,
              borderColor: T.jade, color: T.jade,
              "&:hover": { bgcolor: T.inkLight },
            }}
          >
            Back to Home
          </Button>
        </Stack>

        {/* Location filter chips */}
        {setUniqueLocation && setUniqueLocation.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={1} mb={4}>
            <Chip
              label="All Locations"
              onClick={() => {
                setLocation("");
                const p = {};
                if (qKeyword) p.keyword = qKeyword;
                setSearchParams(p);
                setPage(1);
              }}
              sx={{
                fontWeight: 700, cursor: "pointer",
                bgcolor: !qLocation ? T.ink : T.white,
                color:   !qLocation ? T.white : T.text,
                border: `1.5px solid ${!qLocation ? T.ink : T.border}`,
                "&:hover": { bgcolor: !qLocation ? T.jade : T.inkLight },
              }}
            />
            {setUniqueLocation.map((loc, i) => {
              const active = qLocation === loc;
              return (
                <Chip
                  key={i}
                  label={loc}
                  icon={
                    <LocationOnIcon sx={{
                      fontSize: "13px !important",
                      color: active ? `${T.white} !important` : `${T.jade} !important`,
                    }} />
                  }
                  onClick={() => {
                    const p = {};
                    if (qKeyword) p.keyword = qKeyword;
                    p.location = loc;
                    setSearchParams(p);
                    setPage(1);
                  }}
                  sx={{
                    fontWeight: 600, cursor: "pointer",
                    bgcolor: active ? T.ink : T.white,
                    color:   active ? T.white : T.text,
                    border: `1.5px solid ${active ? T.ink : T.border}`,
                    "&:hover": { bgcolor: active ? T.jade : T.inkLight },
                  }}
                />
              );
            })}
          </Stack>
        )}

        {/* Loading / empty / results */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress sx={{ color: T.jade }} />
          </Box>
        ) : !jobs || jobs.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              maxWidth: 480, mx: "auto", borderRadius: 3,
              bgcolor: T.inkLight, color: T.jade,
              border: `1px solid ${T.border}`,
              "& .MuiAlert-icon": { color: T.jade },
            }}
          >
            {qKeyword
              ? `No open positions available${qLocation ? ` in ${qLocation}` : ""} for "${qKeyword}".`
              : qLocation
              ? `No open positions available in ${qLocation}.`
              : "No open positions available."}
          </Alert>
        ) : (
          <Grid container spacing={2.5}>
            {jobs.map((job, i) => (
              <Grid item xs={12} md={6} key={job._id || i}>
                <CardElement
                  id={job._id}
                  jobTitle={job.title}
                  companyName={job.companyName}
                  description={job.description}
                  category={job.jobType}
                  location={job.location}
                  profilePhoto={job.user?.profilePhoto}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <Stack alignItems="center" mt={5}>
            <Pagination
              page={page}
              count={pages === 0 ? 1 : pages}
              onChange={(_, v) => {
                setPage(v);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              sx={{
                "& .MuiPaginationItem-root": { color: T.jade, borderColor: T.border },
                "& .Mui-selected": {
                  bgcolor: `${T.ink} !important`,
                  color:   `${T.white} !important`,
                },
                "& .MuiPaginationItem-root:hover": { bgcolor: T.inkLight },
              }}
            />
          </Stack>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default JobResults;
