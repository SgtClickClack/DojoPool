import { useTranslations } from 'next-intl';
import Link from 'next/link';
import styles from './404.module.css';

export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <h2 className={styles.subtitle}>{t('title')}</h2>
      <p className={styles.description}>{t('description')}</p>
      <Link href="/" className={styles.homeLink}>
        {t('goHome')}
      </Link>
    </div>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      messages: (await import(`../../messages/${locale}.json`)).default,
    },
  };
}
