import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ParticleBackground from './components/ParticleBackground';
import HomePage from './pages/HomePage';
import LessonPage from './pages/LessonPage';
import CodePage from './pages/CodePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Navigation from './components/Navigation';


function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <ParticleBackground />
        <Navigation />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lessons" element={<LessonPage />} />
          <Route path="/code" element={<CodePage />} />
          <Route path="/code/:roomId" element={<CodePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;