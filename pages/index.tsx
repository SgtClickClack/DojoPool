import type { NextPage } from 'next'
import Head from 'next/head'
import { Box, Container, Typography } from '@mui/material'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>DojoPool</title>
        <meta name="description" content="DojoPool - Next Generation Pool Gaming" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h1" component="h1" gutterBottom>
            Welcome to DojoPool
          </Typography>
        </Box>
      </Container>
    </>
  )
}

export default Home 