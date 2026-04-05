import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold text-blue-600">
          LuminaClean Dashboard
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-600">
            <LogOut size={20} /> Sign Out
          </button>
        </form>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
