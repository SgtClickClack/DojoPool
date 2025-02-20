/** @jsxImportSource @emotion/react */
import { useState, useEffect } from 'react'
import type { AppProps } from 'next/app'
import { CacheProvider, EmotionCache } from '@emotion/react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import createEmotionCache from '../lib/createEmotionCache'
import theme from '../theme'
import Head from 'next/head'
import { ErrorBoundary } from 'react-error-boundary'
import { Box, Typography, Button } from '@mui/material'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

function ErrorFallback({ error, resetErrorBoundary }) {
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

export default function App({ Component, pageProps, emotionCache = clientSideEmotionCache }: MyAppProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <CacheProvider value={emotionCache}>
        <Head>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
        </Head>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </CacheProvider>
    </ErrorBoundary>
  )
} 