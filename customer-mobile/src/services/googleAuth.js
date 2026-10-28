import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  try {
    const redirectTo = 'aumveda://auth/callback';

    console.log('App redirect URI:', redirectTo);

    // 2. Request Google OAuth URL from Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;

    if (!data?.url) {
      throw new Error('Supabase did not return an OAuth URL.');
    }

    // 3. Verify the redirect Supabase received
    const authorizeUrl = new URL(data.url);
    const supabaseRedirect = authorizeUrl.searchParams.get('redirect_to');

    console.log('Supabase redirect_to:', supabaseRedirect);

    // 4. Open Google's sign-in page
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    );

    console.log('Browser result type:', result.type);
    console.log('Returned callback URL:', result.url ?? 'No URL');

    // 5. Handle cancellation or missing callback
    if (result.type !== 'success' || !result.url) {
      return {
        session: null,
        error: null,
        cancelled: true,
      };
    }

    // 6. Parse the callback returned to the app
    const callbackUrl = new URL(result.url);

    if (
      callbackUrl.protocol !== 'aumveda:' ||
      callbackUrl.hostname !== 'auth' ||
      callbackUrl.pathname !== '/callback'
    ) {
      throw new Error(
        `Unexpected OAuth callback URL: ${result.url}`
      );
    }

    // 7. Handle OAuth errors
    const authError =
      callbackUrl.searchParams.get('error_description') ||
      callbackUrl.searchParams.get('error');

    if (authError) {
      throw new Error(authError);
    }

    // 8. Extract the authorization code
    const code = callbackUrl.searchParams.get('code');

    if (!code) {
      throw new Error(
        'OAuth callback did not contain an authorization code.'
      );
    }

    // 9. Exchange the code for a Supabase session
    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) throw sessionError;

    if (!sessionData.session) {
      throw new Error(
        'Google login completed without a Supabase session.'
      );
    }

    console.log('Google sign-in successful.');

    return {
      session: sessionData.session,
      error: null,
      cancelled: false,
    };
  } catch (error) {
    console.error('AUMVEDA Google sign-in failed:', error);

    return {
      session: null,
      error,
      cancelled: false,
    };
  }
}
