import Link from 'next/link';
export default function Forbidden() {
  return <div className="card mx-auto mt-20 max-w-md p-8 text-center"><h1 className="text-xl font-bold">No access</h1><p className="mt-2 text-sm text-muted">Your role does not have permission to open this page. Ask the admin to update your permissions in User Management.</p><Link href="/admin" className="btn-gold mt-6">Back to dashboard</Link></div>;
}
