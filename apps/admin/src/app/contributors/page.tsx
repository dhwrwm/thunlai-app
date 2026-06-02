import { createClient } from '@/lib/supabase/server';
import type { Contributor } from '@thunlai/types';

export const dynamic = 'force-dynamic';

export default async function ContributorsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('contributors')
    .select('*')
    .order('created_at', { ascending: false });

  const contributors = (data ?? []) as Contributor[];

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Contributors</h1>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Joined</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contributors.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{c.display_name}</td>
                <td className="px-6 py-4 text-gray-500">{c.email}</td>
                <td className="px-6 py-4 text-gray-400">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      c.approved
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {c.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contributors.length === 0 && (
          <p className="p-8 text-center text-gray-400">No contributors yet.</p>
        )}
      </div>
    </>
  );
}
