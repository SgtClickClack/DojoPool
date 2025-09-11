import Cookies from 'js-cookie';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const LanguageSwitcher = () => {
  const router = useRouter();
  const { locale, pathname, asPath, query } = router;
  const t = useTranslations('LanguageSwitcher');

  const changeLanguage = (nextLocale: string) => {
    router.push({ pathname, query }, asPath, { locale: nextLocale });
  };

  useEffect(() => {
    if (locale) {
      Cookies.set('NEXT_LOCALE', locale, { expires: 365 });
    }
  }, [locale]);

  return (
    <div>
      <select
        onChange={(e) => changeLanguage(e.target.value)}
        value={locale}
        aria-label={t('label')}
      >
        <option value="en">{t('en')}</option>
        <option value="de">{t('de')}</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
