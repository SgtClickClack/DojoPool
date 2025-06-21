import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Typography,
  Avatar,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const Navbar = () => {
  return (
    <AppBar 
      position="sticky"
      sx={{
        background: "linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(26,26,26,0.95) 50%, rgba(10,10,10,0.95) 100%)",
        borderBottom: "1px solid rgba(0,255,157,0.3)",
        boxShadow: "0 4px 20px rgba(0,255,157,0.2)",
        backdropFilter: "blur(20px)",
        zIndex: 1200
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              mr: 3
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: "linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)",
                mr: 1,
                boxShadow: "0 0 15px rgba(0,255,157,0.5)"
              }}
            >
              <SportsEsportsIcon sx={{ color: "#000", fontSize: 24 }} />
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#00ff9d",
                fontFamily: 'Orbitron, monospace',
                textShadow: "0 0 10px rgba(0,255,157,0.5)",
                "&:hover": {
                  color: "#00a8ff",
                  textShadow: "0 0 15px rgba(0,168,255,0.5)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              DojoPool
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Button
              component={RouterLink}
              to="/dashboard"
              sx={{ 
                color: "#00ff9d", 
                display: "block",
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                "&:hover": {
                  color: "#00a8ff",
                  textShadow: "0 0 10px rgba(0,168,255,0.5)",
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Dashboard
            </Button>
            <Button
              component={RouterLink}
              to="/map"
              sx={{ 
                color: "#00ff9d", 
                display: "block",
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                "&:hover": {
                  color: "#00a8ff",
                  textShadow: "0 0 10px rgba(0,168,255,0.5)",
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Map
            </Button>
            <Button
              component={RouterLink}
              to="/ledger"
              sx={{ 
                color: "#00ff9d", 
                display: "block",
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mx: 2,
                "&:hover": {
                  color: "#00a8ff",
                  textShadow: "0 0 10px rgba(0,168,255,0.5)",
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Ledger
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
