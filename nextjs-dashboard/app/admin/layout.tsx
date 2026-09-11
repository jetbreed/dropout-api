// nextjs-dashboard/app/admin/layout.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Menu,
  X,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        if (userData.role !== 'admin') {
          router.push('/dashboard');
        }
      } catch (e) {
        router.push('/login');
      }
    }

    // Load saved sidebar state
    const saved = localStorage.getItem('sidebar_open');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }

    // Close mobile sidebar on route change
    setMobileOpen(false);
  }, [pathname, router]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebar_open', String(newState));
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/students', label: 'Students', icon: Users },
    { path: '/admin/students/add', label: 'Add Student', icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Toggle sidebar"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary-600" />
              <h1 className="text-lg font-bold text-blue-600">Dropout Predictor</h1>
              <span className="hidden sm:inline text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray-600">
              {user?.username}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                router.push('/login');
              }}
              className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Mobile Overlay */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            bg-white shadow-md border-r transition-all duration-300 ease-in-out
            fixed lg:sticky top-[57px] h-[calc(100vh-57px)] z-40
            ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'}
            ${mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'}
          `}
        >
          <ul className="space-y-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-primary-50 text-primary-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'}
                      ${!sidebarOpen ? 'lg:justify-center' : ''}
                    `}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={`${!sidebarOpen ? 'lg:hidden' : ''} whitespace-nowrap`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}