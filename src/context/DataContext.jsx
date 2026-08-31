import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  userApi,
  goalApi,
  journalApi,
  summaryApi,
  progressApi
} from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState([]);
  const [journals, setJournals] = useState([]);
  const [summary, setSummary] = useState(null);

  // Stores latest progress for each goal:
  // {
  //   "7": { id, goal_id, progress_value, note, created_at }
  // }
  const [progress, setProgress] = useState({});

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
    setProgress({});

    setHasLoadedProfile(false);
    setHasLoadedGoals(false);
    setHasLoadedJournals(false);
    setHasLoadedSummary(false);

    setInitialLoading(true);
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

      if (!options.quiet) {
        throw err;
      }
    }
  }, []);

  // Fetch Goals
  const fetchGoals = useCallback(
    async (statusFilter = '', options = { quiet: false }) => {
      try {
        const data = await goalApi.listGoals(statusFilter);
        const loadedGoals = data || [];

        setGoals(loadedGoals);
        setHasLoadedGoals(true);

        return loadedGoals;
      } catch (err) {
        console.error('DataContext fetchGoals error:', err);

        if (!options.quiet) {
          throw err;
        }
      }
    },
    []
  );

  // Fetch latest progress for all goals
  const fetchProgress = useCallback(async (goalList = []) => {
    try {
      if (!goalList || goalList.length === 0) {
        setProgress({});
        return {};
      }

      const results = await Promise.allSettled(
        goalList.map((goal) => progressApi.getLatest(goal.id))
      );

      const progressMap = {};

      results.forEach((result, index) => {
        const goal = goalList[index];

        if (result.status === 'fulfilled') {
          progressMap[goal.id] = result.value;
        }
      });

      setProgress(progressMap);

      return progressMap;
    } catch (err) {
      console.error('DataContext fetchProgress error:', err);

      setProgress({});

      return {};
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

      if (!options.quiet) {
        throw err;
      }
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

      if (!options.quiet) {
        throw err;
      }
    }
  }, []);

  // Fetch All Data
  const fetchAllData = useCallback(
    async (options = { quiet: false }) => {
      try {
        const [
          profileRes,
          goalsRes,
          journalsRes,
          summaryRes
        ] = await Promise.allSettled([
          userApi.getProfile(),
          goalApi.listGoals(),
          journalApi.listJournals(),
          summaryApi.getWeeklySummary(),
        ]);

        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value);
          setHasLoadedProfile(true);
        }

        if (goalsRes.status === 'fulfilled') {
          const loadedGoals = goalsRes.value || [];

          setGoals(loadedGoals);
          setHasLoadedGoals(true);

          // Fetch persisted PostgreSQL progress for every loaded goal
          await fetchProgress(loadedGoals);
        }

        if (journalsRes.status === 'fulfilled') {
          setJournals(journalsRes.value || []);
          setHasLoadedJournals(true);
        }

        if (summaryRes.status === 'fulfilled') {
          setSummary(summaryRes.value);
          setHasLoadedSummary(true);
        }
      } catch (err) {
        console.error('DataContext fetchAllData error:', err);

        if (!options.quiet) {
          throw err;
        }
      } finally {
        setInitialLoading(false);
      }
    },
    [fetchProgress]
  );

  // Load initial data when authenticated user arrives
  useEffect(() => {
    if (user) {
      fetchAllData({ quiet: true });
    } else {
      clearCache();
    }
  }, [user, fetchAllData, clearCache]);

  // --- Cache Mutation Helpers ---

  const addGoal = useCallback((newGoal) => {
    setGoals((prev) => [newGoal, ...prev]);
  }, []);

  const updateGoalInCache = useCallback((updatedGoal) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === updatedGoal.id
          ? updatedGoal
          : goal
      )
    );
  }, []);

  const deleteGoalFromCache = useCallback((goalId) => {
    setGoals((prev) =>
      prev.filter((goal) => goal.id !== goalId)
    );

    // Also remove progress for deleted goal
    setProgress((prev) => {
      const updated = { ...prev };
      delete updated[goalId];
      return updated;
    });
  }, []);

  const addJournal = useCallback((newJournal) => {
    setJournals((prev) => [newJournal, ...prev]);
  }, []);

  const updateJournalInCache = useCallback((updatedJournal) => {
    setJournals((prev) =>
      prev.map((journal) =>
        journal.id === updatedJournal.id
          ? updatedJournal
          : journal
      )
    );
  }, []);

  const deleteJournalFromCache = useCallback((journalId) => {
    setJournals((prev) =>
      prev.filter((journal) => journal.id !== journalId)
    );
  }, []);

  const updateProfileInCache = useCallback((updatedProfile) => {
    setProfile(updatedProfile);
  }, []);

  const setSummaryInCache = useCallback((newSummary) => {
    setSummary(newSummary);
    setHasLoadedSummary(true);
  }, []);

  // Update one goal's progress directly in the cache
  const updateProgressInCache = useCallback((goalId, progressRecord) => {
    setProgress((prev) => ({
      ...prev,
      [goalId]: progressRecord,
    }));
  }, []);

  return (
    <DataContext.Provider
      value={{
        profile,
        userProfile: profile,

        goals,
        journals,
        summary,
        progress,

        hasLoadedProfile,
        hasLoadedGoals,
        hasLoadedJournals,
        hasLoadedSummary,
        initialLoading,

        fetchProfile,
        fetchGoals,
        fetchJournals,
        fetchSummary,
        fetchProgress,
        fetchAllData,

        addGoal,
        updateGoalInCache,
        deleteGoalFromCache,

        addJournal,
        updateJournalInCache,
        deleteJournalFromCache,

        updateProfileInCache,
        updateProfileLocal: updateProfileInCache,

        setSummaryInCache,
        updateProgressInCache,

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