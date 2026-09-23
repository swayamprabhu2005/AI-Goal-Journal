import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userApi, goalApi, journalApi, summaryApi, habitApi } from '../services/api';
import { useAuth } from './AuthContext';

import { notifyGoalCompleted } from '../components/GoalCelebration';

const DataContext = createContext(null);

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(`ai_journal_cache_${key}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) {
      return Array.isArray(parsed) ? parsed : fallback;
    }
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(`ai_journal_cache_${key}`);
    } else {
      localStorage.setItem(`ai_journal_cache_${key}`, JSON.stringify(value));
    }
  } catch {}
}

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [profile, setProfile] = useState(() => readLocal('profile', null));
  const [goals, setGoals] = useState(() => {
    const cached = readLocal('goals', []);
    return Array.isArray(cached) ? cached : [];
  });
  const [journals, setJournals] = useState(() => {
    const cached = readLocal('journals', []);
    return Array.isArray(cached) ? cached : [];
  });
  const [habits, setHabits] = useState(() => {
    const cached = readLocal('habits', []);
    return Array.isArray(cached) ? cached : [];
  });
  const [summary, setSummary] = useState(() => readLocal('summary', null));
  const [recentlyCompletedGoal, setRecentlyCompletedGoal] = useState(null);

  const initialGoals = Array.isArray(readLocal('goals', [])) ? readLocal('goals', []) : [];
  const initialHabits = Array.isArray(readLocal('habits', [])) ? readLocal('habits', []) : [];
  const hasCachedData = initialGoals.length > 0 || initialHabits.length > 0;

  const [hasLoadedProfile, setHasLoadedProfile] = useState(() => !!readLocal('profile', null));
  const [hasLoadedGoals, setHasLoadedGoals] = useState(() => hasCachedData);
  const [hasLoadedJournals, setHasLoadedJournals] = useState(() => hasCachedData);
  const [hasLoadedHabits, setHasLoadedHabits] = useState(() => hasCachedData);
  const [hasLoadedSummary, setHasLoadedSummary] = useState(() => !!readLocal('summary', null));
  const [initialLoading, setInitialLoading] = useState(() => !hasCachedData);

  // Safety guard: guarantee loading indicators unblock in max 2.5s even on cold network
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
      setHasLoadedGoals(true);
      setHasLoadedHabits(true);
      setHasLoadedJournals(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Clear data cache on logout
  const clearCache = useCallback(() => {
    setProfile(null);
    setGoals([]);
    setJournals([]);
    setHabits([]);
    setSummary(null);
    setRecentlyCompletedGoal(null);
    setHasLoadedProfile(false);
    setHasLoadedGoals(false);
    setHasLoadedJournals(false);
    setHasLoadedHabits(false);
    setHasLoadedSummary(false);
    setInitialLoading(false);
    writeLocal('profile', null);
    writeLocal('goals', null);
    writeLocal('journals', null);
    writeLocal('habits', null);
    writeLocal('summary', null);
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
      const safeData = Array.isArray(data) ? data : [];
      setGoals(safeData);
      writeLocal('goals', safeData);
      setHasLoadedGoals(true);
      return safeData;
    } catch (err) {
      console.error('DataContext fetchGoals error:', err);
      if (!options.quiet) throw err;
    }
  }, []);

  // Fetch Journals
  const fetchJournals = useCallback(async (options = { quiet: false }) => {
    try {
      const data = await journalApi.listJournals();
      const safeData = Array.isArray(data) ? data : [];
      setJournals(safeData);
      writeLocal('journals', safeData);
      setHasLoadedJournals(true);
      return safeData;
    } catch (err) {
      console.error('DataContext fetchJournals error:', err);
      if (!options.quiet) throw err;
    }
  }, []);

  // Fetch Habits
  const fetchHabits = useCallback(async (options = { quiet: false }) => {
    try {
      const data = await habitApi.listHabits();
      const safeData = Array.isArray(data) ? data : [];
      setHabits(safeData);
      writeLocal('habits', safeData);
      setHasLoadedHabits(true);
      return safeData;
    } catch (err) {
      console.error('DataContext fetchHabits error:', err);
      if (!options.quiet) throw err;
    }
  }, []);

  // Fetch Weekly Summary
  const fetchSummary = useCallback(async (options = { quiet: false }) => {
    try {
      const data = await summaryApi.getWeeklySummary();
      setSummary(data);
      if (data) writeLocal('summary', data);
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
      // 1. Fetch core data concurrently (profile, goals, journals, habits)
      const [profileRes, goalsRes, journalsRes, habitsRes] = await Promise.allSettled([
        userApi.getProfile(),
        goalApi.listGoals(),
        journalApi.listJournals(),
        habitApi.listHabits(),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value) {
        setProfile(profileRes.value);
        writeLocal('profile', profileRes.value);
      }
      setHasLoadedProfile(true);

      if (goalsRes.status === 'fulfilled' && goalsRes.value) {
        const safeGoals = Array.isArray(goalsRes.value) ? goalsRes.value : [];
        setGoals(safeGoals);
        writeLocal('goals', safeGoals);
      }
      setHasLoadedGoals(true);

      if (journalsRes.status === 'fulfilled' && journalsRes.value) {
        const safeJournals = Array.isArray(journalsRes.value) ? journalsRes.value : [];
        setJournals(safeJournals);
        writeLocal('journals', safeJournals);
      }
      setHasLoadedJournals(true);

      if (habitsRes.status === 'fulfilled' && habitsRes.value) {
        const safeHabits = Array.isArray(habitsRes.value) ? habitsRes.value : [];
        setHabits(safeHabits);
        writeLocal('habits', safeHabits);
      }
      setHasLoadedHabits(true);

      // Unblock initial loading immediately so UI renders in < 50ms
      setInitialLoading(false);

      // 2. Fetch AI Coach summary non-blockingly
      summaryApi
        .getWeeklySummary()
        .then((summaryData) => {
          if (summaryData) {
            setSummary(summaryData);
            writeLocal('summary', summaryData);
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
    setGoals((prev) => {
      const updated = [newGoal, ...prev];
      writeLocal('goals', updated);
      return updated;
    });
  }, []);

  const updateGoalInCache = useCallback((updatedGoal) => {
    setGoals((prev) => {
      const updated = prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
      writeLocal('goals', updated);
      return updated;
    });
  }, []);

  const deleteGoalFromCache = useCallback((goalId) => {
    setGoals((prev) => {
      const updated = prev.filter((g) => g.id !== goalId);
      writeLocal('goals', updated);
      return updated;
    });
  }, []);

  const addJournal = useCallback((newJournal) => {
    setJournals((prev) => {
      const updated = [newJournal, ...prev];
      writeLocal('journals', updated);
      return updated;
    });
  }, []);

  const updateJournalInCache = useCallback((updatedJournal) => {
    setJournals((prev) => {
      const updated = prev.map((j) => (j.id === updatedJournal.id ? updatedJournal : j));
      writeLocal('journals', updated);
      return updated;
    });
  }, []);

  const deleteJournalFromCache = useCallback((journalId) => {
    setJournals((prev) => {
      const updated = prev.filter((j) => j.id !== journalId);
      writeLocal('journals', updated);
      return updated;
    });
  }, []);

  const updateProfileInCache = useCallback((updatedProfile) => {
    setProfile(updatedProfile);
    writeLocal('profile', updatedProfile);
  }, []);

  const setSummaryInCache = useCallback((newSummary) => {
    setSummary(newSummary);
    writeLocal('summary', newSummary);
    setHasLoadedSummary(true);
  }, []);

  const addHabitInCache = useCallback((newHabit) => {
    setHabits((prev) => {
      const updated = [newHabit, ...prev];
      writeLocal('habits', updated);
      return updated;
    });
  }, []);

  const updateHabitInCache = useCallback((updatedHabit) => {
    setHabits((prev) => {
      const updated = prev.map((h) => (h.id === updatedHabit.id ? updatedHabit : h));
      writeLocal('habits', updated);
      return updated;
    });
  }, []);

  const deleteHabitFromCache = useCallback((habitId) => {
    setHabits((prev) => {
      const updated = prev.filter((h) => h.id !== habitId);
      writeLocal('habits', updated);
      return updated;
    });
  }, []);

  return (
    <DataContext.Provider
      value={{
        profile,
        userProfile: profile,
        goals,
        journals,
        habits,
        summary,
        recentlyCompletedGoal,
        hasLoadedProfile,
        hasLoadedGoals,
        hasLoadedJournals,
        hasLoadedHabits,
        hasLoadedSummary,
        initialLoading,
        loading: initialLoading || !hasLoadedGoals,
        fetchProfile,
        fetchGoals,
        fetchJournals,
        fetchHabits,
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
        addHabitInCache,
        updateHabitInCache,
        deleteHabitFromCache,
        setHabitsInCache: setHabits,
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
