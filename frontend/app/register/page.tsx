"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from '../components/Logo';
import Button from '../components/Button';

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const router = useRouter();

  // Mouse tracking for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,#0a0e1a_50%)] relative overflow-hidden">
      <form
        onSubmit={handleRegister}
        className="w-[360px] p-6 border rounded-xl bg-[rgba(15,23,42,0.7)] backdrop-blur-md border-[rgba(255,255,255,0.1)]"
      >
        <div className="flex justify-center mb-6">
          <Logo href="/" size="md" showText={true} variant="light" />
        </div>

        <h1 className="text-2xl font-bold mb-4 text-white text-center">Register</h1>

        {msg && <p className="text-red-500 mb-2 text-center">{msg}</p>}

        <input
          className="w-full border p-3 mb-3 rounded-lg bg-[rgba(15,23,42,0.5)] border-[rgba(255,255,255,0.1)] text-white placeholder-gray-400 focus:border-[#8b5cf6] focus:outline-none"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full border p-3 mb-3 rounded-lg bg-[rgba(15,23,42,0.5)] border-[rgba(255,255,255,0.1)] text-white placeholder-gray-400 focus:border-[#8b5cf6] focus:outline-none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-3 mb-3 rounded-lg bg-[rgba(15,23,42,0.5)] border-[rgba(255,255,255,0.1)] text-white placeholder-gray-400 focus:border-[#8b5cf6] focus:outline-none"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" className="w-full">
          Register
        </Button>

        <p className="text-center mt-4 text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-[#8b5cf6] hover:text-[#7c3aed] underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
