'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost } from '@/lib/api'

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch settings function that can be called from anywhere
  const fetchSettings = useCallback(async () => {
    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (!token) {
      console.log('No token found, skipping settings fetch');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await apiGet('/api/settings');
    const settingsData = response?.data || response;
      setSettings(settingsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  }, []);

  // Refresh settings function (alias for fetchSettings)
  const refreshSettings = useCallback(() => {
    return fetchSettings();
  }, [fetchSettings]);

  // Clear settings function (for logout)
  const clearSettings = useCallback(() => {
    console.log('Clearing settings');
    setSettings(null);
    setLoading(false);
  }, []);

  // Fetch settings on mount if user is logged in
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, fetchSettings, clearSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
} 

export default SettingsContext;
