import { Box, Typography } from "@mui/material";

export default function Custom404() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h2" color="error">
        404 - Page Not Found
      </Typography>
      <Typography variant="body1">
        The page you are looking for does not exist.
      </Typography>
    </Box>
  );
}
