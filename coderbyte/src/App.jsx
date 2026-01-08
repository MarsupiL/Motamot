import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { GlobalProvider } from './context/GlobalContext';
import { initializeApp } from './store/actions/appActions';
import { initializeUser } from './store/actions/userActions';
import HomePage from './components/pages/HomePage';
import ComponentPage from './components/pages/ComponentPage';
import ErrorPage from './components/pages/ErrorPage';
import './App.css';

console.log('App component loaded');

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('App component mounted');
    dispatch(initializeApp());
    dispatch(initializeUser());
  }, [dispatch]);

  return (
    <ThemeProvider>
      <UserProvider>
        <GlobalProvider>
          <AnalyticsProvider>
            <div className="App">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/component/:componentName" element={<ComponentPage />} />
                <Route path="/error" element={<ErrorPage />} />
                <Route path="*" element={<ErrorPage />} />
              </Routes>
            </div>
          </AnalyticsProvider>
        </GlobalProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
