import React, { createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import { handleAPIError } from '../utils/errorHandler';

interface APIContextType {
  createReservation: (data: ReservationData) => Promise<unknown>;
  getGroup: (id: string) => Promise<unknown>;
  addMember: (groupId: string, memberData: MemberData) => Promise<unknown>;
  updateMemberStatus: (groupId: string, memberId: string, status: string) => Promise<unknown>;
  getTables: () => Promise<unknown>;
  getMetrics: () => Promise<unknown>;
  assignTable: (groupId: string) => Promise<unknown>;
  sendInstagramMessage: () => Promise<{ success: boolean }>;
  sendEmail: () => Promise<{ success: boolean }>;
}

interface ReservationData {
  nombre: string;
  contacto: string;
  fecha: string;
  hora: string;
  personas: number;
  tipoMesa: string;
  observaciones?: string;
}

interface MemberData {
  genero: string;
  instagram?: string;
}

const APIContext = createContext<APIContextType | undefined>(undefined);

// Configure axios base URL - adjust this to match your backend
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const APIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const createReservation = async (data: ReservationData) => {
    try {
      const response = await api.post('/api/reservations', data);
      return response.data;
    } catch (error) {
      const apiError = handleAPIError(error);
      console.error('Error creating reservation:', apiError);
      throw apiError;
    }
  };

  const getGroup = async (id: string) => {
    try {
      const response = await api.get(`/api/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  };

  const addMember = async (groupId: string, memberData: MemberData) => {
    try {
      const response = await api.post(`/api/groups/${groupId}/miembro`, memberData);
      return response.data;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  };

  const updateMemberStatus = async (groupId: string, memberId: string, status: string) => {
    try {
      const response = await api.patch(`/api/groups/${groupId}/miembro/${memberId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating member status:', error);
      throw error;
    }
  };

  const getTables = async () => {
    try {
      const response = await api.get('/api/tables');
      return response.data;
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  };

  const getMetrics = async () => {
    try {
      const response = await api.get('/api/monitoring/metrics/realtime');
      return response.data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  };

  const assignTable = async (groupId: string) => {
    try {
      const response = await api.post(`/grupo/${groupId}/asignar-mesa`);
      return response.data;
    } catch (error) {
      console.error('Error assigning table:', error);
      throw error;
    }
  };

  const sendInstagramMessage = async () => {
    // Placeholder: integración real con Instagram API
    try {
      return { success: true };
    } catch (error) {
      console.error('Error sending Instagram message:', error);
      throw error;
    }
  };

  const sendEmail = async () => {
    // Placeholder: integración real con servicio de email
    try {
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  };

  return (
    <APIContext.Provider value={{
      createReservation,
      getGroup,
      addMember,
      updateMemberStatus,
      getTables,
      getMetrics,
      assignTable,
      sendInstagramMessage,
      sendEmail,
    }}>
      {children}
    </APIContext.Provider>
  );
};

export const useAPI = () => {
  const context = useContext(APIContext);
  if (context === undefined) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return context;
};