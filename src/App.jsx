import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui';
import MobileSplash from './components/ui/MobileSplash';
import router from './router';

function App() {
  return (
    <>
      <MobileSplash />
      <ThemeProvider>
        <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <RouterProvider router={router} />
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
