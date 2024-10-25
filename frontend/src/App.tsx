import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#BFA55E',
        },
      }}
    >
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50">
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <div className="min-h-screen flex items-center justify-center px-4">
                  <div className="w-full max-w-7xl">
                    <LoginPage />
                  </div>
                </div>
              }
            />
            <Route
              path="/home"
              element={
                <div className="min-h-screen w-full flex items-center justify-center">
                  <div className="w-full ">
                    <HomePage />
                  </div>
                </div>
              }
            />
          </Routes>
        </Router>
      </div>
    </ConfigProvider>
  );
};

export default App;