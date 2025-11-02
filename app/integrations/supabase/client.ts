import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://cpkekvgvyotbnlmpttst.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa2Vrdmd2eW90Ym5sbXB0dHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTMxNjYsImV4cCI6MjA3Njc4OTE2Nn0.nSWmJ_K5EWPDC4iBJTTpmQ1zrQR8nJWa_qz7pIbXosA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
