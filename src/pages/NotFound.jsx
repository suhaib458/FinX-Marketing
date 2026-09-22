import { Home, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';

function NotFound() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <main className="fx-empty-state page-enter" style={{ minHeight: '100vh' }}>
      <SearchX size={56} aria-hidden="true" />
      <h1 className="fx-empty-state__title">{t.notFound.title}</h1>
      <p className="fx-empty-state__description">{t.notFound.description}</p>
      <Button icon={Home} onClick={() => navigate('/')}>{t.notFound.action}</Button>
    </main>
  );
}

export default NotFound;
