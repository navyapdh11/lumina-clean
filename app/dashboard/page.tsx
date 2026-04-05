import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome back, {user?.email}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bookings table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Bookings</h2>
          {bookings && bookings.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Preview</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="py-2">{new Date(booking.date).toLocaleDateString()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-2">
                      <Link href={`/dashboard/preview/${booking.id}`} className="text-blue-600 hover:underline">
                        View 3D
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No bookings yet.</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/booking/new" className="text-blue-600 hover:underline">➕ New Booking</Link>
            </li>
            <li>
              <Link href="/dashboard/quotes" className="text-blue-600 hover:underline">💰 View Quotes</Link>
            </li>
            <li>
              <Link href="/dashboard/settings" className="text-blue-600 hover:underline">⚙️ Settings</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
