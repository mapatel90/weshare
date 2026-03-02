'use client'
import { useState, useEffect, useCallback } from 'react';
import { showSuccessToast, showErrorToast } from '@/utils/topTost';
import { apiGet, apiPost } from '@/lib/api';

// Module-level shared store so all hook instances stay in sync without a page refresh
let sharedSettings = {};
let sharedLoading = false;
const subscribers = new Set();

const notifySubscribers = () => {
  subscribers.forEach((fn) => {
    try { fn(sharedSettings); } catch {}
  });
};

const setSharedSettings = (next) => {
  sharedSettings = next || {};
  try { if (typeof window !== 'undefined') localStorage.setItem('app_settings', JSON.stringify(sharedSettings)); } catch {}
  notifySubscribers();
};

const useSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  };

  // Fetch all settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token found, skipping settings fetch');
        setSettings({});
        setLoading(false);
        return {};
      }

      const data = await apiGet('/api/settings');
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch settings');
      }

      const next = data.data || {};
      setSettings(next);
      setSharedSettings(next);
      return next;
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message);
      // Only show error toast for actual API errors, not missing tokens
      if (!err.message.includes('authentication token')) {
        showErrorToast(`Error fetching settings: ${err.message}`);
      }
      return {};
    } finally {
      setLoading(false);
    }
  };

  // Update multiple settings
  const updateSettings = async (settingsData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const data = await apiPost('/api/settings/bulk', settingsData);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update settings');
      }

      // Update local and shared settings state and cache
      setSettings(prev => {
        const merged = { ...prev, ...settingsData };
        setSharedSettings(merged);
        return merged;
      });
      
      showSuccessToast('Settings updated successfully!');
      return data.data;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.message);
      showErrorToast(`Error updating settings: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update single setting
  const updateSetting = async (key, value) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const data = await apiPost('/api/settings', { key, value });
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update setting');
      }

      // Update local and shared settings state
      setSettings(prev => {
        const merged = { ...prev, [key]: value };
        setSharedSettings(merged);
        return merged;
      });
      
      showSuccessToast('Setting updated successfully!');
      return data.data;
    } catch (err) {
      console.error('Error updating setting:', err);
      setError(err.message);
      showErrorToast(`Error updating setting: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get single setting value (stable reference for hooks deps)
  const getSetting = useCallback((key, defaultValue = '') => {
    return settings[key] || defaultValue;
  }, [settings]);

  // Load settings on component mount
  useEffect(() => {
    const token = getAuthToken();
    // Seed from localStorage if available for immediate UI usage (e.g., logo)
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('app_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          setSettings(parsed);
          // Initialize shared store from cache if empty
          if (!sharedSettings || Object.keys(sharedSettings).length === 0) {
            sharedSettings = parsed;
          }
        }
      }
    } catch {}

    // Subscribe to shared updates for instant cross-component sync
    const onUpdate = (next) => setSettings(next);
    subscribers.add(onUpdate);

    if (token) {
      fetchSettings().then((serverSettings) => {
        // Cache latest settings
        try { if (typeof window !== 'undefined') localStorage.setItem('app_settings', JSON.stringify(serverSettings || {})); } catch {}
      });
    } else {
      setLoading(false);
      setSettings({});
    }

    return () => {
      subscribers.delete(onUpdate);
    };
  }, []);

  // Sync across tabs/components via storage events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e) => {
      if (e.key === 'app_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(prev => ({ ...prev, ...parsed }));
          sharedSettings = parsed;
          notifySubscribers();
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Method to refresh settings (useful after login)
  const refreshSettings = async () => {
    const token = getAuthToken();
    if (token) {
      return await fetchSettings();
    } else {
      setSettings({});
      setLoading(false);
      return {};
    }
  };

  return {
    settings,
    loading,
    error,
    fetchSettings,
    refreshSettings,
    updateSettings,
    updateSetting,
    getSetting,
  };
};

export default useSettings;