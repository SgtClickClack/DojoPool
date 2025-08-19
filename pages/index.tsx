import dynamic from 'next/dynamic';
import Head from 'next/head';

const WorldHub = dynamic(
  () => import('../apps/web/src/components/world/WorldHub'),
  {
    ssr: false,
  }
);

export default function HomePage() {
  return (
    <>
      <Head>
        <title>DojoPool — World Map</title>
        <meta
          name="description"
          content="Interactive world map of DojoPool dojos and territories."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ width: '100vw', height: '100vh' }}>
        <WorldHub />
      </div>
    </>
  );
}
