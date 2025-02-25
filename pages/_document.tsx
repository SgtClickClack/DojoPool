/** @jsxImportSource react */
import * as React from 'react'
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'
import createEmotionServer from '@emotion/server/create-instance'
import { createEmotionCache } from '../styles/createEmotionCache'
import theme from '../src/theme'

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const originalRenderPage = ctx.renderPage
    const cache = createEmotionCache()
    const { extractCriticalToChunks } = createEmotionServer(cache)

    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App: any) => (props) => React.createElement(App, { emotionCache: cache, ...props }),
      })

    const initialProps = await Document.getInitialProps(ctx)
    const emotionStyles = extractCriticalToChunks(initialProps.html)
    const emotionStyleTags = emotionStyles.styles.map((style) =>
      React.createElement('style', {
        'data-emotion': `${style.key} ${style.ids.join(' ')}`,
        key: style.key,
        dangerouslySetInnerHTML: { __html: style.css }
      })
    )

    return {
      ...initialProps,
      styles: [
        ...React.Children.toArray(initialProps.styles),
        ...emotionStyleTags,
      ],
    }
  }

  render() {
    return React.createElement(
      Html,
      { lang: "en" },
      React.createElement(
        Head,
        null,
        React.createElement('meta', { charSet: "utf-8" }),
        React.createElement('meta', { name: "application-name", content: "DojoPool" }),
        React.createElement('meta', { name: "apple-mobile-web-app-capable", content: "yes" }),
        React.createElement('meta', { name: "apple-mobile-web-app-status-bar-style", content: "default" }),
        React.createElement('meta', { name: "apple-mobile-web-app-title", content: "DojoPool" }),
        React.createElement('meta', { name: "description", content: "The ultimate pool gaming platform that bridges physical and digital gameplay" }),
        React.createElement('meta', { name: "format-detection", content: "telephone=no" }),
        React.createElement('meta', { name: "mobile-web-app-capable", content: "yes" }),
        React.createElement('meta', { name: "theme-color", content: theme.palette.primary.main }),
        React.createElement('meta', { name: "viewport", content: "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" }),
        
        React.createElement('link', { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }),
        React.createElement('link', { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" }),
        React.createElement('link', { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" }),
        React.createElement('link', { rel: "icon", href: "/favicon.ico" }),
        React.createElement('link', { rel: "manifest", href: "/manifest.json" }),
        React.createElement('link', { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: theme.palette.primary.main }),
        React.createElement('link', { rel: "shortcut icon", href: "/favicon.ico" }),
        React.createElement('link', {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        }),
        
        React.createElement('meta', { name: "twitter:card", content: "summary" }),
        React.createElement('meta', { name: "twitter:url", content: "https://dojopool.com" }),
        React.createElement('meta', { name: "twitter:title", content: "DojoPool" }),
        React.createElement('meta', { name: "twitter:description", content: "The ultimate pool gaming platform that bridges physical and digital gameplay" }),
        React.createElement('meta', { name: "twitter:image", content: "https://dojopool.com/og-image.png" }),
        React.createElement('meta', { name: "twitter:creator", content: "@DojoPool" }),
        
        React.createElement('meta', { property: "og:type", content: "website" }),
        React.createElement('meta', { property: "og:title", content: "DojoPool" }),
        React.createElement('meta', { property: "og:description", content: "The ultimate pool gaming platform that bridges physical and digital gameplay" }),
        React.createElement('meta', { property: "og:site_name", content: "DojoPool" }),
        React.createElement('meta', { property: "og:url", content: "https://dojopool.com" }),
        React.createElement('meta', { property: "og:image", content: "https://dojopool.com/og-image.png" }),
        
        React.createElement('meta', { name: "emotion-insertion-point", content: "" })
      ),
      React.createElement(
        'body',
        null,
        React.createElement(Main, null),
        React.createElement(NextScript, null)
      )
    )
  }
}