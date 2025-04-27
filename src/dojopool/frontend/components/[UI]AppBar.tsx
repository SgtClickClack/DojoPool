import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

// Use logo.svg from public folder
const LOGO_SRC = "/logo.svg";

const DojoPoolAppBar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: `2px solid ${theme.palette.primary.main}`, background: theme.palette.background.paper }}>
      <Toolbar sx={{ minHeight: isMobile ? 48 : 64, px: { xs: 1, sm: 2, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img src={LOGO_SRC} alt="DojoPool Logo" style={{ height: isMobile ? 32 : 48, marginRight: isMobile ? 8 : 16 }} />
          <Typography
            variant={isMobile ? "h6" : "h4"}
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              textShadow: "0 0 8px #00ff9f44",
              letterSpacing: "0.04em",
              userSelect: "none",
            }}
            noWrap
          >
            DojoPool
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DojoPoolAppBar;
