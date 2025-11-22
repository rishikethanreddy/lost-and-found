import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your Supabase project URL and anon key
const supabaseUrl = 'https://jvoazxwwlzmztkvropmm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2b2F6eHd3bHptenRrdnJvcG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzI2NDQsImV4cCI6MjA3MjIwODY0NH0.57GvYXI0sm4g7B1ic9FTRAAqMXLvU407Xj5PiNGmFso';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
