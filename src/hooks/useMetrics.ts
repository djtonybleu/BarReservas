import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Metric } from '../types/models';

export function useMetrics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setLoading(false);
      return data as Metric[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  return { loading, error, getMetrics };
} 