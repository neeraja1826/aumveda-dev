
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase URL or key is missing. Check your customer-mobile .env file.'
  );
}

// Native platforms use AsyncStorage to persist the login session.
// Web uses browser storage only when running in the browser.
const authStorage =
  Platform.OS === 'web'
    ? typeof window !== 'undefined'
      ? window.localStorage
      : undefined
    : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    ...(authStorage ? { storage: authStorage } : {}),
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
