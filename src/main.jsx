import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// A demonstração publicada como página usa rotas com # (não depende do servidor).
const Roteador = import.meta.env.VITE_DEMO ? HashRouter : BrowserRouter;
import './styles.css';
import { EstadoProvider } from './lib/estado.jsx';
import Home from './pages/Home.jsx';
import AppLayout from './pages/AppLayout.jsx';
import Captura from './pages/Captura.jsx';
import Acervo from './pages/Acervo.jsx';
import Sonho from './pages/Sonho.jsx';
import Importar from './pages/Importar.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EstadoProvider>
      <Roteador>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Captura />} />
            <Route path="acervo" element={<Acervo />} />
            <Route path="sonho/:id" element={<Sonho />} />
            <Route path="importar" element={<Importar />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Roteador>
    </EstadoProvider>
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD && !import.meta.env.VITE_DEMO) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
