// Plain, unstyled-ish form primitives for the Phase 1 functional screens.
// The redesign will replace the styling; keep the props.
import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function Button({
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const colors = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
  }[variant];
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${colors} ${props.className ?? ''}`}
    />
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="text-sm text-rose-400" role="alert">
      {children}
    </p>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
      {title && <h1 className="text-xl font-bold">{title}</h1>}
      {children}
    </div>
  );
}
