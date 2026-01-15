const BASE = process.env.NEXT_PUBLIC_API_URL;

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
