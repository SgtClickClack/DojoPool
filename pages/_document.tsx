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
        React.createElement('meta', { name: "theme-color", content: theme.palette.primary.main }),
        React.createElement('link', { rel: "icon", href: "/favicon.ico" }),
        React.createElement('link', {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        }),
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