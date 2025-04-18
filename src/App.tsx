import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Routes from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes />
      </Router>
    </ThemeProvider>
  );
}