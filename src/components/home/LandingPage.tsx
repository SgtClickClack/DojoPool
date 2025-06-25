import { Box, Button, Container, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthContext";
import MainLayout from "@/components/layout/MainLayout";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%)",
            zIndex: 1,
          },
        }}
      >
        <img
          src="/images/pool_table_hero.jpg"
          alt="Pool Table Hero Background"
          style={{
            objectFit: "cover",
            objectPosition: "center 30%",
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            py: 8,
            animation: "fadeIn 1s ease-out",
          }}
        >
          <Typography
            variant="h1"
            className="neon-text"
            sx={{
              fontSize: { xs: "2.5rem", md: "4rem" },
              fontWeight: 700,
              mb: 3,
              animation: "fadeInUp 1s ease-out, pulseText 2s infinite",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Welcome to DojoPool
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "1.25rem", md: "1.5rem" },
              mb: 6,
              color: "rgba(255, 255, 255, 0.9)",
              maxWidth: "800px",
              mx: "auto",
              animation: "fadeInUp 1s ease-out 0.3s",
              animationFillMode: "both",
              textShadow: "0 0 10px rgba(0, 255, 255, 0.3)",
            }}
          >
            Experience pool like never before with our revolutionary AI-powered
            gaming platform
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 3,
              justifyContent: "center",
              animation: "fadeInUp 1s ease-out 0.6s",
              animationFillMode: "both",
            }}
          >
            {!user ? (
              <>
                <Button
                  component={Link}
                  to="/signup"
                  variant="contained"
                  size="large"
                  className="hover-glow"
                  sx={{
                    fontSize: "1.1rem",
                    py: 1.5,
                    px: 4,
                    borderWidth: "2px",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #00ffff 0%, #0066ff 100%)",
                    backdropFilter: "blur(4px)",
                    boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
                    fontWeight: 600,
                    "&:hover": {
                      boxShadow: "0 0 30px rgba(0, 255, 255, 0.5)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  Get Started
                </Button>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  size="large"
                  className="hover-glow"
                  sx={{
                    fontSize: "1.1rem",
                    py: 1.5,
                    px: 4,
                    borderWidth: "2px",
                    borderRadius: "8px",
                    borderColor: "rgba(0, 255, 255, 0.5)",
                    color: "#fff",
                    backdropFilter: "blur(4px)",
                    "&:hover": {
                      borderColor: "rgba(0, 255, 255, 0.8)",
                      boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  Sign In
                </Button>
              </>
            ) : (
              <Button
                component={Link}
                to="/dashboard"
                variant="contained"
                size="large"
                className="hover-glow"
                sx={{
                  fontSize: "1.1rem",
                  py: 1.5,
                  px: 4,
                  borderWidth: "2px",
                  borderRadius: "8px",
                  background:
                    "linear-gradient(135deg, #00ffff 0%, #0066ff 100%)",
                  backdropFilter: "blur(4px)",
                  boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
                  fontWeight: 600,
                  "&:hover": {
                    boxShadow: "0 0 30px rgba(0, 255, 255, 0.5)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Go to Dashboard
              </Button>
            )}
          </Box>
          
          {/* Venue Owner/Manager Section */}
          <Box
            sx={{
              mt: 6,
              animation: "fadeInUp 1s ease-out 0.9s",
              animationFillMode: "both",
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: "1.1rem", md: "1.3rem" },
                mb: 3,
                color: "rgba(255, 255, 255, 0.8)",
                textShadow: "0 0 10px rgba(255, 255, 0, 0.3)",
              }}
            >
              Are you a venue owner or manager?
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                component={Link}
                to="/venue-management"
                variant="contained"
                size="large"
                className="hover-glow"
                sx={{
                  fontSize: "1rem",
                  py: 1.2,
                  px: 3,
                  borderWidth: "2px",
                  borderRadius: "8px",
                  background:
                    "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                  backdropFilter: "blur(4px)",
                  boxShadow: "0 0 20px rgba(255, 107, 53, 0.3)",
                  fontWeight: 600,
                  "&:hover": {
                    boxShadow: "0 0 30px rgba(255, 107, 53, 0.5)",
                    transform: "translateY(-2px)",
                    background:
                      "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                  },
                }}
              >
                Venue Management
              </Button>
              <Button
                component={Link}
                to="/venue-onboarding"
                variant="outlined"
                size="large"
                className="hover-glow"
                sx={{
                  fontSize: "1rem",
                  py: 1.2,
                  px: 3,
                  borderWidth: "2px",
                  borderRadius: "8px",
                  borderColor: "rgba(255, 107, 53, 0.5)",
                  color: "#fff",
                  backdropFilter: "blur(4px)",
                  "&:hover": {
                    borderColor: "rgba(255, 107, 53, 0.8)",
                    boxShadow: "0 0 20px rgba(255, 107, 53, 0.3)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Add Your Venue
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </MainLayout>
  );
}
