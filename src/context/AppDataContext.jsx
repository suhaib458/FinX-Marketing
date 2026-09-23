import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import creditsApi from '../services/creditsApi';
import brandApi from '../services/brandApi';
import contentApi from '../services/contentApi';

const AppDataContext = createContext(null);

const newestFirst = (items) => [...items].sort(
  (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime(),
);

export function AppDataProvider({ children }) {
  const { firebaseUser, appUser } = useAuth();
  const [credits, setCredits] = useState(0);
  const [brand, setBrandState] = useState(null);
  const [contentItems, setContentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setCredits(0);
    setBrandState(null);
    setContentItems([]);
    setError(null);
  }, []);

  const refreshCredits = useCallback(async () => {
    if (!firebaseUser) {
      setCredits(0);
      return null;
    }
    const wallet = await creditsApi.getBalance(firebaseUser);
    const nextBalance = Number(wallet?.balance ?? appUser?.credits ?? 0);
    setCredits(Number.isFinite(nextBalance) ? nextBalance : 0);
    return wallet;
  }, [firebaseUser, appUser?.credits]);

  const refreshBrand = useCallback(async () => {
    if (!firebaseUser) {
      setBrandState(null);
      return null;
    }
    const brands = await brandApi.list(firebaseUser);
    const nextBrand = brands?.[0] || null;
    setBrandState(nextBrand);
    return nextBrand;
  }, [firebaseUser]);

  const refreshContent = useCallback(async () => {
    if (!firebaseUser) {
      setContentItems([]);
      return [];
    }
    const payload = await contentApi.list(firebaseUser, { page: 1, limit: 100 });
    const nextItems = newestFirst(payload.data || []);
    setContentItems(nextItems);
    return nextItems;
  }, [firebaseUser]);

  const refreshAll = useCallback(async () => {
    if (!firebaseUser) {
      reset();
      return;
    }

    setIsLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      refreshCredits(),
      refreshBrand(),
      refreshContent(),
    ]);
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) setError(failure.reason);
    setIsLoading(false);
  }, [firebaseUser, refreshBrand, refreshContent, refreshCredits, reset]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll, firebaseUser?.uid]);

  const setBrand = useCallback((nextBrand) => {
    setBrandState(nextBrand || null);
  }, []);

  const applyGenerationResult = useCallback((result) => {
    if (!result) return;
    if (Number.isFinite(result.balance)) setCredits(result.balance);
    setContentItems((previous) => newestFirst([
      result,
      ...previous.filter((item) => item.id !== result.id),
    ]));
  }, []);

  const updateContentItem = useCallback((id, updates) => {
    setContentItems((previous) => previous.map(
      (item) => item.id === id ? { ...item, ...updates } : item,
    ));
  }, []);

  const removeContentItem = useCallback((id) => {
    setContentItems((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const stats = useMemo(() => ({
    totalCreated: contentItems.length,
    totalSaved: contentItems.filter((item) => Boolean(item.savedAt || item.saved)).length,
  }), [contentItems]);

  const recentContent = useMemo(() => newestFirst(contentItems).slice(0, 4), [contentItems]);

  const value = useMemo(() => ({
    credits,
    brand,
    contentItems,
    recentContent,
    stats,
    isLoading,
    error,
    refreshAll,
    refreshCredits,
    refreshBrand,
    refreshContent,
    setBrand,
    setCredits,
    applyGenerationResult,
    updateContentItem,
    removeContentItem,
  }), [
    applyGenerationResult,
    brand,
    contentItems,
    credits,
    error,
    isLoading,
    recentContent,
    refreshAll,
    refreshBrand,
    refreshContent,
    refreshCredits,
    removeContentItem,
    setBrand,
    stats,
    updateContentItem,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
}

export default AppDataContext;
