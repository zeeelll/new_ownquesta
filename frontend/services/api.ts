// Prefer the same URL used for auth/session so cookies stay valid.
const BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    credentials: "include" // ✅ important for cookies/session
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "API Error");
  }

  return data;
}

// Test endpoint
export async function testHelloAPI() {
  return api("/hello");
}

// Admin API functions
export async function getAllUsers() {
  return api("/api/admin/users");
}

export async function getUserById(id: string) {
  return api(`/api/admin/users/${id}`);
}

export async function updateUser(id: string, userData: any) {
  return api(`/api/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData)
  });
}

export async function deleteUser(id: string) {
  return api(`/api/admin/users/${id}`, {
    method: "DELETE"
  });
}

export async function makeUserAdmin(id: string) {
  return api(`/api/admin/users/${id}/make-admin`, {
    method: "PUT"
  });
}

export async function removeUserAdmin(id: string) {
  return api(`/api/admin/users/${id}/remove-admin`, {
    method: "PUT"
  });
}

// Admin registration
export async function registerAdmin(adminData: { name: string; email: string; password: string }) {
  return api("/api/admin/register-admin", {
    method: "POST",
    body: JSON.stringify(adminData)
  });
}

// Activity tracking
export async function getUserActivities(userId: string) {
  return api(`/api/admin/users/${userId}/activities`);
}

export async function getAllActivities(limit?: number, skip?: number) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (skip) params.append('skip', skip.toString());
  return api(`/api/admin/activities?${params.toString()}`);
}
