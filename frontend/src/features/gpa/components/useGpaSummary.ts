import { useState, useEffect, useCallback } from 'react';
import { gpaService, type GpaSummary } from '@/services/gpa/gpaService';

export function useGpaSummary() {
  const [summary, setSummary] = useState<GpaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await gpaService.getSummary();
      setSummary(data);
    } catch {
      setError('Không thể tải dữ liệu GPA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, loading, error, refresh: fetch };
}
