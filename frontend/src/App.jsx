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
import Jobs from './pages/Jobs';
import Gambling from './pages/Gambling';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import EmbedTicker from './pages/embed/EmbedTicker';
import EmbedSwiper from './pages/embed/EmbedSwiper';
import EmbedCondensed from './pages/embed/EmbedCondensed';
import SlotMachine from './components/games/SlotMachine';
import Blackjack from './components/games/Blackjack';
import Roulette from './components/games/Roulette';
import Mines from './components/games/Mines';
import McKingJob from './components/games/McKingJob';
import SecretaryJob from './components/games/SecretaryJob';
import FeatureDisabled from './components/FeatureDisabled';
import { FEATURE_FLAGS } from './config/features';

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
                    {FEATURE_FLAGS.JOBS_ENABLED && <Route path="/jobs" element={<Jobs />} />}
                    {FEATURE_FLAGS.GAMBLING_ENABLED && <Route path="/gambling" element={<Gambling />} />}
                    {FEATURE_FLAGS.GAMBLING_ENABLED && <Route path="/gambling/slots" element={<SlotMachine />} />}
                    {FEATURE_FLAGS.GAMBLING_ENABLED && <Route path="/gambling/blackjack" element={<Blackjack />} />}
                    {FEATURE_FLAGS.GAMBLING_ENABLED && <Route path="/gambling/roulette" element={<Roulette />} />}
                    {FEATURE_FLAGS.GAMBLING_ENABLED && <Route path="/gambling/mines" element={<Mines />} />}
                    {FEATURE_FLAGS.JOBS_ENABLED && <Route path="/jobs/mcking" element={<McKingJob />} />}
                    {FEATURE_FLAGS.JOBS_ENABLED && <Route path="/jobs/secretary" element={<SecretaryJob />} />}
                    {!FEATURE_FLAGS.JOBS_ENABLED && <Route path="/jobs/*" element={<FeatureDisabled featureName="Jobs" />} />}
                    {!FEATURE_FLAGS.GAMBLING_ENABLED && <Route path="/gambling/*" element={<FeatureDisabled featureName="Gambling" />} />}
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
