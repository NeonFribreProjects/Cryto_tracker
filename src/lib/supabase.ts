import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CryptoPurchase {
  id: string;
  symbol: string;
  purchase_date: string;
  amount: number;
  purchase_price_usd: number | null;
  created_at: string;
  updated_at: string;
}
