import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getStats() {
  const supabase = await createClient();
  const [pending, approved, rejected, contributors] = await Promise.all([
    supabase.from('recordings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('recordings').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('recordings').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('contributors').select('id', { count: 'exact', head: true }).eq('approved', true),
  ]);
  return {
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    contributors: contributors.count ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: 'Pending Review', value: stats.pending, color: 'bg-amber-50 text-amber-700 border-amber-200', href: '/recordings' },
    { label: 'Approved', value: stats.approved, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', href: '/recordings?status=approved' },
    { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 text-red-700 border-red-200', href: '/recordings?status=rejected' },
    { label: 'Active Contributors', value: stats.contributors, color: 'bg-blue-50 text-blue-700 border-blue-200', href: '/contributors' },
  ];

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map(({ label, value, color, href }) => (
          <a key={label} href={href} className={`rounded-2xl border p-6 ${color} hover:opacity-80`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="mt-1 text-sm font-medium">{label}</p>
          </a>
        ))}
      </div>

      {stats.pending > 0 && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-medium text-amber-800">
            {stats.pending} recording{stats.pending !== 1 ? 's' : ''} waiting for review.
          </p>
          <a href="/recordings" className="mt-2 inline-block text-sm font-medium text-amber-700 underline">
            Review now →
          </a>
        </div>
      )}
    </>
  );
}
