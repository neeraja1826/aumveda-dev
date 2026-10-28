

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  login as loginApi,
  register as registerApi,
  getProfile,
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi,
} from '../services/authService';
import {
  saveAuthToken,
  getAuthToken,
  removeAuthToken,
  saveAuthUser,
  getAuthUser,
  removeAuthUser,
} from '../utils/storage';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // IMPORTANT:
  // true until we finish checking AsyncStorage.
  const [loading, setLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  // --------------------------------------------------
  // EXTRACT TOKEN
  // --------------------------------------------------

  const extractToken = (response) => {
    return (
      response?.access_token ??
      response?.token ??
      response?.data?.access_token ??
      response?.data?.token ??
      response?.data?.session?.access_token ??
      response?.session?.access_token ??
      null
    );
  };

  const extractRefreshToken = (response) => (
    response?.refresh_token ??
    response?.data?.refresh_token ??
    response?.data?.session?.refresh_token ??
    response?.session?.refresh_token ??
    null
  );

  // --------------------------------------------------
  // EXTRACT USER
  // --------------------------------------------------

  const extractUser = (response) => {
    if (!response || typeof response !== 'object') return null;
    if (response.user && typeof response.user === 'object') return response.user;
    if (response.data?.user && typeof response.data.user === 'object') return response.data.user;
    if (
      response.data &&
      typeof response.data === 'object' &&
      (response.data.id || response.data.email || response.data.name || response.data.full_name)
    ) {
      return response.data;
    }
    if (response.id || response.email || response.name || response.full_name || response.username) {
      return response;
    }
    return response.data ?? null;
  };

  // --------------------------------------------------
  // RESTORE SESSION
  // --------------------------------------------------

  const restoreSession = useCallback(async () => {
    try {
      console.log('=================================');
      console.log('AUTH: Restoring session...');

      const storedToken = await getAuthToken();
      const storedUser = await getAuthUser();

      if (storedUser) {
        setUser(storedUser);
      }

      let supabaseSession = null;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        supabaseSession = data.session;
      } catch (sessionError) {
        console.warn(
          'AUTH: Supabase session refresh unavailable; using saved access token:',
          sessionError?.message || sessionError
        );
      }
      const sessionToken = supabaseSession?.access_token || storedToken;

      console.log(
        'AUTH: Stored token exists:',
        !!sessionToken
      );

      if (!sessionToken) {
        console.log('AUTH: No stored token found');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      let activeUser = storedUser;

      try {
        console.log('AUTH DEBUG: Starting profile request');
        const response = await getProfile(sessionToken);
        console.log('AUTH DEBUG: Profile request completed');
        const profile = extractUser(response);
        if (profile) {
          activeUser = profile;
          await saveAuthUser(profile);
          console.log('AUTH: Session profile restored.');
        } else {
          console.warn('AUTH: Profile response was empty; checking stored user.');
        }
      } catch (profileError) {
        console.warn(
          'AUTH: Profile could not be refreshed; checking stored user:',
          profileError?.message || profileError
        );
        if (
          profileError?.message?.includes('401') ||
          profileError?.status === 401
        ) {
          console.log('AUTH: Token unauthorized or expired. Resetting session.');
          await removeAuthToken();
          await removeAuthUser();
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          return;
        }
      }

      if (activeUser) {
        setUser(activeUser);
        setToken(sessionToken);
        setIsAuthenticated(true);
        if (sessionToken !== storedToken) {
          await saveAuthToken(sessionToken);
        }
      } else {
        console.log('AUTH: No user found for session token. Clearing stale session.');
        await removeAuthToken();
        await removeAuthUser();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('AUTH: Session restore FAILED');
      console.log('AUTH ERROR:', error);

      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      console.log('AUTH: Restore complete');
      console.log('=================================');
    }
  }, []);

  useEffect(() => {
    // Session restoration updates state asynchronously after storage/network reads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'TOKEN_REFRESHED' || !session?.access_token) return;

      setToken(session.access_token);
      setIsAuthenticated(true);
      saveAuthToken(session.access_token).catch((error) => {
        console.error('AUTH: Refreshed token could not be saved:', error);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const login = async (
    email,
    password
  ) => {
    try {
      setLoading(true);

      const response =
        await loginApi(
          email,
          password
        );

      console.log(
        'AUTH: Login response:',
        JSON.stringify(
          response,
          null,
          2
        )
      );

      const newToken =
        extractToken(response);
      const refreshToken = extractRefreshToken(response);

      if (!newToken) {
        throw new Error(
          'Login succeeded but no authentication token was returned.'
        );
      }

      if (refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: newToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          console.warn(
            'AUTH: Could not persist refresh session:',
            sessionError.message
          );
        }
      }

      // ----------------------------------------------
      // SAVE TOKEN PERMANENTLY
      // ----------------------------------------------

      await saveAuthToken(
        newToken
      );

      console.log(
        'AUTH: Token saved.'
      );

      setToken(newToken);

      // ----------------------------------------------
      // Get user from login response
      // ----------------------------------------------

      let loggedInUser =
        extractUser(response);

      // ----------------------------------------------
      // If user is not returned,
      // fetch profile using token
      // ----------------------------------------------

      if (!loggedInUser) {
        try {
          const profileResponse =
            await getProfile(
              newToken
            );

          loggedInUser =
            extractUser(
              profileResponse
            );
        } catch (profileError) {
          console.error(
            'AUTH: Profile fetch after login failed:',
            profileError
          );
        }
      }

      // ----------------------------------------------
      // Save user in memory & persistent storage
      // ----------------------------------------------

      if (!loggedInUser && email) {
        loggedInUser = { email: email.trim() };
      }

      if (loggedInUser) {
        setUser(loggedInUser);
        await saveAuthUser(loggedInUser);
      }

      setIsAuthenticated(true);

      return {
        ...response,
        user: loggedInUser,
        token: newToken,
      };
    } catch (error) {
      console.error(
        'AUTH: Login failed:',
        error
      );

      setUser(null);
      setToken(null);
      setIsAuthenticated(false);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // REGISTER
  // --------------------------------------------------

  const register = async (
    name,
    email,
    password
  ) => {
    try {
      setLoading(true);

      const response =
        await registerApi(
          name,
          email,
          password
        );

      console.log(
        'AUTH: Register response:',
        JSON.stringify(
          response,
          null,
          2
        )
      );

      const newToken =
        extractToken(response);
      const refreshToken = extractRefreshToken(response);

      let registeredUser =
        extractUser(response);

      // ----------------------------------------------
      // Backend returned token
      // ----------------------------------------------

      if (newToken) {
        if (refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: newToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            console.warn(
              'AUTH: Could not persist registration refresh session:',
              sessionError.message
            );
          }
        }

        await saveAuthToken(
          newToken
        );

        setToken(newToken);

        // --------------------------------------------
        // Fetch profile if necessary
        // --------------------------------------------

        if (!registeredUser) {
          try {
            const profileResponse =
              await getProfile(
                newToken
              );

            registeredUser =
              extractUser(
                profileResponse
              );
          } catch (profileError) {
            console.error(
              'AUTH: Profile fetch after registration failed:',
              profileError
            );
          }
        }

        setIsAuthenticated(true);
      }

      if (registeredUser) {
        setUser(
          registeredUser
        );
      }

      return {
        ...response,
        user: registeredUser,
        token: newToken,
      };
    } catch (error) {
      console.error(
        'AUTH: Registration failed:',
        error
      );

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logout = async () => {   
    console.log(
      'AUTH: Logging out...'
    );

    try {
      await removeAuthToken();
      await removeAuthUser();
    } catch (error) {
      console.error(
        'AUTH: Logout storage error:',
        error
      );
    }

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('AUTH: Supabase session sign-out failed:', error);
    }

    setUser(null);
    setToken(null);
    setIsAuthenticated(false);

    console.log(
      'AUTH: Logout complete.'
    );
  };

  // --------------------------------------------------
  // FORGOT PASSWORD
  // --------------------------------------------------

  const forgotPassword = async (
    email
  ) => {
    return forgotPasswordApi(
      email
    );
  };

  // --------------------------------------------------
  // RESET PASSWORD
  // --------------------------------------------------

  const resetPassword = async (
    accessToken,
    password
  ) => {
    return resetPasswordApi(
      accessToken,
      password
    );
  };

  const loginWithGoogleSession = async (session) => {
    if (!session?.access_token || !session?.user) {
      throw new Error(
        'Google authentication did not return a valid session.'
      );
    }

    try {
      await saveAuthToken(session.access_token);

      setToken(session.access_token);
      setUser({
        id: session.user.id,
        email: session.user.email,
      });
      setIsAuthenticated(true);

      return session.user;
    } catch (error) {
      console.error('Google session update failed:', error);
      throw error;
    }
  };

  // --------------------------------------------------
  // CONTEXT VALUE
  // --------------------------------------------------

  const value = {
    user,
    token,
    updateUser: (profile) =>
      setUser((currentUser) => {
        const updated = {
          ...currentUser,
          ...profile,
        };
        saveAuthUser(updated);
        return updated;
      }),

    loading,
    isAuthenticated,

    login,
    register,
    logout,

    forgotPassword,
    resetPassword,

    restoreSession,
    loginWithGoogleSession,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

// --------------------------------------------------
// useAuth
// --------------------------------------------------

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}
 