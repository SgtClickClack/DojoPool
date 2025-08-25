import dynamic from 'next/dynamic';
import Head from 'next/head';
import styles from './index.module.css';

const WorldHub = dynamic(() => import('../src/components/world/WorldHub'), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingContainer}>
      <h1>Loading DojoPool World Hub...</h1>
    </div>
  ),
});

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
      <div className={styles.fullScreenContainer}>
        <WorldHub />
      </div>
    </>
  );
}
