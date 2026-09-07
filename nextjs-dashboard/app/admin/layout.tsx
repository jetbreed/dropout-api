// nextjs-dashboard/app/admin/layout.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const navItems = [
    { path: '/admin/dashboard', label: '📊 Dashboard', icon: '📊' },
    { path: '/admin/students', label: '👨‍🎓 Students', icon: '👨‍🎓' },
    { path: '/admin/students/add', label: '➕ Add Student', icon: '➕' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-blue-600">🎓 Dropout Prediction</h1>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              router.push('/login');
            }}
            className="bg-red-500 text-white px-4 py-1 rounded-md text-sm hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Admin Sidebar + Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-screen p-4 border-r">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`block px-4 py-2 rounded-md transition ${
                    pathname === item.path
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}