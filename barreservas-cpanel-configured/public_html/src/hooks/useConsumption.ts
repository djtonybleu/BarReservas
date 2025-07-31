import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Consumption } from '../types/models';

export function useConsumption() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addConsumption = async (data: Partial<Consumption>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('consumption')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  const getGroupConsumption = async (groupId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('consumption')
        .select('*')
        .eq('group_id', groupId);
      if (error) throw error;
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  const getUserConsumption = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('consumption')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  return { loading, error, addConsumption, getGroupConsumption, getUserConsumption };
} 