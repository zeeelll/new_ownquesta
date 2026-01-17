"use client";

import { useState } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });

      router.push("/login");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleRegister}
        className="w-[360px] p-6 border rounded-xl"
      >
        <h1 className="text-2xl font-bold mb-4">Register</h1>

        {msg && <p className="text-red-500 mb-2">{msg}</p>}

        <input
          className="w-full border p-2 mb-3 rounded"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full border p-2 mb-3 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-2 mb-3 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-black text-white p-2 rounded-lg">
          Register
        </button>

        <p className="text-center mt-4 text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="underline text-black">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
