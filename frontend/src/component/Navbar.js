import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import WorkIcon from "@mui/icons-material/Work";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@emotion/react";
import { useDispatch, useSelector } from "react-redux";
import NotificationCenter from "./NotificationCenter";

const pages = ["Home", "Log In"];

const Navbar = () => {
  const { userInfo } = useSelector((state) => state.signIn);
  const { user } = useSelector((state) => state.userprofile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { palette } = useTheme();
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [search, setSearch] = React.useState(false);
  const account = user || userInfo?.role || {};
  const accountName = [account.firstName, account.lastName]
    .filter(Boolean)
    .join(" ");
  const accountInitials = accountName
    .split(/\s+/)
    .filter(Boolean)
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  const handleSearch = () => {
    setSearch(true);
    navigate("/search");
  };

  // log out user
  const logOutUser = () => {
    window.localStorage.removeItem("userInfo");
    document.cookie = `token=${""}; expires=${new Date().getTime() - 1000};`;
    window.location.reload(true);
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  return (
    <AppBar position="static" sx={{ bgcolor: palette.primary.main }}>
      <Container>
        <Toolbar disableGutters>
          <WorkIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            JOB PORTAL
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {pages.map((page) => (
                <MenuItem key={page} onClick={handleCloseNavMenu}>
                  <Typography textAlign="center">{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <WorkIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href=""
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".2rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            JOB PORTAL
          </Typography>
          <Box
            sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              onClick={handleCloseNavMenu}
              sx={{ my: 2, color: "white", display: "block" }}
            >
              <Link to="/" style={{ color: "white", textDecoration: "none" }}>
                Home
              </Link>
            </Button>
            {!userInfo && (
              <Button
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                <Link
                  to="/register"
                  style={{ color: "white", textDecoration: "none" }}
                >
                  Register
                </Link>
              </Button>
            )}
            <Button onClick={handleSearch}>
              <Link
                to="/search"
                style={{ color: "white", textDecoration: "none" }}
              >
                Preparation
              </Link>
            </Button>
          </Box>

          <Box
            sx={{
              flexGrow: 0,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {userInfo &&
              [0, 1].includes(
                Number(userInfo?.role?.role ?? userInfo?.role ?? 0),
              ) && (
                <NotificationCenter
                  key={userInfo?.role?._id || userInfo?._id}
                  userId={userInfo?.role?._id || userInfo?._id}
                  isRecruiter={
                    Number(userInfo?.role?.role ?? userInfo?.role ?? 0) === 1
                  }
                />
              )}
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  sx={{ color: palette.primary.white }}
                  alt={accountName || "Account profile"}
                  src={account.profilePhoto || undefined}
                >
                  {accountInitials}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              PaperProps={{
                sx: {
                  "& 	.MuiMenu-list": {
                    bgcolor: "primary.white",
                    color: "white",
                  },
                },
              }}
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {userInfo &&
                Number(userInfo?.role?.role ?? userInfo?.role ?? 0) === 1 && (
                  <>
                    <MenuItem onClick={handleCloseUserMenu}>
                      <Typography textAlign="center">
                        <Link
                          style={{
                            textDecoration: "none",
                            color: palette.secondary.main,
                          }}
                          to="/recruiter/dashboard"
                        >
                          Recruiter Dashboard
                        </Link>
                      </Typography>
                    </MenuItem>
                    <MenuItem onClick={handleCloseUserMenu}>
                      <Typography textAlign="center">
                        <Link
                          style={{
                            textDecoration: "none",
                            color: palette.secondary.main,
                          }}
                          to="/recruiter/users"
                        >
                          Received Applications
                        </Link>
                      </Typography>
                    </MenuItem>
                  </>
                )}
              {userInfo &&
                Number(userInfo?.role?.role ?? userInfo?.role ?? 0) === 0 && (
                  <MenuItem onClick={handleCloseUserMenu}>
                    <Typography textAlign="center">
                      <Link
                        style={{
                          textDecoration: "none",
                          color: palette.secondary.main,
                        }}
                        to="/user/dashboard"
                      >
                        User Dashboard
                      </Link>
                    </Typography>
                  </MenuItem>
                )}
              {userInfo &&
                Number(userInfo?.role?.role ?? userInfo?.role ?? 0) === 2 && (
                  <MenuItem onClick={handleCloseUserMenu}>
                    <Typography textAlign="center">
                      <Link
                        style={{
                          textDecoration: "none",
                          color: palette.secondary.main,
                        }}
                        to="/mainadmin"
                      >
                        Admin Dashboard
                      </Link>
                    </Typography>
                  </MenuItem>
                )}
              {!userInfo ? (
                <MenuItem onClick={handleCloseUserMenu}>
                  <Typography textAlign="center">
                    <Link
                      style={{
                        textDecoration: "none",
                        color: palette.secondary.main,
                      }}
                      to="/login"
                    >
                      Log In
                    </Link>
                  </Typography>
                </MenuItem>
              ) : (
                <MenuItem onClick={logOutUser}>
                  <Typography
                    style={{
                      textDecoration: "none",
                      color: palette.secondary.main,
                    }}
                    textAlign="center"
                  >
                    Log Out
                  </Typography>
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
