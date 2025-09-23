import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';

type Props = { nonce?: string };

export default function MyDocument(props: Props) {
  const { nonce } = props;
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        {/* Ensure Next.js scripts receive the nonce for inline chunks */}
        <NextScript nonce={nonce} />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const initialProps = await Document.getInitialProps(ctx);
  // Pull the nonce forwarded by middleware via header
  const nonce = ctx.req?.headers['x-nonce'] as string | undefined;
  return { ...initialProps, nonce } as any;
};
