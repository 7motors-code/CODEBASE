'use client';
import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { Submit } from '@/components/client';
import { portalLogin, type LoginState } from './actions';

/** Phone + CNIC sign-in. A failed attempt keeps the phone number; the CNIC is never echoed back. */
export function LoginForm() {
  const [state, action] = useFormState<LoginState, FormData>(portalLogin, { error: null, phone: '', at: 0 });
  const errRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.error) errRef.current?.focus(); }, [state]);
  return (
    <form action={action} className="space-y-3">
      {state.error && <p ref={errRef} tabIndex={-1} role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad outline-none">{state.error}</p>}
      <label className="block"><span className="label">Mobile number</span>
        <input key={state.at} name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={20} defaultValue={state.phone} className="input font-mono" placeholder="03XX XXXXXXX" /></label>
      <label className="block"><span className="label">CNIC</span>
        <input name="cnic" required inputMode="numeric" autoComplete="off" maxLength={20} className="input font-mono" placeholder="00000-0000000-0" /></label>
      <Submit className="btn-primary btn-lg w-full" pendingText="Signing in…">View my bookings</Submit>
    </form>
  );
}
