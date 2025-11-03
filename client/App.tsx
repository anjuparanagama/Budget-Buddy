import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from 'components/HomeScreen';
import SplashScreen from 'components/SplashScreen';
import LoginScreen from 'components/LoginScreen';
import SignupScreen from 'components/SignupScreen';

import './global.css';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
          // try to load persisted user for instant UI
          try {
            const storedUser = await AsyncStorage.getItem('authUser');
            if (storedUser) setCurrentUser(JSON.parse(storedUser));
          } catch (e) {
            /* ignore */
          }
        }
      } catch (e) {
        console.warn('Failed to load token', e);
      }
    };
    loadToken();
    const t = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleAuth = async (tok: string, user: any) => {
    setToken(tok);
    setCurrentUser(user || null);
    try {
      await AsyncStorage.setItem('authToken', tok);
      if (user) {
        try {
          await AsyncStorage.setItem('authUser', JSON.stringify(user));
        } catch (e) {
          /* ignore */
        }
      }
    } catch (e) {
      console.warn('Failed to save token', e);
    }
  };

  const handleLogout = async () => {
    setToken(null);
    setCurrentUser(null);
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('authUser');
    } catch (e) {
      console.warn('Failed to remove token', e);
    }
  };

  return (
    <SafeAreaProvider>
      {showSplash ? (
        <SplashScreen />
      ) : token ? (
        <HomeScreen token={token} onLogout={handleLogout} initialUser={currentUser} />
      ) : authMode === 'login' ? (
        <LoginScreen onAuth={handleAuth} switchToSignup={() => setAuthMode('signup')} />
      ) : (
        <SignupScreen onAuth={handleAuth} switchToLogin={() => setAuthMode('login')} />
      )}
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
