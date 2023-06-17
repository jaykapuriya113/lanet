import * as React from "react";
import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import { useProSidebar } from "react-pro-sidebar";

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: "",
}));

const HeaderTop = () => {
  const { collapseSidebar } = useProSidebar();
  return (
    <Box sx={{ flexGrow: 1 }}>
      <StyledAppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            onClick={() => collapseSidebar()}
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            color="inherit"
            sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
          >
            Dashboard
          </Typography>
        </Toolbar>
      </StyledAppBar>
    </Box>
  );
};

export default HeaderTop;
