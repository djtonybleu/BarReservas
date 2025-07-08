export type Role = 'organizer' | 'member' | 'admin';

export interface User {
  id: string;
  name?: string;
  gender: 'male' | 'female' | 'other';
  instagram?: string;
  email?: string;
  avatar_url?: string;
  role: Role;
  created_at: string;
}

export interface Group {
  id: string;
  organizer_id: string;
  name: string;
  reservation_id: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  group_id: string;
  table_id: string;
  date: string;
  time: string;
  people_count: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'cancelled';
  qr_code_url?: string;
  created_at: string;
}

export interface Table {
  id: string;
  number: number;
  type: 'standard' | 'vip' | 'terrace';
  capacity: number;
  status: 'free' | 'occupied' | 'reserved';
  current_group_id?: string;
}

export interface Consumption {
  id: string;
  user_id: string;
  group_id: string;
  reservation_id: string;
  item: string;
  amount: number;
  price: number;
  created_at: string;
}

export interface Metric {
  id: string;
  date: string;
  total_visits: number;
  total_consumption: number;
  unique_users: number;
  recurring_users: number;
  instagram_connected: number;
} 