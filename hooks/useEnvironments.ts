'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Environment {
  enterpriseId: string;
  enterpriseName: string;
  propertyName?: string;
  type: 'trial' | 'manual';
  status?: string;
  customerEmail?: string;
  loginUrl?: string;
  createdAt: Date;
  accessTokenId: number;
}

interface UseEnvironmentsResult {
  environments: Environment[];
  loading: boolean;
  refetch: () => void;
}

function sortEnvironments(envs: Environment[]): Environment[] {
  return [...envs].sort((a, b) => {
    const nameA = (a.propertyName || a.enterpriseName || '').toLowerCase();
    const nameB = (b.propertyName || b.enterpriseName || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

export function useEnvironments(): UseEnvironmentsResult {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnvironments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/environments/list');
      const data = await response.json();
      if (data.success) {
        setEnvironments(sortEnvironments(data.environments || []));
      }
    } catch {
      // fetch failed — leave environments empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  return { environments, loading, refetch: fetchEnvironments };
}
