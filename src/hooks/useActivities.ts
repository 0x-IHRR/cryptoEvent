import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  ExchangeId,
  SourceHealth,
  ActivitiesApiResponse,
  SourcesApiResponse,
} from '../types/activity.js';
import {
  calculateActivityStatus,
  sortActivities,
  computeSevenDayHorizon,
} from '../utils/activity.js';
import manualActivitiesRaw from '../../data/manual-activities.json' with { type: 'json' };

const fallbackManual = manualActivitiesRaw as Activity[];

export interface FilterState {
  searchQuery: string;
  selectedExchange: ExchangeId | 'ALL';
  selectedCategory: string;
  selectedStatus: 'ALL' | 'endingSoon' | 'open' | 'upcoming' | 'ended';
  selectedDateStr: string | null; // Filter by 7-day horizon day
  sortBy: 'endingSoon' | 'rewardScale' | 'newest';
  onlyFavorites: boolean;
  viewMode: 'cards' | 'compact';
}

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Favorites state persisted in localStorage (zero login required)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('exchange_radar_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('exchange_radar_favorites', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save favorites to localStorage', e);
      }
      return next;
    });
  }, []);

  const [filters, setFiltersState] = useState<FilterState>({
    searchQuery: '',
    selectedExchange: 'ALL',
    selectedCategory: 'ALL',
    selectedStatus: 'ALL',
    selectedDateStr: null,
    sortBy: 'newest',
    onlyFavorites: false,
    viewMode: 'cards',
  });

  const setFilters = useCallback((updates: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [actRes, srcRes] = await Promise.all([
        fetch('/api/activities'),
        fetch('/api/sources'),
      ]);

      if (!actRes.ok || !srcRes.ok) {
        throw new Error(`API returned HTTP ${actRes.status} / ${srcRes.status}`);
      }

      const actData: ActivitiesApiResponse = await actRes.json();
      const srcData: SourcesApiResponse = await srcRes.json();

      setActivities(actData.activities || []);
      setSources(srcData.sources || []);
      setUpdatedAt(actData.updatedAt || new Date().toISOString());
    } catch (err: any) {
      console.warn('API fetch failed, falling back to local dataset:', err?.message);
      // Seamless client-side fallback
      const now = new Date();
      const updatedFallback = fallbackManual.map((item) => ({
        ...item,
        status: calculateActivityStatus(item.startsAt, item.endsAt, now),
      }));
      setActivities(updatedFallback);
      setUpdatedAt(now.toISOString());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Refresh trigger error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute 7-day horizon from active activities
  const sevenDayHorizon = useMemo(() => {
    return computeSevenDayHorizon(activities, new Date());
  }, [activities]);

  // Overall metrics
  const stats = useMemo(() => {
    let openCount = 0;
    let endingSoonCount = 0;
    let upcomingCount = 0;
    let totalUsd = 0;

    for (const a of activities) {
      if (a.status === 'open') openCount++;
      if (a.status === 'endingSoon') {
        endingSoonCount++;
        openCount++;
      }
      if (a.status === 'upcoming') upcomingCount++;

      if (a.rewardAmount && typeof a.rewardAmount === 'number') {
        const c = (a.rewardCurrency || '').toUpperCase();
        if (c === 'USDT' || c === 'USD' || c === 'USDC') {
          totalUsd += a.rewardAmount;
        }
      }
    }

    return {
      total: activities.length,
      openCount,
      endingSoonCount,
      upcomingCount,
      totalUsd,
    };
  }, [activities]);

  // Filtered and sorted activities
  const filteredActivities = useMemo(() => {
    let list = activities.filter((act) => {
      // 1. Search Query
      const query = (filters.searchQuery || '').trim();
      if (query) {
        const q = query.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchExchange = act.exchange.toLowerCase().includes(q);
        const matchCategory = act.category.toLowerCase().includes(q);
        const matchTags = act.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const matchDesc = act.description?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchExchange && !matchCategory && !matchTags && !matchDesc) {
          return false;
        }
      }

      // 2. Exchange Filter
      if (filters.selectedExchange !== 'ALL' && act.exchange !== filters.selectedExchange) {
        return false;
      }

      // 3. Category Filter
      if (filters.selectedCategory !== 'ALL' && act.category !== filters.selectedCategory) {
        return false;
      }

      // 4. Status Filter
      if (filters.selectedStatus !== 'ALL') {
        if (filters.selectedStatus === 'open') {
          if (act.status !== 'open' && act.status !== 'endingSoon') return false;
        } else if (act.status !== filters.selectedStatus) {
          return false;
        }
      }

      // 5. Seven Day Horizon Date filter
      if (filters.selectedDateStr) {
        if (!act.endsAt) return false;
        const endDate = new Date(act.endsAt);
        const dateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        if (dateStr !== filters.selectedDateStr) return false;
      }

      // 6. Only Favorites
      if (filters.onlyFavorites && !favoriteIds.includes(act.id)) {
        return false;
      }

      return true;
    });

    return sortActivities(list, filters.sortBy);
  }, [activities, filters, favoriteIds]);

  // Exchange counts for tabs
  const exchangeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: activities.length };
    for (const a of activities) {
      counts[a.exchange] = (counts[a.exchange] || 0) + 1;
    }
    return counts;
  }, [activities]);

  return {
    activities,
    filteredActivities,
    sources,
    stats,
    sevenDayHorizon,
    exchangeCounts,
    filters,
    setFilters,
    favoriteIds,
    toggleFavorite,
    selectedActivity,
    setSelectedActivity,
    updatedAt,
    isLoading,
    isRefreshing,
    error,
    refreshData,
  };
}
