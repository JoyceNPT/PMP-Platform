import { useState, useEffect, useCallback } from 'react';
import { financeService, type MonthlySummary, type SavingGoal, type Transaction, type AiPrediction } from '@/services/finance/financeService';

export function useFinanceSummary(year: number, month: number) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setSummary(await financeService.getMonthlySummary(year, month)); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { fetch(); }, [fetch]);
  return { summary, loading, refresh: fetch };
}

export function useSavingGoals() {
  const [goals, setGoals]   = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setGoals(await financeService.getSavingGoals()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { goals, loading, refresh: fetch };
}

export function useTransactions(params: { month?: number; year?: number; type?: number }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setTransactions(await financeService.getTransactions(params)); }
    finally { setLoading(false); }
  }, [params.month, params.year, params.type]);

  useEffect(() => { fetch(); }, [fetch]);
  return { transactions, loading, refresh: fetch };
}

export function useAiPrediction() {
  const [prediction, setPrediction] = useState<AiPrediction | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    financeService.getAiPrediction()
      .then(setPrediction)
      .finally(() => setLoading(false));
  }, []);

  return { prediction, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<import('@/services/finance/financeService').FinanceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setCategories(await financeService.getCategories()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { categories, loading, refresh: fetch };
}
