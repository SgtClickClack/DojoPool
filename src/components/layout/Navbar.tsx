import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const Navbar = () => {
  return (
    <AppBar 
      position="sticky"
      sx={{
        background: "linear-gradient(90deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
        borderBottom: "2px solid #00ff9d",
        boxShadow: "0 0 20px #00ff9d, 0 0 40px #00a8ff",
        backdropFilter: "blur(10px)",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <IconButton
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              color: "#00ff9d",
              "&:hover": {
                color: "#00a8ff",
                transform: "scale(1.1)",
                transition: "all 0.3s ease",
              },
            }}
          >
            <SportsEsportsIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontWeight: 700,
              color: "#00ff9d",
              textDecoration: "none",
              fontFamily: 'Orbitron, monospace',
              textShadow: "0 0 10px #00ff9d",
              "&:hover": {
                color: "#00a8ff",
                textShadow: "0 0 15px #00a8ff",
                transition: "all 0.3s ease",
              },
            }}
          >
            DojoPool
          </Typography>
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
                  textShadow: "0 0 10px #00a8ff",
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
                  textShadow: "0 0 10px #00a8ff",
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
                  textShadow: "0 0 10px #00a8ff",
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
