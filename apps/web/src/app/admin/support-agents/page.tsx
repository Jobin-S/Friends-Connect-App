'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Button, ErrorText, Field, Input } from '../../../components/form';
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
      setMessage(`${agent.displayName} (${agent.phoneNumber}) can now log in with OTP as Customer Care.`);
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
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Customer Care agents</h1>

      <form onSubmit={add} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <h2 className="font-semibold">Add an agent</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Mobile number">
            <Input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="97777 00002"
            />
          </Field>
          <Field label="Name">
            <Input
              required
              minLength={2}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Field>
        </div>
        <ErrorText>{error}</ErrorText>
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? 'Adding…' : 'Add agent'}
        </Button>
      </form>

      {agents === null ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2">Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id} className="border-t border-slate-800">
                <td className="py-2">{a.displayName}</td>
                <td>{a.phoneNumber}</td>
                <td>{a.status}</td>
                <td>{new Date(a.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
