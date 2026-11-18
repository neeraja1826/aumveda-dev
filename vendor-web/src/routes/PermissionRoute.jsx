
import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

/*
 * Checks whether the authenticated vendor user
 * can access the requested page.
 *
 * This is frontend route protection.
 * FastAPI remains responsible for enforcing
 * authorization on every API endpoint.
 */

export default function PermissionRoute({
  pageKey,
}) {
  const {
    loading,
    permissionsReady,
    canAccess,
    homePath,
  } = useAuth();

  if (loading || !permissionsReady) {
    return null;
  }

  if (!canAccess(pageKey)) {
    return (
      <Navigate
        to={homePath}
        replace
      />
    );
  }

  return <Outlet />;
}
