'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { login } from './actions';
function Btn() { const { pending } = useFormStatus(); return <button className="btn-gold w-full py-3" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>; }
export default function LoginForm() {
  const [state, action] = useFormState(login, null as null | { error?: string });
  return (
    <form action={action} className="space-y-4">
      <div><label className="mb-1 block text-xs font-semibold uppercase text-white/60">Email</label>
        <input name="email" type="email" required className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-gold" placeholder="you@example.com" /></div>
      <div><label className="mb-1 block text-xs font-semibold uppercase text-white/60">Password</label>
        <input name="password" type="password" required className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-gold" /></div>
      {state?.error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</p>}
      <Btn />
    </form>
  );
}
