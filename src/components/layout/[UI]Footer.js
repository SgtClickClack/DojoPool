import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import {
  Box,
  Container,
  Grid,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const Footer = () => {
  const footerLinks = {
    Company: [
      { text: "About Us", path: "/about" },
      { text: "Contact", path: "/contact" },
      { text: "Careers", path: "/careers" },
      { text: "Blog", path: "/blog" },
    ],
    Resources: [
      { text: "Documentation", path: "/docs" },
      { text: "Support", path: "/support" },
      { text: "Terms of Service", path: "/terms" },
      { text: "Privacy Policy", path: "/privacy" },
    ],
    Features: [
      { text: "Marketplace", path: "/marketplace" },
      { text: "Training", path: "/training" },
      { text: "Analytics", path: "/analytics" },
      { text: "Community", path: "/community" },
    ],
  };

  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: "auto",
        backgroundColor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <SportsEsportsIcon
                  sx={{ mr: 1, color: "primary.main" }}
                  className="neon-text"
                />
                <Typography
                  variant="h6"
                  component={RouterLink}
                  to="/"
                  sx={{
                    color: "text.primary",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                  className="neon-text"
                >
                  DojoPool
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Elevate your pool game with AI-powered training, analytics, and
                a vibrant community of players.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <IconButton
                color="primary"
                aria-label="Facebook"
                component="a"
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                color="primary"
                aria-label="Twitter"
                component="a"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                color="primary"
                aria-label="Instagram"
                component="a"
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon />
              </IconButton>
              <IconButton
                color="primary"
                aria-label="YouTube"
                component="a"
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <YouTubeIcon />
              </IconButton>
            </Stack>
          </Grid>

          {Object.entries(footerLinks).map(([category, links]) => (
            <Grid item xs={12} sm={6} md={2} key={category}>
              <Typography
                variant="subtitle1"
                color="text.primary"
                gutterBottom
                sx={{ fontWeight: 700 }}
              >
                {category}
              </Typography>
              <Stack spacing={1}>
                {links.map((link) => (
                  <Link
                    key={link.text}
                    component={RouterLink}
                    to={link.path}
                    sx={{
                      color: "text.secondary",
                      textDecoration: "none",
                      "&:hover": {
                        color: "primary.main",
                      },
                    }}
                  >
                    {link.text}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            mt: 8,
            pt: 3,
            borderTop: "1px solid",
            borderColor: "divider",
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} DojoPool. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
