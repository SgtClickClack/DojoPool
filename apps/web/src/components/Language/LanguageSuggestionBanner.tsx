import Cookies from 'js-cookie';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const LanguageSuggestionBanner = () => {
  const [suggestedLocale, setSuggestedLocale] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const { locale, pathname, asPath, query } = router;
  const t = useTranslations('LanguageSuggestion');

  useEffect(() => {
    const languageCookie = Cookies.get('NEXT_LOCALE');
    if (!languageCookie) {
      fetch('/api/location/language')
        .then((res) => res.json())
        .then((data) => {
          if (
            data.success &&
            data.data.language &&
            data.data.language !== locale
          ) {
            setSuggestedLocale(data.data.language);
            setIsVisible(true);
          }
        })
        .catch(console.error);
    }
  }, [locale]);

  const handleSwitchLanguage = () => {
    if (suggestedLocale) {
      router.push({ pathname, query }, asPath, { locale: suggestedLocale });
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Optionally, set a cookie to not show the suggestion again
    Cookies.set('language_suggestion_dismissed', 'true', { expires: 7 });
  };

  if (!isVisible || !suggestedLocale) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#333',
        color: 'white',
        padding: '1rem',
        textAlign: 'center',
        zIndex: 1000,
      }}
    >
      <span>{t('suggestion', { locale: suggestedLocale })}</span>
      <button
        onClick={handleSwitchLanguage}
        style={{ marginLeft: '1rem', color: '#87CEEB' }}
      >
        {t('switchTo', { locale: suggestedLocale })}
      </button>
      <button onClick={handleDismiss} style={{ marginLeft: '1rem' }}>
        {t('dismiss')}
      </button>
    </div>
  );
};

export default LanguageSuggestionBanner;
