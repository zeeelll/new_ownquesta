// Prefer the same URL used for auth/session so cookies stay valid.
const BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export async function api(path: string, options: RequestInit = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      credentials: "include" // ✅ important for cookies/session
    });

    // Handle different response types
    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      // For non-JSON responses (like 401, 403, etc.)
      const text = await res.text();
      data = text ? { message: text } : {};
    }

    if (!res.ok) {
      // Provide clear error message based on status code
      if (res.status === 401) {
        throw new Error("Unauthorized");
      } else if (res.status === 403) {
        throw new Error("Forbidden");
      } else if (res.status === 404) {
        throw new Error("Not Found");
      } else {
        throw new Error(data.message || `API Error: ${res.status}`);
      }
    }

    return data;
  } catch (error: any) {
    // Network errors or fetch failures
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      throw error; // Re-throw auth errors as-is
    }
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Backend server is not responding. Make sure it's running on " + BASE);
    }
    throw error;
  }
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

// User registration (for admins to create regular users)
export async function registerUser(userData: { name: string; email: string; password: string }) {
  return api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData)
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

// Gen agent (explain) — proxies to backend /api/gen/explain
export async function explainModelViaGen(best_model: any, eda_result?: any, goal?: any, processed_sample?: any, model_summaries?: any) {
  return api('/api/gen/explain', {
    method: 'POST',
    body: JSON.stringify({ best_model, eda_result, goal, processed_sample, model_summaries })
  });
}
