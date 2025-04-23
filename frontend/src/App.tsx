import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/ToastContainer';
import { AuthProvider } from './context/AuthContext';
import Routes from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <Routes />
          </AuthProvider>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}