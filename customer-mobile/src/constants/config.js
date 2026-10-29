const LOCAL_API_URL =
  process.env.EXPO_PUBLIC_API_URL_LOCAL ||
  'http://192.168.0.31:8001/api/v1';

const PRODUCTION_API_URL =
  process.env.EXPO_PUBLIC_API_URL_PRODUCTION ||
  'https://aumveda-customer-backend-2.onrender.com/api/v1';

export const API_BASE_URL = PRODUCTION_API_URL;

export const APP_NAME = 'AUMVEDA';
export const API_TIMEOUT = 15000;

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://cheuntpecafsdcjumkzs.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZXVudHBlY2Fmc2RjanVta3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NTcwMjUsImV4cCI6MjEwODEzMzAyNX0.vSuIWFqe5N5wkAsnLlIQQ6-vU_yxUgXvoweAFSMv1-g';