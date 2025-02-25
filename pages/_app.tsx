/** @jsxImportSource react */
import * as React from 'react'
import { AppProps } from 'next/app'
import { CacheProvider, EmotionCache } from '@emotion/react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createEmotionCache } from '../styles/createEmotionCache'
import theme from '../src/theme'
import { AuthProvider } from '../contexts/AuthContext'
import { ErrorBoundary } from 'react-error-boundary'
import { Box, Typography, Button } from '@mui/material'
import Layout from '../components/layout/Layout'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { StyledEngineProvider } from '../src/dojopool/frontend/utils/styled-engine'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Box
      role="alert"
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}
    >
      <Typography variant="h5" color="error" gutterBottom>
        Something went wrong:
      </Typography>
      <Typography color="textSecondary" sx={{ mb: 2 }}>
        {error.message}
      </Typography>
      <Button onClick={resetErrorBoundary} variant="contained" color="primary">
        Try again
      </Button>
    </Box>
  )
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  const [mounted, setMounted] = useState(false)

  // Only run the effect on the client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent flash of unstyled content
  if (!mounted) {
    return null
  }

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </AuthProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </ErrorBoundary>
    </CacheProvider>
  )
} 