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
    <AppBar position="sticky">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <IconButton
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              color: "inherit",
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
              color: "inherit",
              textDecoration: "none",
            }}
          >
            DojoPool
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Button
              component={RouterLink}
              to="/practice"
              sx={{ my: 2, color: "white", display: "block" }}
            >
              Practice
            </Button>
            <Button
              component={RouterLink}
              to="/analysis"
              sx={{ my: 2, color: "white", display: "block" }}
            >
              Analysis
            </Button>
            <Button
              component={RouterLink}
              to="/monitoring"
              sx={{ my: 2, color: "white", display: "block" }}
            >
              Monitoring
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
