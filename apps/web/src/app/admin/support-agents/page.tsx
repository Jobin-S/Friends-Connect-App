'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AuthError, AuthField, fieldClass } from '../../../components/ui/AuthLayout';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Dots } from '../../../components/ui/motion';
import { api, ApiError } from '../../../lib/api';

interface Agent {
  id: string;
  phoneNumber: string;
  displayName: string;
  status: string;
  createdAt: string;
}

export default function SupportAgentsPage() {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setAgents(await api<Agent[]>('/api/admin/support-agents'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load agents.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const agent = await api<Agent>('/api/admin/support-agents', {
        method: 'POST',
        body: { phone, displayName },
      });
      setMessage(
        `${agent.displayName} (${agent.phoneNumber}) can now log in with a code as a support agent.`,
      );
      setPhone('');
      setDisplayName('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add the agent.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <form onSubmit={add} className="glass grid h-fit gap-4 rounded-[2rem] p-6 shadow-glass">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Add a support agent</h1>
          <p className="mt-1 text-sm text-ink-soft">They log in with their phone number and a code.</p>
        </div>
        <AuthField label="Mobile number">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="97777 00002"
            className={fieldClass}
          />
        </AuthField>
        <AuthField label="Name">
          <input
            required
            minLength={2}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={fieldClass}
          />
        </AuthField>
        <AuthError>{error}</AuthError>
        {message && (
          <p role="status" className="animate-rise rounded-2xl bg-mint/70 px-4 py-3 text-sm font-medium">
            {message}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? <Dots /> : 'Add agent'}
        </Button>
      </form>

      <section className="glass rounded-[2rem] p-6 shadow-glass">
        <h2 className="text-xl font-bold">Support team</h2>
        {agents === null ? (
          <div className="mt-4 grid gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-14 animate-shimmer rounded-2xl" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <p className="mt-4 text-ink-soft">No agents yet. Add the first one on the left.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {agents.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <Avatar name={a.displayName} hue="mint" size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.displayName}</p>
                  <p className="text-sm text-ink-soft">{a.phoneNumber}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    a.status === 'ACTIVE' ? 'bg-mint' : 'bg-coral-wash text-coral-deep'
                  }`}
                >
                  {a.status === 'ACTIVE' ? 'Active' : a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                </span>
                <span className="hidden text-xs text-ink-faint sm:inline">
                  Added {new Date(a.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
