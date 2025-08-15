import * as React from 'react';
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Only one charset and viewport meta tag, remove duplicate theme-color */}
          <meta charSet="utf-8" />
          <meta name="description" content="DojoPool - Pool Game Training and Analytics" />
          <link rel="icon" href="/favicon.ico" />
          <title>DojoPool - Tournament Management</title>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
