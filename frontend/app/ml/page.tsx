"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /ml  →  redirects to /lab (Lab Playground)
 *
 * The Lab Playground is the new unified ML experience, powered by
 * lab-agent (port 8020) + lab-backend (port 8010).
 */
export default function MLRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/lab');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0b14',
      color: '#94a3b8',
      fontFamily: "'Inter', sans-serif",
      fontSize: 14,
    }}>
      Redirecting to Lab Playground…
    </div>
  );
}
