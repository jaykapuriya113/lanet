import { Box } from "@mui/material";
import React from "react";
import SidebarAdm from "./Sidebar";
import HeaderTop from "./HeaderTop";

const Layout =
  (Component) =>
  ({ ...props }) => {
    return (
      <>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            width: "100%",
            overflowX: "hidden",
          }}
        >
          <SidebarAdm />
          <Box sx={{ flex: "1 1 0%", minWidth: 0, bgcolor: "LightGray" }}>
            <HeaderTop />
            <Box sx={{ p: { xs: 1.5, sm: 3 }, minWidth: 0, overflowX: "hidden" }}>
              <Component {...props} />
            </Box>
          </Box>
        </div>
      </>
    );
  };

export default Layout;
