"use client";

import { useState } from "react";
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
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      router.push("/login");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Registration failed");
    }
  }

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border bg-[rgba(10,11,20,0.5)] text-white text-sm transition-all duration-300 focus:outline-none placeholder-[#4a5568] border-white/[0.08] focus:border-[rgba(110,84,200,0.6)] focus:bg-[rgba(10,11,20,0.8)] focus:shadow-[0_0_0_3px_rgba(110,84,200,0.12)] hover:border-white/[0.15] font-chillax";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-chillax"
      style={{ background: "radial-gradient(ellipse at top left, #1a1040 0%, #0a0b14 55%, #0e1020 100%)" }}
    >
      {/* Ambient orbs */}
      <div className="fixed top-1/4 -left-32 w-80 h-80 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #7c5cbf 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="fixed bottom-1/4 -right-32 w-80 h-80 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #4f3ba0 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Card */}
        <div className="rounded-3xl border border-white/[0.07] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)]" style={{ background: "#0b0d1a" }}>
          <div className="p-8 sm:p-10">
            <div className="flex justify-center mb-8">
              <Logo href="/" size="md" showText={true} variant="light" />
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-1.5 tracking-tight">Create Account</h1>
            <p className="text-sm text-[#8fa3c4] text-center mb-8">
              Already have an account?{" "}
              <Link href="/login" className="text-[#a87edf] font-semibold hover:text-white transition-colors">
                Sign in
              </Link>
            </p>

            {msg && (
              <div className="mb-5 p-3.5 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400">
                {msg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#c5d4ed] mb-2 tracking-wide uppercase">Full Name</label>
                <input
                  className={inputClass}
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c5d4ed] mb-2 tracking-wide uppercase">Email</label>
                <input
                  className={inputClass}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c5d4ed] mb-2 tracking-wide uppercase">Password</label>
                <input
                  className={inputClass}
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-1">
                <Button type="submit" size="lg" className="w-full">
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
