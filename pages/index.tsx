import { Box, Container, Typography } from '@mui/material'

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to DojoPool
        </Typography>
      </Box>
    </Container>
  )
} 