import * as React from "react";
import AppBar        from "@mui/material/AppBar";
import Box           from "@mui/material/Box";
import Toolbar       from "@mui/material/Toolbar";
import IconButton    from "@mui/material/IconButton";
import Typography    from "@mui/material/Typography";
import Menu          from "@mui/material/Menu";
import MenuIcon      from "@mui/icons-material/Menu";
import Container     from "@mui/material/Container";
import Avatar        from "@mui/material/Avatar";
import Button        from "@mui/material/Button";
import Tooltip       from "@mui/material/Tooltip";
import MenuItem      from "@mui/material/MenuItem";
import Divider       from "@mui/material/Divider";
import ListItemIcon  from "@mui/material/ListItemIcon";
import CircularProgress from "@mui/material/CircularProgress";
import WorkIcon             from "@mui/icons-material/Work";
import AutoAwesomeIcon      from "@mui/icons-material/AutoAwesome";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LocationOnIcon        from "@mui/icons-material/LocationOn";
import BusinessIcon          from "@mui/icons-material/Business";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import PersonIcon            from "@mui/icons-material/Person";
import BadgeIcon             from "@mui/icons-material/Badge";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, useNavigate } from "react-router-dom";
import { useTheme }    from "@emotion/react";
import { useDispatch, useSelector } from "react-redux";
import axios           from "axios";
import NotificationCenter from "./NotificationCenter";
import { userLogoutAction } from "../redux/actions/userAction";

// How many jobs to show in the dropdown preview
const DROPDOWN_JOB_LIMIT = 8;

const Navbar = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.signIn);
  const { user }     = useSelector((state) => state.userprofile);
  const navigate     = useNavigate();
  const { palette }  = useTheme();

  // ── menu anchors ────────────────────────────────────────────────────────────
  const [anchorElNav,   setAnchorElNav]   = React.useState(null);
  const [anchorElUser,  setAnchorElUser]  = React.useState(null);
  const [anchorElTools, setAnchorElTools] = React.useState(null);
  const [anchorElJobs,  setAnchorElJobs]  = React.useState(null);

  // ── jobs dropdown state ─────────────────────────────────────────────────────
  const [dropdownJobs,  setDropdownJobs]  = React.useState([]);
  const [jobsLoading,   setJobsLoading]   = React.useState(false);
  const [jobsLoadError, setJobsLoadError] = React.useState("");

  // ── account helpers ─────────────────────────────────────────────────────────
  const account         = user || userInfo?.role || {};
  const accountName     = [account.firstName, account.lastName].filter(Boolean).join(" ");
  const accountInitials = accountName
    .split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const role = Number(userInfo?.role?.role ?? userInfo?.role ?? -1);

  // ── fetch jobs when the jobs dropdown opens ─────────────────────────────────
  React.useEffect(() => {
    if (!anchorElJobs) return;
    let cancelled = false;
    const fetchJobs = async () => {
      setJobsLoading(true);
      setJobsLoadError("");
      try {
        const { data } = await axios.get("/api/jobs/showalljobs");
        if (cancelled) return;
        const list = (data?.jobs || [])
          .filter((j) => !j.isDeleted)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, DROPDOWN_JOB_LIMIT);
        setDropdownJobs(list);
      } catch {
        if (!cancelled) setJobsLoadError("Could not load jobs.");
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    };
    fetchJobs();
    return () => { cancelled = true; };
  }, [anchorElJobs]);

  const closeJobsMenu  = () => setAnchorElJobs(null);
  const closeUserMenu  = () => setAnchorElUser(null);
  const closeToolsMenu = () => setAnchorElTools(null);
  const closeNavMenu   = () => setAnchorElNav(null);
  const handleLogout = () => {
    closeUserMenu();
    dispatch(userLogoutAction());
    navigate("/login");
  };

  // ── shared paper style ───────────────────────────────────────────────────────
  const menuPaper = {
    sx: { mt: 1, minWidth: 220, boxShadow: "0 4px 20px rgba(33,150,243,0.15)" },
  };

  return (
    <AppBar position="static" sx={{ bgcolor: palette.primary.main, boxShadow: 2 }}>
      {/*
       * maxWidth={false} + explicit px removes the Container's own max-width
       * cap and its auto-centering margin, so the Toolbar truly fills the full
       * AppBar width at every viewport size.  Horizontal padding is kept via
       * the `px` prop so content never touches the edge.
       */}
      <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Toolbar disableGutters sx={{ gap: 0 }}>

          {/* ── Logo desktop ─────────────────────────────────────────────── */}
          <WorkIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1 }} />
          <Typography
            variant="h6" noWrap component="a" href="/"
            sx={{
              mr: 3, display: { xs: "none", md: "flex" },
              fontFamily: "monospace", fontWeight: 700, letterSpacing: ".3rem",
              color: "inherit", textDecoration: "none",
            }}
          >
            JOB PORTAL
          </Typography>

          {/* ── Mobile hamburger ─────────────────────────────────────────── */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton size="large" color="inherit"
              onClick={(e) => setAnchorElNav(e.currentTarget)}>
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={closeNavMenu}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              <MenuItem component={Link} to="/" onClick={closeNavMenu}>Home</MenuItem>
              <MenuItem component={Link} to="/jobs" onClick={closeNavMenu}>All Jobs</MenuItem>
              {!userInfo && <Divider />}
              {!userInfo && (
                <MenuItem component={Link} to="/login" onClick={closeNavMenu}>
                  Candidate Login
                </MenuItem>
              )}
              {!userInfo && (
                <MenuItem component={Link} to="/login" onClick={closeNavMenu}>
                  Recruiter Login
                </MenuItem>
              )}
              {userInfo && role === 0 && (
                <MenuItem component={Link} to="/user/resume-recommendations"
                  onClick={closeNavMenu}>
                  AI Resume Analyzer
                </MenuItem>
              )}
            </Menu>
          </Box>

          {/* ── Logo mobile ──────────────────────────────────────────────── */}
          <WorkIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
          <Typography variant="h6" noWrap component="a" href="/"
            sx={{
              mr: 2, display: { xs: "flex", md: "none" }, flexGrow: 1,
              fontFamily: "monospace", fontWeight: 700, letterSpacing: ".2rem",
              color: "inherit", textDecoration: "none",
            }}
          >
            JOB PORTAL
          </Typography>

          {/* ── Desktop nav links ─────────────────────────────────────────── */}
          {/*
           * minWidth: 0 allows this box to shrink below its natural content
           * width when the viewport narrows, preventing it from pushing the
           * avatar off-screen.  overflow: hidden clips button text before the
           * avatar is displaced.
           */}
          <Box sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden", display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
            <Button component={Link} to="/"
              sx={{ color: "white", textTransform: "none", fontWeight: 600 }}>
              Home
            </Button>

            {/* Jobs dropdown trigger */}
            <Button
              endIcon={
                <KeyboardArrowDownIcon sx={{
                  transition: "transform 0.2s",
                  transform: anchorElJobs ? "rotate(180deg)" : "rotate(0deg)",
                }} />
              }
              onClick={(e) => setAnchorElJobs(e.currentTarget)}
              sx={{ color: "white", textTransform: "none", fontWeight: 600 }}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorElJobs)}
            >
              Jobs
            </Button>

            {/* Jobs dropdown menu */}
            <Menu
              anchorEl={anchorElJobs}
              open={Boolean(anchorElJobs)}
              onClose={closeJobsMenu}
              PaperProps={{
                sx: {
                  mt: 1, minWidth: 320, maxWidth: 400, maxHeight: 480,
                  boxShadow: "0 4px 24px rgba(33,150,243,0.18)",
                  borderRadius: 2, border: "1px solid #BBDEFB",
                  overflow: "hidden", display: "flex", flexDirection: "column",
                },
              }}
              transformOrigin={{ horizontal: "left", vertical: "top" }}
              anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
            >
              <Box sx={{ px: 2, py: 1.5, bgcolor: "#E3F2FD", borderBottom: "1px solid #BBDEFB", flexShrink: 0 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#1565C0" }}>
                  Latest Job Openings
                </Typography>
              </Box>

              <Box sx={{ overflowY: "auto", flex: 1 }}>
                {jobsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={28} sx={{ color: "#2196F3" }} />
                  </Box>
                ) : jobsLoadError ? (
                  <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">{jobsLoadError}</Typography>
                  </Box>
                ) : dropdownJobs.length === 0 ? (
                  <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">No jobs available right now.</Typography>
                  </Box>
                ) : (
                  dropdownJobs.map((job) => (
                    <MenuItem
                      key={job._id}
                      component={Link}
                      to={`/job/${job._id}`}
                      onClick={closeJobsMenu}
                      sx={{
                        py: 1.2, px: 2, alignItems: "flex-start", gap: 1.5,
                        borderBottom: "1px solid #F0F8FF",
                        "&:hover": { bgcolor: "#E3F2FD" },
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Avatar
                        src={job.user?.profilePhoto}
                        sx={{ width: 34, height: 34, mt: 0.3, flexShrink: 0,
                          bgcolor: "#BBDEFB", color: "#1565C0", fontSize: 14, fontWeight: 700 }}
                      >
                        {(job.companyName || "J").charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700}
                          sx={{ color: "#263238", whiteSpace: "nowrap",
                            overflow: "hidden", textOverflow: "ellipsis", maxWidth: 240 }}>
                          {job.title}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.3, flexWrap: "wrap" }}>
                          {job.companyName && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                              <BusinessIcon sx={{ fontSize: 11, color: "#1689D5" }} />
                              <Typography variant="caption" sx={{ color: "#546E7A", lineHeight: 1 }}>
                                {job.companyName}
                              </Typography>
                            </Box>
                          )}
                          {job.location && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                              <LocationOnIcon sx={{ fontSize: 11, color: "#1689D5" }} />
                              <Typography variant="caption" sx={{ color: "#546E7A", lineHeight: 1 }}>
                                {job.location}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Box>

              <Divider sx={{ flexShrink: 0 }} />
              <MenuItem
                component={Link} to="/jobs" onClick={closeJobsMenu}
                sx={{ py: 1.2, justifyContent: "center", gap: 1,
                  bgcolor: "#F0F8FF", "&:hover": { bgcolor: "#E3F2FD" }, flexShrink: 0 }}
              >
                <FormatListBulletedIcon sx={{ fontSize: 16, color: "#2196F3" }} />
                <Typography variant="body2" fontWeight={700} sx={{ color: "#2196F3" }}>
                  View All Jobs
                </Typography>
              </MenuItem>
            </Menu>

            {/* Resume Tools dropdown */}
            <Button
              endIcon={<KeyboardArrowDownIcon />}
              onClick={(e) => setAnchorElTools(e.currentTarget)}
              sx={{ color: "white", textTransform: "none", fontWeight: 600 }}
            >
              Resume Tools
            </Button>
            <Menu
              anchorEl={anchorElTools}
              open={Boolean(anchorElTools)}
              onClose={closeToolsMenu}
              PaperProps={menuPaper}
            >
              <MenuItem
                component={userInfo && role === 0 ? Link : "div"}
                to={userInfo && role === 0 ? "/user/resume-recommendations" : undefined}
                onClick={() => {
                  closeToolsMenu();
                  if (!userInfo || role !== 0) navigate("/login");
                }}
                sx={{ gap: 1 }}
              >
                <AutoAwesomeIcon fontSize="small" sx={{ color: palette.primary.main }} />
                AI Resume Analyzer
              </MenuItem>
            </Menu>
          </Box>

          {/* ── Right-side: notifications + avatar ───────────────────────── */}
          {/*
           * flexShrink: 0 ensures this box NEVER collapses, so the avatar is
           * always visible regardless of how narrow the viewport is.
           * ml: "auto" pushes it to the far right inside the Toolbar.
           */}
          <Box sx={{ flexGrow: 0, flexShrink: 0, ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            {userInfo && [0, 1].includes(role) && (
              <NotificationCenter
                key={userInfo?.role?._id || userInfo?._id}
                userId={userInfo?.role?._id || userInfo?._id}
                isRecruiter={role === 1}
              />
            )}

            {/* Profile / guest icon — single entry point for account actions */}
            <Tooltip title={userInfo ? "Account" : "Log in"}>
              <IconButton onClick={(e) => setAnchorElUser(e.currentTarget)} sx={{ p: 0 }}>
                <Avatar
                  alt={accountName || "Account"}
                  src={account.profilePhoto || undefined}
                  sx={{ color: palette.primary.white }}
                >
                  {accountInitials}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              sx={{ mt: "45px" }}
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={closeUserMenu}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{ sx: { minWidth: 200 } }}
            >
              {/* ── Logged-out: show login options ─────────────────────── */}
              {!userInfo && [
                <MenuItem key="cl" component={Link} to="/login" onClick={closeUserMenu}>
                  <ListItemIcon><PersonIcon fontSize="small" sx={{ color: "#2196F3" }} /></ListItemIcon>
                  <Typography sx={{ color: "#263238" }}>Candidate Login</Typography>
                </MenuItem>,
                <MenuItem key="rl" component={Link} to="/login" onClick={closeUserMenu}>
                  <ListItemIcon><BadgeIcon fontSize="small" sx={{ color: "#2196F3" }} /></ListItemIcon>
                  <Typography sx={{ color: "#263238" }}>Recruiter Login</Typography>
                </MenuItem>,
              ]}

              {/* ── Logged-in: role-specific dashboard links ─────────── */}
              {userInfo && role === 1 && [
                <MenuItem key="rd" component={Link} to="/recruiter/dashboard" onClick={closeUserMenu}>
                  <Typography sx={{ color: palette.secondary.main }}>Recruiter Dashboard</Typography>
                </MenuItem>,
                <MenuItem key="ra" component={Link} to="/recruiter/users" onClick={closeUserMenu}>
                  <Typography sx={{ color: palette.secondary.main }}>Received Applications</Typography>
                </MenuItem>,
              ]}
              {userInfo && role === 0 && (
                <MenuItem component={Link} to="/user/dashboard" onClick={closeUserMenu}>
                  <Typography sx={{ color: palette.secondary.main }}>User Dashboard</Typography>
                </MenuItem>
              )}
              {userInfo && role === 2 && (
                <MenuItem component={Link} to="/mainadmin" onClick={closeUserMenu}>
                  <Typography sx={{ color: palette.secondary.main }}>Admin Dashboard</Typography>
                </MenuItem>
              )}
              {userInfo && <Divider />}
              {userInfo && (
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography sx={{ color: palette.secondary.main }}>Logout</Typography>
                </MenuItem>
              )}
            </Menu>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
