'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CountUp } from '@/components/ui/motion';
import { useToast } from '@/components/ui/Toast';
import { coinPacks, formatRupees, transactions } from '@/data/aurora-mock';
import { useCoins } from '@/data/aurora-store';

export default function WalletPage() {
  const [coins, setCoins] = useCoins();
  const [packId, setPackId] = useState(coinPacks[2].id);
  const [paying, setPaying] = useState(false);
  const [history, setHistory] = useState(transactions);
  const toast = useToast();
  const pack = coinPacks.find((p) => p.id === packId)!;

  const buy = () => {
    setPaying(true);
    // TODO(api): hand off to the payment provider, then credit coins from the webhook.
    setTimeout(() => {
      const added = pack.coins + pack.bonus;
      setCoins((c) => c + added);
      setHistory((h) => [
        {
          id: `x${Date.now()}`,
          label: 'Added coins',
          detail: `${pack.coins} pack${pack.bonus ? ` + ${pack.bonus} bonus` : ''}`,
          amount: added,
          when: 'Just now',
        },
        ...h,
      ]);
      setPaying(false);
      toast(`Added ${added.toLocaleString('en-IN')} coins`);
    }, 900);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Wallet</h1>

        {/* Balance card: the coin is the one bold moment on this page */}
        <div className="relative mt-6 overflow-hidden rounded-[2.5rem] bg-ink p-7 text-white">
          <div
            className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-gradient-to-br from-[#FFC24B] to-coral animate-breathe"
            aria-hidden
          />
          <div className="absolute -right-12 -top-12 grid h-56 w-56 place-items-center" aria-hidden>
            <span className="mr-6 mt-8 h-24 w-24 rounded-full border-[6px] border-white/40" />
          </div>
          <p className="relative text-sm font-semibold text-white/60">Your balance</p>
          <p className="relative mt-2 text-6xl font-extrabold tracking-tight tabular-nums">
            <CountUp value={coins} />
          </p>
          <p className="relative mt-1 text-white/60">coins</p>
          <p className="relative mt-8 max-w-xs text-sm text-white/70">
            Enough for about {Math.floor(coins / 40)} minutes of audio with most stars.
          </p>
        </div>

        <h2 className="mt-8 text-xl font-bold">Add coins</h2>
        <fieldset className="mt-4 grid grid-cols-2 gap-3">
          <legend className="sr-only">Coin pack</legend>
          {coinPacks.map((p) => {
            const on = p.id === packId;
            return (
              <label
                key={p.id}
                className={`press relative cursor-pointer rounded-[1.5rem] border-2 p-4 transition-colors ${
                  on
                    ? 'border-coral bg-coral-wash'
                    : 'glass border-transparent shadow-glass hover:bg-white/90'
                }`}
              >
                <input
                  type="radio"
                  name="pack"
                  className="sr-only"
                  checked={on}
                  onChange={() => setPackId(p.id)}
                />
                {p.bonus > 0 && (
                  <span className="absolute right-3 top-3 rounded-full bg-mint px-2 py-0.5 text-[11px] font-bold">
                    +{p.bonus}
                  </span>
                )}
                <span className="block text-2xl font-extrabold tabular-nums">
                  {p.coins.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-ink-soft">{formatRupees(p.price)}</span>
              </label>
            );
          })}
        </fieldset>
        <Button size="lg" className="mt-5 w-full" onClick={buy} disabled={paying}>
          {paying ? 'Adding coins…' : `Pay ${formatRupees(pack.price)}`}
        </Button>
      </section>

      <section className="glass h-fit rounded-[2rem] p-6 shadow-glass lg:mt-[4.25rem]">
        <h2 className="text-xl font-bold">History</h2>
        <ul className="mt-4 divide-y divide-line">
          {history.map((t) => (
            <li key={t.id} className="flex animate-rise items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <p className="truncate font-semibold">{t.label}</p>
                <p className="text-xs text-ink-soft">
                  {t.detail}, {t.when}
                </p>
              </div>
              <span
                className={`shrink-0 font-bold tabular-nums ${t.amount > 0 ? 'text-emerald-600' : 'text-ink'}`}
              >
                {t.amount > 0 ? '+' : '−'}
                {Math.abs(t.amount).toLocaleString('en-IN')}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
