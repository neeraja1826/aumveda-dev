
/**
 * AUMVEDA Vendor Web
 * Team Management API Service
 *
 * Features:
 * - Custom role listing
 * - Custom role details
 * - Custom role creation
 * - Custom role updates
 * - Custom role activation/deactivation
 * - Employee custom-role assignment
 * - Owner-created employee accounts
 * - Legacy staff invitation support
 *
 * Security:
 * - Access token obtained from existing auth service
 * - Vendor ownership verified by FastAPI
 * - Vendor ID is never supplied by the frontend
 * - Employee passwords are never stored here
 * - Backend validates assigned custom roles
 */

import { getAccessToken } from "./api";
import { API_BASE_URL } from "../config/api";


// ============================================================
// API CONFIGURATION
// ============================================================



// ============================================================
// COMMON AUTHENTICATED REQUEST
// ============================================================

async function request(
  path,
  method = "GET",
  payload
) {
  const token = getAccessToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please log in again."
    );
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (payload !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method,
        headers,

        ...(payload === undefined
          ? {}
          : {
              body: JSON.stringify(payload),
            }),

        cache: "no-store",
      }
    );
  } catch {
    throw new Error(
      "Unable to connect to the AUMVEDA Vendor Backend. " +
      "Please verify that the server is running."
    );
  }

  // ----------------------------------------------------------
  // PARSE RESPONSE
  // ----------------------------------------------------------

  const contentType =
    response.headers.get("content-type") || "";

  let data = null;

  if (response.status !== 204) {
    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      data = await response.text();
    }
  }

  // ----------------------------------------------------------
  // HANDLE ERRORS
  // ----------------------------------------------------------

  if (!response.ok) {
    let message =
      `Request failed (${response.status}).`;

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (
      Array.isArray(data?.detail)
    ) {
      message = data.detail
        .map((item) => {
          const field = Array.isArray(item.loc)
            ? item.loc
                .filter(
                  (part) =>
                    part !== "body"
                )
                .join(".")
            : "";

          const detail =
            item.msg ||
            "Invalid input";

          return field
            ? `${field}: ${detail}`
            : detail;
        })
        .join("; ");
    } else if (
      typeof data?.detail?.message === "string"
    ) {
      message = data.detail.message;
    } else if (
      typeof data?.message === "string"
    ) {
      message = data.message;
    } else if (
      typeof data === "string" &&
      data.trim()
    ) {
      message = data;
    }

    const error = new Error(message);

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}


// ============================================================
// URL HELPERS
// ============================================================

const memberPath = (id) =>
  `/vendor/team/${encodeURIComponent(String(id))}`;

const rolePath = (id) =>
  `/vendor/team/roles/${encodeURIComponent(String(id))}`;


// ============================================================
// TEAM MANAGEMENT API
// ============================================================

export const teamManagementApi = {

  // ----------------------------------------------------------
  // CUSTOM ROLE MANAGEMENT
  // ----------------------------------------------------------

  getRoles: () =>
    request(
      "/vendor/team/roles"
    ),

  getRole: (id) =>
    request(
      rolePath(id)
    ),

  createRole: (payload) =>
    request(
      "/vendor/team/roles",
      "POST",
      payload
    ),

  updateRole: (id, payload) =>
    request(
      rolePath(id),
      "PATCH",
      payload
    ),

  setRoleActive: (id, isActive) =>
    request(
      `${rolePath(id)}/status`,
      "PATCH",
      {
        is_active: isActive,
      }
    ),


  // ----------------------------------------------------------
  // ASSIGN CUSTOM ROLES TO EXISTING EMPLOYEE
  // ----------------------------------------------------------

  assignMemberRoles: (id, roleIds) =>
    request(
      `${memberPath(id)}/custom-roles`,
      "PUT",
      {
        role_ids: roleIds,
      }
    ),


  // ----------------------------------------------------------
  // OWNER-CREATED EMPLOYEE ACCOUNTS
  //
  // POST /api/v1/vendor/team/employees
  //
  // Payload:
  // {
  //   full_name: string,
  //   email: string,
  //   password: string,
  //   role_ids: string[]
  // }
  //
  // Owner creates credentials and assigns roles.
  // Employee uses the existing Vendor Web login.
  // ----------------------------------------------------------

  createEmployee: (payload) =>
    request(
      "/vendor/team/employees",
      "POST",
      payload
    ),


  // ----------------------------------------------------------
  // LEGACY STAFF INVITATION
  //
  // Preserved for compatibility.
  // The UI remains disabled until separately verified.
  // ----------------------------------------------------------

  inviteMember: (payload) =>
    request(
      "/vendor/team/invite",
      "POST",
      payload
    ),

};


export default teamManagementApi;
