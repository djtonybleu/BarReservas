import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Reservation, Group } from '../types/models';

export function useReservations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReservation = async (data: Partial<Reservation> & { group: Partial<Group> }) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Crear grupo
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{ ...data.group }])
        .select()
        .single();
      if (groupError) throw groupError;
      // 2. Crear reserva
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert([{ ...data, group_id: group.id }])
        .select()
        .single();
      if (reservationError) throw reservationError;
      // 3. Actualizar group con reservation_id
      await supabase.from('groups').update({ reservation_id: reservation.id }).eq('id', group.id);
      setLoading(false);
      return { group, reservation };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  const getReservationByQR = async (qr: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, group:groups(*), table:tables(*)')
        .eq('qr_code_url', qr)
        .single();
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

  // Asignar mesa automática (ejemplo: la primera libre con capacidad suficiente)
  const assignTable = async (reservationId: string, people: number, type: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: tables, error } = await supabase
        .from('tables')
        .select('*')
        .eq('type', type)
        .eq('status', 'free')
        .gte('capacity', people);
      if (error) throw error;
      if (!tables || tables.length === 0) throw new Error('No hay mesas disponibles');
      const table = tables[0];
      await supabase.from('tables').update({ status: 'reserved', current_group_id: reservationId }).eq('id', table.id);
      await supabase.from('reservations').update({ table_id: table.id, status: 'confirmed' }).eq('id', reservationId);
      setLoading(false);
      return table;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  return { loading, error, createReservation, getReservationByQR, assignTable };
} 