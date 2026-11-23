'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { login } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn-primary btn-lg w-full" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>;
}

export default function LoginForm() {
  const [state, action] = useFormState(login, null as null | { error?: string });
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" required autoComplete="username" className="input h-11" />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className="input h-11" />
      </label>
      {state?.error && <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-3 py-2.5 text-sm text-bad">{state.error}</p>}
      <div className="pt-2"><SubmitButton /></div>
    </form>
  );
}
