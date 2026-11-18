import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Pagination,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import SearchIcon       from "@mui/icons-material/Search";
import LocationOnIcon   from "@mui/icons-material/LocationOn";
import AutoAwesomeIcon  from "@mui/icons-material/AutoAwesome";
import ChevronLeftIcon  from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CategoryIcon     from "@mui/icons-material/Category";
import CheckCircleIcon  from "@mui/icons-material/CheckCircle";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { jobLoadAction } from "../redux/actions/jobAction";
import { jobTypeLoadAction } from "../redux/actions/jobTypeAction";
import { savedJobsLoadAction } from "../redux/actions/savedJobAction";
import Navbar     from "../component/Navbar";
import Footer     from "../component/Footer";
import CardElement from "../component/CardElement";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  ink:      "#2196F3",   // Sky Blue — primary brand
  lime:     "#2196F3",   // CTA accent → same sky blue (replaces citrus lime)
  ivory:    "#F0F8FF",   // Alice Blue — page background
  jade:     "#1689D5",   // Deep Sky Blue — secondary / subtitles
  text:     "#263238",   // Blue-Grey — main text
  white:    "#FFFFFF",
  border:   "#DCE8F2",   // Light blue-grey border
  inkLight: "#E3F2FD",   // Very light sky-blue tint for hover backgrounds
};

// Category accent palette — sky-blue family
const CAT_COLORS = [
  "#2196F3","#1689D5","#0D7DC2","#42A5F5","#1565C0",
  "#1976D2","#0288D1","#039BE5","#29B6F6","#4FC3F7",
];

// ── Shared section heading ────────────────────────────────────────────────────
const SectionHeading = ({ title, subtitle }) => (
  <Box sx={{ textAlign: "center", mb: 5 }}>
    <Typography variant="h4" fontWeight={800} sx={{ color: T.ink, mb: 1 }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body1" sx={{ color: T.jade, maxWidth: 540, mx: "auto" }}>
        {subtitle}
      </Typography>
    )}
  </Box>
);

// ── Company Carousel ──────────────────────────────────────────────────────────
// Each card is a real <Link> element so keyboard and pointer navigation both work.
// A drag-guard (mousedown→mousemove distance) ensures that a horizontal scroll
// gesture does NOT trigger navigation — only a clean click/tap does.
const CompanyCarousel = ({ companies }) => {
  const scrollRef  = useRef(null);
  const dragOrigin = useRef(null);   // { x, y } recorded on mousedown
  const didDrag    = useRef(false);  // true when pointer moved > 5 px before mouseup

  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  if (!companies.length) return null;

  const handleTrackMouseDown = (e) => {
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    didDrag.current    = false;
  };

  const handleTrackMouseMove = (e) => {
    if (!dragOrigin.current) return;
    const dx = Math.abs(e.clientX - dragOrigin.current.x);
    const dy = Math.abs(e.clientY - dragOrigin.current.y);
    if (dx > 5 || dy > 5) didDrag.current = true;
  };

  const handleTrackMouseUp = () => {
    dragOrigin.current = null;
  };

  // Called on the <Link> wrapper — swallow the click when the user was dragging
  const handleCardClick = (e) => {
    if (didDrag.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Box sx={{ position: "relative", px: 3, overflow: "hidden" }}>
      {/* Left arrow — stopPropagation keeps it from bubbling to any card */}
      <IconButton
        onClick={(e) => { e.stopPropagation(); scroll(-1); }}
        aria-label="scroll companies left"
        sx={{
          position: "absolute", left: -4, top: "50%", transform: "translateY(-50%)",
          zIndex: 2, bgcolor: T.white, border: `1.5px solid ${T.border}`,
          color: T.ink, boxShadow: "0 2px 8px rgba(23,59,54,0.10)",
          "&:hover": { bgcolor: T.inkLight },
          "&:focus-visible": { outline: `2px solid ${T.lime}`, outlineOffset: 2 },
        }}
      >
        <ChevronLeftIcon />
      </IconButton>

      {/* Scroll track */}
      <Box
        ref={scrollRef}
        onMouseDown={handleTrackMouseDown}
        onMouseMove={handleTrackMouseMove}
        onMouseUp={handleTrackMouseUp}
        sx={{
          display: "flex", gap: 2, overflowX: "auto", px: 1, py: 1.5,
          scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {companies.map((c, i) => (
          // Use a real <Link> — the entire card surface is a native anchor element
          <Link
            key={i}
            to={`/jobs?keyword=${encodeURIComponent(c.name)}`}
            onClick={handleCardClick}
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            <Box
              sx={{
                width: 190, textDecoration: "none",
                borderRadius: 3, bgcolor: T.white, border: `1.5px solid ${T.border}`,
                p: 2.5, textAlign: "center", cursor: "pointer",
                transition: "box-shadow 0.18s, transform 0.18s, border-color 0.18s",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(33,150,243,0.18)",
                  transform: "translateY(-3px)",
                  borderColor: T.jade,
                },
                "&:focus-visible": { outline: `2px solid ${T.lime}`, outlineOffset: 2 },
              }}
            >
              <Avatar
                src={c.logo}
                alt={c.name}
                sx={{
                  width: 52, height: 52, mx: "auto", mb: 1.5,
                  bgcolor: T.inkLight, color: T.ink, fontWeight: 700, fontSize: 20,
                }}
              >
                {c.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="subtitle2" fontWeight={700} noWrap
                title={c.name} sx={{ color: T.text }}>
                {c.name}
              </Typography>
              <Chip
                label={`${c.openings} opening${c.openings !== 1 ? "s" : ""}`}
                size="small"
                sx={{
                  mt: 0.8,
                  bgcolor: "#E3F2FD",
                  color: "#1565C0",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  border: "1px solid #BBDEFB",
                }}
              />
            </Box>
          </Link>
        ))}
      </Box>

      {/* Right arrow */}
      <IconButton
        onClick={(e) => { e.stopPropagation(); scroll(1); }}
        aria-label="scroll companies right"
        sx={{
          position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)",
          zIndex: 2, bgcolor: T.white, border: `1.5px solid ${T.border}`,
          color: T.ink, boxShadow: "0 2px 8px rgba(23,59,54,0.10)",
          "&:hover": { bgcolor: T.inkLight },
          "&:focus-visible": { outline: `2px solid ${T.lime}`, outlineOffset: 2 },
        }}
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
};

// ── Main Home ─────────────────────────────────────────────────────────────────
const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Support /search/:keyword, /search/location/:location, and
  // /search/:keyword/location/:location  (all three route shapes)
  const { keyword: urlKeyword, location: urlLocation } = useParams();

  const { jobs, setUniqueLocation, pages, loading } = useSelector((s) => s.loadJobs);
  const { jobType: categories } = useSelector((s) => s.jobTypeAll);
  const { userInfo }            = useSelector((s) => s.signIn);
  const role = Number(userInfo?.role?.role ?? userInfo?.role ?? -1);

  const [page,        setPage]        = useState(1);
  const [keyword,     setKeyword]     = useState(urlKeyword  || "");
  const [location,    setLocation]    = useState(urlLocation || "");
  const [emptySearch, setEmptySearch] = useState(false);

  // Keep input boxes in sync when the URL changes (e.g. browser back/forward)
  useEffect(() => {
    setKeyword(urlKeyword   || "");
    setLocation(urlLocation || "");
    setPage(1);
  }, [urlKeyword, urlLocation]);

  useEffect(() => {
    dispatch(jobLoadAction(page, urlKeyword || "", "", urlLocation || ""));
  }, [dispatch, page, urlKeyword, urlLocation]);

  useEffect(() => { dispatch(jobTypeLoadAction()); }, [dispatch]);

  useEffect(() => {
    if (userInfo && role === 0)
      dispatch(savedJobsLoadAction(userInfo.role?._id || userInfo?._id));
  }, [dispatch, userInfo, role]);

  const companies = useMemo(() => {
    const jobList = jobs || [];
    const map = {};
    jobList.forEach((j) => {
      if (!j.companyName) return;
      if (!map[j.companyName])
        map[j.companyName] = { name: j.companyName, openings: 0, location: j.location || "", logo: j.user?.profilePhoto || "" };
      map[j.companyName].openings += 1;
    });
    return Object.values(map).sort((a, b) => b.openings - a.openings);
  }, [jobs]);

  const handleSearch = (e) => {
    e.preventDefault();
    const kw  = keyword.trim();
    const loc = location.trim();

    if (!kw && !loc) {
      setEmptySearch(true);
      return;
    }

    // Navigate to the dedicated results page with query-string params so
    // filters are preserved on refresh and the results are cleanly isolated
    // from the homepage sections.
    const params = new URLSearchParams();
    if (kw)  params.set("keyword",  kw);
    if (loc) params.set("location", loc);
    navigate(`/jobs?${params.toString()}`);
  };

  // Allow pressing Enter inside either input to submit the form
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch(e);
  };

  const handleCategoryClick = (catName) => {
    navigate(`/jobs?keyword=${encodeURIComponent(catName)}`);
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: T.ivory, minHeight: "100vh" }}>
      <Navbar />

      {/* Empty-search validation toast */}
      <Snackbar
        open={emptySearch}
        autoHideDuration={3500}
        onClose={() => setEmptySearch(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setEmptySearch(false)}
          severity="warning"
          variant="filled"
          sx={{ borderRadius: 3, fontWeight: 700 }}
        >
          Please enter a keyword or location to search.
        </Alert>
      </Snackbar>

      {/* ══════════════════════ HERO / SEARCH ══════════════════════ */}
      <Box sx={{ bgcolor: T.ink, color: T.white, pt: { xs: 7, md: 11 }, pb: { xs: 7, md: 11 } }}>
        <Container maxWidth="md">
          <Typography
            variant="h3" fontWeight={900} textAlign="center"
            sx={{ mb: 1.5, fontSize: { xs: "2rem", md: "2.8rem" }, lineHeight: 1.18, letterSpacing: "-0.01em" }}
          >
            Find Your Dream Job Today
          </Typography>
          <Typography
            variant="h6" textAlign="center"
            sx={{ mb: 4.5, fontWeight: 400, color: "rgba(255,255,255,0.85)", fontSize: { xs: "1rem", md: "1.15rem" } }}
          >
            Thousands of opportunities across top companies — matched to your skills.
          </Typography>

          {/* Search bar */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              display: "flex", flexDirection: { xs: "column", sm: "row" },
              gap: 1.5, bgcolor: T.white, borderRadius: "14px",
              p: { xs: 2, sm: 1.5 }, boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
            }}
          >
            <OutlinedInput
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Job title, keyword, or company"
              startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: T.jade }} /></InputAdornment>}
              sx={{
                flex: 2, "& fieldset": { border: "none" },
                bgcolor: T.ivory, borderRadius: "10px", fontSize: "0.97rem", color: T.text,
                "&:hover": { bgcolor: "#E8F4FE" },
              }}
            />
            <OutlinedInput
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Location (city, remote…)"
              startAdornment={<InputAdornment position="start"><LocationOnIcon sx={{ color: T.jade }} /></InputAdornment>}
              sx={{
                flex: 1.5, "& fieldset": { border: "none" },
                bgcolor: T.ivory, borderRadius: "10px", fontSize: "0.97rem", color: T.text,
                "&:hover": { bgcolor: "#E8F4FE" },
              }}
            />
            <Button
              type="submit" variant="contained" size="large" startIcon={<SearchIcon />}
              sx={{
                px: 4, borderRadius: "10px", fontWeight: 800, textTransform: "none",
                bgcolor: T.ink, color: T.white, flexShrink: 0, fontSize: "1rem",
                boxShadow: "none",
                "&:hover": { bgcolor: T.jade, boxShadow: "none" },
                "&:focus-visible": { outline: `2px solid ${T.white}`, outlineOffset: 2 },
              }}
            >
              Search Jobs
            </Button>
          </Box>

          {/* Quick stats */}
          <Stack
            direction={{ xs: "column", sm: "row" }} justifyContent="center"
            spacing={{ xs: 1, sm: 3 }} mt={3.5}
          >
            {[
              `${(jobs || []).length}+ live jobs`,
              `${companies.length} companies hiring`,
              "Free to apply",
            ].map((t, i) => (
              <Stack key={i} direction="row" alignItems="center" spacing={0.8}>
                <CheckCircleIcon sx={{ fontSize: 16, color: T.lime }} />
                <Typography variant="body2" fontWeight={600} sx={{ color: "rgba(255,255,255,0.90)" }}>
                  {t}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ══════════════════════ COMPANY CAROUSEL ══════════════════════ */}
      {companies.length > 0 && (
        <Box sx={{ bgcolor: T.ivory, py: 6, borderBottom: `1px solid ${T.border}` }}>
          <Container maxWidth="xl">
            <SectionHeading
              title="Companies Actively Hiring"
              subtitle="Real companies with open positions right now"
            />
            <CompanyCarousel companies={companies} />
          </Container>
        </Box>
      )}

      {/* ══════════════════════ POPULAR CATEGORIES ══════════════════════ */}
      {categories && categories.length > 0 && (
        <Box sx={{ bgcolor: T.ivory, py: 8, borderBottom: `1px solid ${T.border}` }}>
          <Container maxWidth="xl">
            <SectionHeading
              title="Popular Job Categories"
              subtitle="Explore opportunities by category and find your fit"
            />
            <Grid container spacing={2}>
              {categories.slice(0, 12).map((cat, i) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={cat._id || i}>
                  <Card
                    onClick={() => handleCategoryClick(cat.jobTypeName)}
                    sx={{
                      borderRadius: 3, cursor: "pointer", textAlign: "center",
                      p: 2.5, border: `1.5px solid ${T.border}`, bgcolor: T.white,
                      boxShadow: "none", transition: "all 0.18s",
                      "&:hover": {
                        borderColor: T.jade,
                        bgcolor: T.inkLight,
                        transform: "translateY(-3px)",
                        boxShadow: "0 6px 18px rgba(23,59,54,0.10)",
                      },
                      "&:focus-visible": { outline: `2px solid ${T.lime}`, outlineOffset: 2 },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 44, height: 44, mx: "auto", mb: 1.5,
                        bgcolor: T.inkLight, color: T.ink,
                      }}
                    >
                      <CategoryIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    <Typography variant="body2" fontWeight={700} sx={{ color: T.text, lineHeight: 1.4 }}>
                      {cat.jobTypeName}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* ══════════════════════ AI RESUME ANALYZER ══════════════════════ */}
      <Box sx={{ bgcolor: T.ink, py: 9 }}>
        <Container maxWidth="md">
          <Stack alignItems="center" spacing={2.5} textAlign="center">
            <Avatar
              sx={{
                width: 72, height: 72,
                bgcolor: "rgba(215,241,113,0.18)",
                border: `2px solid ${T.lime}`,
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 38, color: T.lime }} />
            </Avatar>

            <Typography variant="h4" fontWeight={800} sx={{ color: T.white }}>
              AI-Powered Resume Analyzer
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: "rgba(246,244,236,0.80)", maxWidth: 560, lineHeight: 1.75 }}
            >
              Upload your resume and instantly see which jobs match your skills.
              Get a skill gap analysis, matched vs. missing skills, a personalised
              preparation plan with resources, exercises, and interview questions —
              all generated by AI for your specific target role.
            </Typography>

            <Grid container spacing={1.5} justifyContent="center" sx={{ mt: 0.5, maxWidth: 520 }}>
              {["Skill Match Score", "Matched & Missing Skills", "AI Preparation Plan", "Weekly Progress Tracker"].map((f, i) => (
                <Grid item xs={6} key={i}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 17, color: T.lime }} />
                    <Typography variant="body2" fontWeight={600} sx={{ color: "rgba(246,244,236,0.88)" }}>
                      {f}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={1.5}>
              {userInfo && role === 0 ? (
                <Button
                  component={Link} to="/user/resume-recommendations"
                  variant="contained" size="large" startIcon={<AutoAwesomeIcon />}
                  sx={{
                    bgcolor: T.lime, color: T.ink, fontWeight: 800,
                    borderRadius: "10px", px: 4, textTransform: "none", boxShadow: "none",
                    "&:hover": { bgcolor: "#C8E55A", boxShadow: "none" },
                    "&:focus-visible": { outline: `2px solid ${T.white}`, outlineOffset: 2 },
                  }}
                >
                  Analyze My Resume
                </Button>
              ) : (
                <>
                  <Button
                    component={Link} to="/login"
                    variant="contained" size="large" startIcon={<AutoAwesomeIcon />}
                    sx={{
                      bgcolor: T.lime, color: T.ink, fontWeight: 800,
                      borderRadius: "10px", px: 4, textTransform: "none", boxShadow: "none",
                      "&:hover": { bgcolor: "#C8E55A", boxShadow: "none" },
                      "&:focus-visible": { outline: `2px solid ${T.white}`, outlineOffset: 2 },
                    }}
                  >
                    Candidate Login to Analyze
                  </Button>
                  <Button
                    component={Link} to="/register"
                    variant="outlined" size="large"
                    sx={{
                      borderColor: "rgba(246,244,236,0.45)", color: T.ivory,
                      fontWeight: 700, borderRadius: "10px", px: 4, textTransform: "none",
                      "&:hover": { bgcolor: "rgba(246,244,236,0.08)", borderColor: T.ivory },
                      "&:focus-visible": { outline: `2px solid ${T.lime}`, outlineOffset: 2 },
                    }}
                  >
                    Create Free Account
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ══════════════════════ JOB LISTINGS ══════════════════════ */}
      <Box sx={{ bgcolor: T.ivory, py: 8 }}>
        <Container maxWidth="xl">
          {/* Section heading — context-aware */}
          {urlKeyword || urlLocation ? (
            <SectionHeading
              title={
                urlKeyword && urlLocation
                  ? `Results for "${urlKeyword}" in ${urlLocation}`
                  : urlKeyword
                  ? `Results for "${urlKeyword}"`
                  : `Jobs in ${urlLocation}`
              }
              subtitle={`${(jobs || []).length} job${(jobs || []).length !== 1 ? "s" : ""} found`}
            />
          ) : (
            <SectionHeading
              title="Latest Job Openings"
              subtitle="Browse fresh opportunities added by verified recruiters"
            />
          )}

          {/* Location filter chips */}
          {setUniqueLocation && setUniqueLocation.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1} mb={4} justifyContent="center">
              <Chip
                label="All Locations"
                onClick={() => navigate("/")}
                sx={{
                  fontWeight: 700, cursor: "pointer",
                  bgcolor: !urlLocation ? T.ink : T.white,
                  color:   !urlLocation ? T.white : T.text,
                  border:  `1.5px solid ${!urlLocation ? T.ink : T.border}`,
                  "&:hover": { bgcolor: !urlLocation ? T.jade : T.inkLight },
                  "&:focus-visible": { outline: `2px solid ${T.lime}`, outlineOffset: 2 },
                }}
              />
              {setUniqueLocation.map((loc, i) => {
                const active = urlLocation === loc;
                return (
                  <Chip
                    key={i}
                    label={loc}
                    icon={<LocationOnIcon sx={{ fontSize: "13px !important", color: active ? `${T.white} !important` : `${T.jade} !important` }} />}
                    onClick={() => navigate(`/search/location/${encodeURIComponent(loc)}`)}
                    sx={{
                      fontWeight: 600, cursor: "pointer",
                      bgcolor: active ? T.ink : T.white,
                      color:   active ? T.white : T.text,
                      border:  `1.5px solid ${active ? T.ink : T.border}`,
                      "&:hover": { bgcolor: active ? T.jade : T.inkLight },
                      "&:focus-visible": { outline: `2px solid ${T.lime}`, outlineOffset: 2 },
                    }}
                  />
                );
              })}
            </Stack>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress sx={{ color: T.jade }} />
            </Box>
          ) : !jobs || jobs.length === 0 ? (
            <Alert
              severity="info"
              sx={{
                maxWidth: 480, mx: "auto", borderRadius: 3,
                bgcolor: T.inkLight, color: T.ink, border: `1px solid ${T.border}`,
                "& .MuiAlert-icon": { color: T.jade },
              }}
            >
              No jobs found for that search. Try a different keyword or location.
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

          {pages > 1 && (
            <Stack alignItems="center" mt={5}>
              <Pagination
                page={page}
                count={pages === 0 ? 1 : pages}
                onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                sx={{
                  "& .MuiPaginationItem-root": { color: T.ink, borderColor: T.border },
                  "& .Mui-selected": { bgcolor: `${T.ink} !important`, color: `${T.white} !important` },
                  "& .MuiPaginationItem-root:hover": { bgcolor: T.inkLight },
                }}
              />
            </Stack>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default Home;
