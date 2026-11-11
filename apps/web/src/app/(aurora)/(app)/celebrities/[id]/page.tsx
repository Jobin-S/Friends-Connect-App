'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';
import { Avatar, hueSurface } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { celebrities, formatCount } from '@/data/aurora-mock';

export default function CelebrityPage() {
  const { id } = useParams<{ id: string }>();
  const c = celebrities.find((x) => x.id === id);
  const toast = useToast();
  const [following, setFollowing] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  if (!c) notFound();

  const canCall = c.status === 'online';

  return (
    <div>
      <Link href="/celebrities" className="text-sm font-semibold text-ink-soft hover:text-ink">
        Back to stars
      </Link>

      <section className={`relative mt-4 overflow-hidden rounded-[2.5rem] p-6 md:p-10 ${hueSurface[c.hue]}`}>
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/40 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-5">
            <Avatar name={c.name} hue={c.hue} size="xl" status={c.status} />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{c.name}</h1>
              <p className="text-ink-soft">
                {c.craft}, {c.city}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {formatCount(c.followers + (following ? 1 : 0))} followers
              </p>
            </div>
          </div>
          <Button
            variant="quiet"
            onClick={() => {
              setFollowing((f) => !f);
              toast(following ? `Unfollowed ${c.name}` : `Following ${c.name}`);
            }}
            aria-pressed={following}
          >
            {following ? 'Following' : 'Follow'}
          </Button>
        </div>
        <p className="relative mt-6 max-w-xl text-lg leading-relaxed">{c.bio}</p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="text-xl font-bold">Posts</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {c.posts.map((p) => {
              const on = liked.includes(p.id);
              return (
                <li
                  key={p.id}
                  className={`relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[1.5rem] p-3 ${hueSurface[p.hue]}`}
                >
                  {p.kind === 'video' && (
                    <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/70 backdrop-blur">
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Video">
                        <path d="M8 5v14l11-7z" fill="currentColor" />
                      </svg>
                    </span>
                  )}
                  <p className="text-sm font-semibold leading-snug">{p.caption}</p>
                  <button
                    onClick={() => setLiked((l) => (on ? l.filter((x) => x !== p.id) : [...l, p.id]))}
                    aria-pressed={on}
                    className="press mt-2 flex w-fit items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      className={on ? 'text-coral-deep' : ''}
                      aria-hidden
                    >
                      <path
                        d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
                        fill={on ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    {formatCount(p.likes + (on ? 1 : 0))}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="glass h-fit rounded-[2rem] p-6 shadow-glass lg:sticky lg:top-28">
          <h2 className="text-xl font-bold">Call {c.name.split(' ')[0]}</h2>
          <p className="mt-1 text-sm text-ink-soft">{c.replies}</p>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/70 p-4">
              <dt className="text-xs font-semibold text-ink-soft">Audio</dt>
              <dd className="mt-1 text-2xl font-extrabold">{c.audioRate}</dd>
              <dd className="text-xs text-ink-faint">coins a minute</dd>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <dt className="text-xs font-semibold text-ink-soft">Video</dt>
              <dd className="mt-1 text-2xl font-extrabold">{c.videoRate}</dd>
              <dd className="text-xs text-ink-faint">coins a minute</dd>
            </div>
          </dl>
          <div className="mt-5 grid gap-2">
            {canCall ? (
              <>
                <ButtonLink
                  href={`/call?with=${encodeURIComponent(c.name)}&type=video&hue=${c.hue}&rate=${c.videoRate}`}
                  size="lg"
                >
                  Start video call
                </ButtonLink>
                <ButtonLink
                  href={`/call?with=${encodeURIComponent(c.name)}&type=audio&hue=${c.hue}&rate=${c.audioRate}`}
                  variant="quiet"
                  size="lg"
                >
                  Start audio call
                </ButtonLink>
              </>
            ) : (
              <Button
                size="lg"
                variant="quiet"
                onClick={() => toast(`We will tell you when ${c.name} is online`)}
              >
                Notify me when online
              </Button>
            )}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            You are charged per minute from your wallet. The call ends on its own when your coins run out.
          </p>
        </aside>
      </div>
    </div>
  );
}
