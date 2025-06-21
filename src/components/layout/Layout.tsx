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
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
        color: "#fff",
        fontFamily: 'Orbitron, Roboto Mono, monospace',
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(circle at 20% 80%, rgba(0,255,157,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,168,255,0.1) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0
        }
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
          position: "relative",
          zIndex: 1
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
