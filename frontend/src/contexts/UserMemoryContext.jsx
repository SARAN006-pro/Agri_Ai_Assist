import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getUserProfile, getLearningStats, updateUserPreferences,
  submitFeedback, submitCorrection, recordCropOutcome,
} from '../services/api';

const UserMemoryContext = createContext();

/** Generate or retrieve a persistent device ID for anonymous user tracking */
function getDeviceId() {
  let id = localStorage.getItem('smartfarm_device_id');
  if (!id) {
    id = 'device_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem('smartfarm_device_id', id);
  }
  return id;
}

export function UserMemoryProvider({ children }) {
  const [deviceId] = useState(() => getDeviceId());
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const debounceRef = useRef(null);

  // Load profile on mount
  useEffect(() => {
    if (!deviceId) return;
    loadProfile();
  }, [deviceId]);

  const loadProfile = useCallback(async () => {
    if (!deviceId) return;
    try {
      const [profileRes, statsRes] = await Promise.allSettled([
        getUserProfile(deviceId),
        getLearningStats(deviceId),
      ]);
      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
    } catch {
      // Silently fail - profile is optional
    } finally {
      setInitialized(true);
    }
  }, [deviceId]);

  const updatePreferences = useCallback(async (prefs) => {
    if (!deviceId) return;
    try {
      await updateUserPreferences({ device_id: deviceId, ...prefs });
      loadProfile();
    } catch {}
  }, [deviceId, loadProfile]);

  const submitFeedbackFn = useCallback(async (feedbackData) => {
    if (!deviceId) return;
    try {
      await submitFeedback({ ...feedbackData, device_id: deviceId });
    } catch {}
  }, [deviceId]);

  const submitCorrectionFn = useCallback(async (correctionData) => {
    if (!deviceId) return;
    try {
      await submitCorrection({ ...correctionData, device_id: deviceId });
    } catch {}
  }, [deviceId]);

  const recordCropOutcomeFn = useCallback(async (outcomeData) => {
    if (!deviceId) return;
    try {
      await recordCropOutcome({ device_id: deviceId, ...outcomeData });
    } catch {}
  }, [deviceId]);

  const refreshStats = useCallback(async () => {
    if (!deviceId) return;
    try {
      const res = await getLearningStats(deviceId);
      setStats(res.data);
    } catch {}
  }, [deviceId]);

  // Debounced preference save (e.g., from chat topic extraction)
  const debouncedPreferenceUpdate = useCallback((prefs) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updatePreferences(prefs);
    }, 2000);
  }, [updatePreferences]);

  return (
    <UserMemoryContext.Provider value={{
      deviceId,
      profile,
      stats,
      loading,
      initialized,
      updatePreferences,
      submitFeedback: submitFeedbackFn,
      submitCorrection: submitCorrectionFn,
      recordCropOutcome: recordCropOutcomeFn,
      refreshStats,
      debouncedPreferenceUpdate,
    }}>
      {children}
    </UserMemoryContext.Provider>
  );
}

export function useUserMemory() {
  const context = useContext(UserMemoryContext);
  if (!context) {
    throw new Error('useUserMemory must be used within a UserMemoryProvider');
  }
  return context;
}
