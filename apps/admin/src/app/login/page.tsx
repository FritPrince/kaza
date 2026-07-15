'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';

interface LoginResponse {
  accessToken?: string;
  requiresTotp?: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await apiFetch<LoginResponse>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, ...(totpCode ? { totpCode } : {}) }),
      });
      if (result.requiresTotp) {
        setRequiresTotp(true);
        return;
      }
      if (result.accessToken) {
        sessionStorage.setItem('kaza-admin-token', result.accessToken);
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* Left panel: the brand moment, quiet and material. */}
      <div className="hidden flex-1 flex-col justify-between bg-forest-deep p-10 text-paper lg:flex">
        <p className="font-display text-3xl font-semibold tracking-tight">Kaza</p>
        <div>
          <p className="font-display text-4xl font-medium leading-tight">
            De l’idée floue
            <br />
            au rendu, puis à l’action.
          </p>
          <p className="mt-4 max-w-sm text-sm text-sand">
            Espace réservé à l’équipe. Chaque action sensible est journalisée.
          </p>
        </div>
        <div className="flex gap-1.5">
          <span className="h-2 w-10 rounded-full bg-clay" />
          <span className="h-2 w-10 rounded-full bg-gold" />
          <span className="h-2 w-10 rounded-full bg-sand-deep" />
        </div>
      </div>

      {/* Right panel: the form, nothing else. */}
      <div className="flex flex-1 items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <p className="eyebrow">Back-office</p>
          <h1 className="masthead mt-2">Connexion</h1>

          <label className="mt-8 block text-sm font-medium" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-sand-deep bg-white px-3 py-2 text-sm"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-sand-deep bg-white px-3 py-2 text-sm"
          />

          {requiresTotp ? (
            <>
              <label className="mt-4 block text-sm font-medium" htmlFor="totp">
                Code de vérification (2FA)
              </label>
              <input
                id="totp"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-sand-deep bg-white px-3 py-2 font-mono text-sm tracking-[0.3em]"
              />
            </>
          ) : null}

          {error ? (
            <p role="alert" className="mt-4 rounded-md bg-clay-wash px-3 py-2 text-sm text-clay">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-forest-soft disabled:opacity-60"
          >
            {pending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  );
}
