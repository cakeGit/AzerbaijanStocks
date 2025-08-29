import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import Portfolio from './pages/Portfolio';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import EmbedTicker from './pages/embed/EmbedTicker';
import EmbedSwiper from './pages/embed/EmbedSwiper';
import EmbedCondensed from './pages/embed/EmbedCondensed';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/embed/ticker" element={<EmbedTicker />} />
            <Route path="/embed/swiper" element={<EmbedSwiper />} />
            <Route path="/embed/condensed" element={<EmbedCondensed />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/stock/:ticker" element={<StockDetail />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
