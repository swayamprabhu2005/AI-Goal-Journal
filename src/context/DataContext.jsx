import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userApi, goalApi, journalApi, summaryApi } from '../services/api';
import { useAuth } from './AuthContext';

import { notifyGoalCompleted } from '../components/GoalCelebration';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState([]);
  const [journals, setJournals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recentlyCompletedGoal, setRecentlyCompletedGoal] = useState(null);

  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [hasLoadedGoals, setHasLoadedGoals] = useState(false);
  const [hasLoadedJournals, setHasLoadedJournals] = useState(false);
  const [hasLoadedSummary, setHasLoadedSummary] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Clear data cache on logout
  const clearCache = useCallback(() => {
    setProfile(null);
    setGoals([]);
    setJournals([]);
    setSummary(null);
    setRecentlyCompletedGoal(null);
    setHasLoadedProfile(false);
    setHasLoadedGoals(false);
    setHasLoadedJournals(false);
    setHasLoadedSummary(false);
    setInitialLoading(false);
  }, []);

  const triggerGoalCompletion = useCallback((goal) => {
    if (!goal) return;
    const completedGoalWith100 = {
      ...goal,
      status: 'Completed',
      progress_value: 100,
    };
    setRecentlyCompletedGoal(completedGoalWith100);
    notifyGoalCompleted(completedGoalWith100);
  }, []);

  const clearCompletedGoalTrigger = useCallback(() => {
    setRecentlyCompletedGoal(null);
  }, []);

  // Fetch Profile
  const fetchProfile = useCallback(async (options = { quiet: false }) => {
    try {
      const data = await userApi.getProfile();
      setProfile(data);
      setHasLoadedProfile(true);
      return data;
    } catch (err) {
      console.error('DataContext fetchProfile error:', err);
      if (!options.quiet) throw err;
    }
  }, []);

  // Fetch Goals
  const fetchGoals = useCallback(async (statusFilter = '', options = { quiet: false }) => {
    try {
      const data = await goalApi.listGoals(statusFilter);
      setGoals(data || []);
      setHasLoadedGoals(true);
      return data;
    } catch (err) {
      console.error('DataContext fetchGoals error:', err);
      if (!options.quiet) throw err;
    }
  }, []);

  // Fetch Journals
  const fetchJournals = useCallback(async (options = { quiet: false }) => {
    try {
      const data = await journalApi.listJournals();
      setJournals(data || []);
      setHasLoadedJournals(true);
      return data;
    } catch (err) {
      console.error('DataContext fetchJournals error:', err);
      if (!options.quiet) throw err;
    }
  }, []);

  // Fetch Weekly Summary
  const fetchSummary = useCallback(async (options = { quiet: false }) => {
    try {
      const data = await summaryApi.getWeeklySummary();
      setSummary(data);
      setHasLoadedSummary(true);
      return data;
    } catch (err) {
      console.error('DataContext fetchSummary error:', err);
      if (!options.quiet) throw err;
    }
  }, []);

  // Fetch All Data
  const fetchAllData = useCallback(async (options = { quiet: false }) => {
    try {
      // 1. Fetch core data concurrently
      const [profileRes, goalsRes, journalsRes] = await Promise.allSettled([
        userApi.getProfile(),
        goalApi.listGoals(),
        journalApi.listJournals(),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value);
        setHasLoadedProfile(true);
      }
      if (goalsRes.status === 'fulfilled') {
        setGoals(goalsRes.value || []);
        setHasLoadedGoals(true);
      }
      if (journalsRes.status === 'fulfilled') {
        setJournals(journalsRes.value || []);
        setHasLoadedJournals(true);
      }

      // Unblock initial loading immediately so UI renders in < 50ms
      setInitialLoading(false);

      // 2. Fetch AI Coach summary non-blockingly
      summaryApi
        .getWeeklySummary()
        .then((summaryData) => {
          if (summaryData) {
            setSummary(summaryData);
            setHasLoadedSummary(true);
          }
        })
        .catch((err) => {
          console.warn('Background fetchSummary warning:', err);
        });
    } catch (err) {
      console.error('DataContext fetchAllData error:', err);
      if (!options.quiet) throw err;
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Load initial data when authenticated user arrives
  const userId = user?.uid;
  useEffect(() => {
    if (userId) {
      fetchAllData({ quiet: true });
    } else {
      clearCache();
    }
  }, [userId, fetchAllData, clearCache]);

  // --- Cache Mutation Helpers ---
  const addGoal = useCallback((newGoal) => {
    setGoals((prev) => [newGoal, ...prev]);
  }, []);

  const updateGoalInCache = useCallback((updatedGoal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  }, []);

  const deleteGoalFromCache = useCallback((goalId) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  }, []);

  const addJournal = useCallback((newJournal) => {
    setJournals((prev) => [newJournal, ...prev]);
  }, []);

  const updateJournalInCache = useCallback((updatedJournal) => {
    setJournals((prev) => prev.map((j) => (j.id === updatedJournal.id ? updatedJournal : j)));
  }, []);

  const deleteJournalFromCache = useCallback((journalId) => {
    setJournals((prev) => prev.filter((j) => j.id !== journalId));
  }, []);

  const updateProfileInCache = useCallback((updatedProfile) => {
    setProfile(updatedProfile);
  }, []);

  const setSummaryInCache = useCallback((newSummary) => {
    setSummary(newSummary);
    setHasLoadedSummary(true);
  }, []);

  return (
    <DataContext.Provider
      value={{
        profile,
        userProfile: profile,
        goals,
        journals,
        summary,
        recentlyCompletedGoal,
        hasLoadedProfile,
        hasLoadedGoals,
        hasLoadedJournals,
        hasLoadedSummary,
        initialLoading,
        fetchProfile,
        fetchGoals,
        fetchJournals,
        fetchSummary,
        fetchAllData,
        addGoal,
        updateGoalInCache,
        deleteGoalFromCache,
        triggerGoalCompletion,
        clearCompletedGoalTrigger,
        addJournal,
        updateJournalInCache,
        deleteJournalFromCache,
        updateProfileInCache,
        updateProfileLocal: updateProfileInCache,
        setSummaryInCache,
        clearCache,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within DataProvider');
  }
  return ctx;
}
