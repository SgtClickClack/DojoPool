import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'
import createEmotionServer from '@emotion/server/create-instance'
import { createEmotionCache } from '../utils/createEmotionCache'

const cache = createEmotionCache()
const { extractCriticalToChunks } = createEmotionServer(cache)

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const originalRenderPage = ctx.renderPage

    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App: any) => {
          return function EnhanceApp(props) {
            return <App emotionCache={cache} {...props} />
          }
        },
      })

    const initialProps = await Document.getInitialProps(ctx)
    const emotionStyles = extractCriticalToChunks(initialProps.html)
    const emotionStyleTags = emotionStyles.styles.map((style) => (
      <style
        data-emotion={`${style.key} ${style.ids.join(' ')}`}
        key={style.key}
        dangerouslySetInnerHTML={{ __html: style.css }}
      />
    ))

    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          {emotionStyleTags}
        </>
      ),
    }
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="theme-color" content="#000000" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <meta name="emotion-insertion-point" content="" />
          {(this.props as any).emotionStyleTags}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument 