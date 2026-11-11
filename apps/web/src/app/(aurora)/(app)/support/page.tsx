'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { Dots } from '@/components/ui/motion';

interface Msg {
  id: number;
  from: 'me' | 'agent';
  text: string;
  at: string;
}

const quick = ['I was charged twice', 'Report a user', 'A call dropped', 'Change my number'];
const now = () => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export default function SupportPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 1,
      from: 'agent',
      text: 'Hi, I am Priya from the support team. What can I help with today?',
      at: now(),
    },
  ]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, typing]);

  // TODO(api): send through the support socket instead of this canned reply.
  const send = (t: string) => {
    const body = t.trim();
    if (!body) return;
    setMsgs((m) => [...m, { id: Date.now(), from: 'me', text: body, at: now() }]);
    setText('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [
        ...m,
        {
          id: Date.now() + 1,
          from: 'agent',
          text: 'Thanks, I am looking into it now. If it is easier to explain, you can call me with the button above.',
          at: now(),
        },
      ]);
    }, 1600);
  };

  return (
    <div className="glass mx-auto flex h-[calc(100dvh-13rem)] max-w-3xl flex-col overflow-hidden rounded-[2.25rem] shadow-glass md:h-[calc(100dvh-10rem)]">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar name="Priya N" hue="lilac" size="md" status="online" />
          <div>
            <h1 className="font-bold leading-tight">Support</h1>
            <p className="text-xs text-ink-soft">Priya usually replies in under a minute</p>
          </div>
        </div>
        <ButtonLink href="/call?with=Priya&type=audio&hue=lilac&support=1" variant="quiet">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
          </svg>
          Call
        </ButtonLink>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5" aria-live="polite">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`flex animate-rise ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-[1.4rem] px-4 py-2.5 ${
                m.from === 'me' ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md bg-white text-ink'
              }`}
            >
              <p className="leading-relaxed">{m.text}</p>
              <p className={`mt-1 text-[11px] ${m.from === 'me' ? 'text-white/50' : 'text-ink-faint'}`}>
                {m.at}
              </p>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex animate-rise">
            <div className="rounded-[1.4rem] rounded-bl-md bg-white px-4 py-3 text-ink-soft">
              <Dots />
              <span className="sr-only">Priya is typing</span>
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      {msgs.length < 3 && (
        <div className="flex gap-2 overflow-x-auto px-5 pb-3">
          {quick.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="press shrink-0 rounded-full border border-line bg-white/60 px-3.5 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="flex items-center gap-2 border-t border-line p-3"
      >
        <label className="sr-only" htmlFor="support-msg">
          Message
        </label>
        <input
          id="support-msg"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message"
          className="h-12 flex-1 rounded-full bg-white/80 px-5 outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-coral/40"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send message"
          className="press grid h-12 w-12 place-items-center rounded-full bg-coral text-white shadow-lift disabled:opacity-40"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}
