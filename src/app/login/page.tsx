import Image from 'next/image';
import LoginForm from './LoginForm';
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-dark via-navy to-navy-light p-4">
      <div className="w-full max-w-md rounded-3xl border border-gold/30 bg-navy-dark/80 p-8 text-white shadow-2xl backdrop-blur">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image src="/logo.jpg" alt="7 Motors" width={110} height={110} className="rounded-full shadow-lg ring-2 ring-gold/50" priority />
          <h1 className="text-2xl font-bold text-gold-light">Seven Motors</h1>
          <p className="text-sm text-white/60">Car rental management — sign in to continue</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
