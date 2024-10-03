import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from "@renderer/components/theme-provider"
import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');

const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
  <AuthProvider>

    <App />
    <Toaster />

  </AuthProvider>
</ThemeProvider>,);
