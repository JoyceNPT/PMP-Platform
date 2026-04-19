import { useState, useEffect, useCallback } from 'react';
import { roadmapService, type CareerRoadmap, type UserCareerProfile } from '@/services/roadmap/roadmapService';

export function useCareerProfile() {
  const [profile, setProfile] = useState<UserCareerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setProfile(await roadmapService.getProfile()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { profile, loading, refresh: fetch };
}

export function useActiveRoadmap() {
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { 
      const data = await roadmapService.getActiveRoadmap();
      setRoadmap(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setRoadmap(null);
      } else {
        setError('Không thể tải roadmap.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { roadmap, loading, error, refresh: fetch };
}
