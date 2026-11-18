import * as React from "react";
import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useProSidebar } from "react-pro-sidebar";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { userLogoutAction } from "../../redux/actions/userAction";

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: "",
}));

const HeaderTop = () => {
  const { collapseSidebar, toggleSidebar, broken } = useProSidebar();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(userLogoutAction());
    navigate("/login");
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <StyledAppBar
        position="sticky"
        elevation={0}
        sx={{ top: 0, zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ gap: 1, minWidth: 0 }}>
          <IconButton
            onClick={() =>
              broken ? toggleSidebar() : collapseSidebar()
            }
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            sx={{ mr: { xs: 0.5, sm: 1 }, flexShrink: 0 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            color="inherit"
            sx={{
              flex: "1 1 auto",
              minWidth: 0,
              display: { xs: "none", sm: "block" },
            }}
          >
            Dashboard
          </Typography>
          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            aria-label="Logout"
            sx={{
              ml: "auto",
              minWidth: "auto",
              flexShrink: 0,
              px: { xs: 1, sm: 1.5 },
              py: 0.75,
              borderRadius: 1.5,
              color: "inherit",
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.08)",
              },
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </StyledAppBar>
    </Box>
  );
};

export default HeaderTop;
