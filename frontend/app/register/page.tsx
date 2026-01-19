"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      {/* Enhanced Interactive Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Base gradient layers */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.12) 0%, transparent 60%)
          `
        }} />
        
        {/* Mouse-responsive floating orbs */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[80px] transition-all duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            top: `${Math.max(-10, Math.min(40, (mousePos.y / (typeof window !== 'undefined' ? window.innerHeight : 1000)) * 100))}%`,
            right: `${Math.max(-10, Math.min(40, (mousePos.x / (typeof window !== 'undefined' ? window.innerWidth : 1000)) * 100))}%`,
            transform: `translate(50%, -50%) scale(${1 + (mousePos.x / (typeof window !== 'undefined' ? window.innerWidth : 1000)) * 0.3})`
          }}
        />
        <div 
          className="absolute w-[400px] h-[400px] rounded-full blur-[70px] transition-all duration-1500 ease-out"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
            bottom: `${Math.max(-5, Math.min(45, (((typeof window !== 'undefined' ? window.innerHeight : 1000) - mousePos.y) / (typeof window !== 'undefined' ? window.innerHeight : 1000)) * 100))}%`,
            left: `${Math.max(-5, Math.min(45, (((typeof window !== 'undefined' ? window.innerWidth : 1000) - mousePos.x) / (typeof window !== 'undefined' ? window.innerWidth : 1000)) * 100))}%`,
            transform: `translate(-50%, 50%) scale(${1 + (mousePos.y / (typeof window !== 'undefined' ? window.innerHeight : 1000)) * 0.2})`
          }}
        />

        {/* Floating geometric shapes */}
        <div className="absolute top-[20%] left-[10%] w-24 h-24 border border-indigo-400/20 rounded-full animate-pulse"
             style={{ animationDelay: '0s', animationDuration: '5s' }} />
        <div className="absolute top-[15%] right-[15%] w-16 h-16 border border-purple-400/15 rounded-lg rotate-45 animate-bounce"
             style={{ animationDelay: '1.5s', animationDuration: '7s' }} />
        <div className="absolute bottom-[25%] left-[20%] w-20 h-20 border border-violet-400/18 rounded-full animate-ping"
             style={{ animationDelay: '3s', animationDuration: '6s' }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Particle effects */}
        <div className="absolute top-[35%] left-[30%] w-1 h-1 bg-indigo-400 rounded-full animate-pulse opacity-40" />
        <div className="absolute top-[50%] right-[25%] w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-30" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[30%] left-[35%] w-1 h-1 bg-violet-400 rounded-full animate-pulse opacity-35" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[25%] right-[35%] w-1 h-1 bg-indigo-300 rounded-full animate-pulse opacity-25" style={{ animationDelay: '0.5s' }} />
      </div>
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
