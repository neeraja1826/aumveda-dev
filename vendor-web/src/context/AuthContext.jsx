
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  clearAuthTokens,
  getAccessToken,
  saveAuthTokens,
  vendorApi,
} from "../services/api";

import {
  canAccessVendorPage,
  getVendorHomePath,
} from "../utils/vendorPermissions";

const AuthContext = createContext(null);

/* ============================================================
   RESPONSE HELPERS
============================================================ */

function unwrapResponse(response) {
  if (
    response?.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    return response.data;
  }

  return response || {};
}

function normalizeVendorProfile(response) {
  const data = unwrapResponse(response);

  const value =
    data?.vendor ||
    data?.profile ||
    data;

  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : null;
}

function normalizeAuthorization(data) {
  const authorization = data?.authorization;

  if (
    !authorization ||
    typeof authorization !== "object" ||
    Array.isArray(authorization)
  ) {
    return null;
  }

  /*
   * Do not guess permissions.
   * A valid authorization response must identify
   * whether the user is the Vendor Owner.
   */
  if (typeof authorization.is_owner !== "boolean") {
    return null;
  }

  if (
    authorization.is_owner === false &&
    !Array.isArray(authorization.permissions)
  ) {
    return null;
  }

  return {
    ...authorization,

    is_owner:
      authorization.is_owner === true,

    permissions:
      Array.isArray(authorization.permissions)
        ? authorization.permissions.filter(
            (permission) =>
              typeof permission === "string"
          )
        : [],
  };
}

function normalizeAuthResponse(response) {
  const data = unwrapResponse(response);

  return {
    user: data.user || null,
    vendor: data.vendor || null,
    membership: data.membership || null,

    authorization:
      normalizeAuthorization(data),

    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}

function errorMessage(error, fallback) {
  return error?.message || fallback;
}

/* ============================================================
   AUTH PROVIDER
============================================================ */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [membership, setMembership] = useState(null);

  const [authorization, setAuthorization] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const requestIdRef = useRef(0);

  /* ==========================================================
     SESSION STATE
  ========================================================== */

  const clearSession = useCallback(() => {
    clearAuthTokens();

    setUser(null);
    setVendor(null);
    setMembership(null);
    setAuthorization(null);
  }, []);

  const applySession = useCallback((session) => {
    setUser(session.user);
    setVendor(session.vendor);
    setMembership(session.membership);
    setAuthorization(session.authorization);
  }, []);

  const syncVendorProfile = useCallback(
    (updatedProfile) => {
      if (
        !updatedProfile ||
        typeof updatedProfile !== "object" ||
        Array.isArray(updatedProfile)
      ) {
        return;
      }

      setVendor((current) => ({
        ...(current || {}),
        ...updatedProfile,
      }));
    },
    []
  );

  /* ==========================================================
     REFRESH VENDOR PROFILE
  ========================================================== */

  const refreshVendorProfile = useCallback(async () => {
    const response = await vendorApi.getProfile();

    const updated =
      normalizeVendorProfile(response);

    if (updated) {
      syncVendorProfile(updated);
    }

    return updated;
  }, [syncVendorProfile]);

  /* ==========================================================
     OPTIONAL PROFILE REFRESH
  ========================================================== */

  const refreshProfileSafely = useCallback(
    async (requestId) => {
      /*
       * Profile access can be restricted for staff.
       * A 403 here must not invalidate their login.
       */
      try {
        const profileResponse =
          await vendorApi.getProfile();

        const latestProfile =
          normalizeVendorProfile(profileResponse);

        if (
          latestProfile &&
          requestId === requestIdRef.current
        ) {
          syncVendorProfile(latestProfile);
        }
      } catch (error) {
        if (error?.status !== 403) {
          console.warn(
            "Vendor profile refresh unavailable:",
            error
          );
        }
      }
    },
    [syncVendorProfile]
  );

  /* ==========================================================
     RESTORE CURRENT SESSION AND PERMISSIONS
  ========================================================== */

  const loadCurrentUser = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const token = getAccessToken();

    setLoading(true);
    setAuthError("");

    if (!token) {
      setUser(null);
      setVendor(null);
      setMembership(null);
      setAuthorization(null);
      setLoading(false);

      return null;
    }

    try {
      const response = await vendorApi.me();

      const session =
        normalizeAuthResponse(response);

      if (!session.user) {
        throw Object.assign(
          new Error(
            "The session response did not contain a user."
          ),
          { status: 401 }
        );
      }

      if (!session.authorization) {
        throw new Error(
          "The backend did not return valid vendor authorization."
        );
      }

      if (requestId !== requestIdRef.current) {
        return null;
      }

      applySession(session);

      /*
       * Don't let a restricted profile endpoint
       * block an otherwise valid staff session.
       */
      await refreshProfileSafely(requestId);

      return session;
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return null;
      }

      if (error?.status === 401) {
        clearSession();

        setAuthError(
          "Your session has expired. Please sign in again."
        );
      } else {
        /*
         * Keep the saved token on temporary failures.
         * Never grant access without authorization.
         */
        setUser(null);
        setVendor(null);
        setMembership(null);
        setAuthorization(null);

        setAuthError(
          errorMessage(
            error,
            "Unable to verify your login session."
          )
        );
      }

      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    applySession,
    clearSession,
    refreshProfileSafely,
  ]);

  /* ==========================================================
     INITIAL RESTORATION
  ========================================================== */

  useEffect(() => {
    loadCurrentUser();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadCurrentUser]);

  /* ==========================================================
     LOGIN
  ========================================================== */

  const login = useCallback(
    async (email, password) => {
      const requestId = ++requestIdRef.current;

      setLoading(true);
      setAuthError("");
      setAuthorization(null);

      let tokenSaved = false;

      try {
        const response = await vendorApi.login({
          email,
          password,
        });

        const loginSession =
          normalizeAuthResponse(response);

        if (!loginSession.access_token) {
          throw new Error(
            "Login succeeded without an access token."
          );
        }

        saveAuthTokens(
          loginSession.access_token,
          loginSession.refresh_token
        );

        tokenSaved = true;

        /*
         * Fetch /auth/me after login.
         *
         * This is essential because the login
         * response may not include the employee's
         * effective custom-role permissions.
         */
        const meResponse = await vendorApi.me();

        const verifiedSession =
          normalizeAuthResponse(meResponse);

        if (!verifiedSession.user) {
          throw new Error(
            "Unable to verify the logged-in user."
          );
        }

        if (!verifiedSession.authorization) {
          throw new Error(
            "Unable to load vendor permissions."
          );
        }

        if (requestId !== requestIdRef.current) {
          return response;
        }

        applySession(verifiedSession);

        await refreshProfileSafely(requestId);

        return response;
      } catch (error) {
        if (requestId === requestIdRef.current) {
          /*
           * If authentication succeeded but /me
           * failed, keep tokens for a safe retry.
           * No permissions are granted.
           */
          setUser(null);
          setVendor(null);
          setMembership(null);
          setAuthorization(null);

          if (!tokenSaved || error?.status === 401) {
            clearSession();
          }

          setAuthError(
            errorMessage(
              error,
              "Unable to verify your vendor access."
            )
          );
        }

        throw error;
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [
      applySession,
      clearSession,
      refreshProfileSafely,
    ]
  );

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const logout = useCallback(() => {
    requestIdRef.current += 1;

    clearSession();

    setAuthError("");
    setLoading(false);
  }, [clearSession]);

  /* ==========================================================
     MANUAL SESSION REFRESH
  ========================================================== */

  const refreshUser = useCallback(async () => {
    return loadCurrentUser();
  }, [loadCurrentUser]);

  /* ==========================================================
     DERIVED AUTHORIZATION
  ========================================================== */

  const approved =
    String(vendor?.status || "")
      .trim()
      .toLowerCase() === "approved";

  const memberRole =
    String(membership?.member_role || "")
      .trim()
      .toLowerCase();

  /*
   * Owner status comes from the backend's
   * verified authorization object.
   */
  const isOwner =
    authorization?.is_owner === true;

  const permissionsReady =
    authorization !== null;

  const permissions = useMemo(
    () => authorization?.permissions || [],
    [authorization]
  );

  const membershipActive =
    membership?.is_active !== false &&
    membership?.membership_active !== false;

  const access = useMemo(
    () => ({
      isOwner,
      permissions,
    }),
    [isOwner, permissions]
  );

  const canAccess = useCallback(
    (pageKey) =>
      permissionsReady &&
      canAccessVendorPage(pageKey, access),
    [permissionsReady, access]
  );

  const homePath = useMemo(
    () =>
      permissionsReady
        ? getVendorHomePath(access)
        : "/no-access",
    [permissionsReady, access]
  );

  /* ==========================================================
     CONTEXT VALUE
  ========================================================== */

  const contextValue = useMemo(
    () => ({
      user,
      vendor,
      membership,
      authorization,

      loading,
      authError,

      approved,
      memberRole,
      isOwner,
      membershipActive,

      permissions,
      permissionsReady,

      canAccess,
      homePath,

      login,
      logout,
      refreshUser,
      refreshVendorProfile,
      syncVendorProfile,
    }),
    [
      user,
      vendor,
      membership,
      authorization,

      loading,
      authError,

      approved,
      memberRole,
      isOwner,
      membershipActive,

      permissions,
      permissionsReady,

      canAccess,
      homePath,

      login,
      logout,
      refreshUser,
      refreshVendorProfile,
      syncVendorProfile,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/* ============================================================
   AUTH HOOK
============================================================ */

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}
