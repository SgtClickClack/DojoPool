import { Box } from "@mui/material";
import Navbar from "./Navbar";
import React from "react";

const Layout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
        color: "#fff",
        fontFamily: 'Orbitron, Roboto Mono, monospace',
        boxShadow: "0 0 40px #00ff9d, 0 0 80px #00a8ff inset",
        border: "2px solid #00ff9d",
      }}
    >
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "transparent",
          color: "inherit",
          px: { xs: 1, md: 4 },
          py: { xs: 2, md: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
