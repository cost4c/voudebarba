import { Routes, Route, Navigate } from 'react-router';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';
import HomePage from './pages/HomePage.jsx';
import ShopDetailPage from './pages/ShopDetailPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import AgendaPage from './pages/AgendaPage.jsx';
import ConfigPage from './pages/ConfigPage.jsx';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#EAEFEF' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 80px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/barbearia/:id" element={<ShopDetailPage />} />
          <Route path="/entrar" element={<AuthPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/meus-agendamentos" element={<AppointmentsPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/configuracoes" element={<ConfigPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toast />
    </div>
  );
}
