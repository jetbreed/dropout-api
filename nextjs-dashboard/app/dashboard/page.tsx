// nextjs-dashboard/app/admin/students/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, RefreshCw, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchStudents(token);
  }, [page, pageSize, search]);

  const fetchStudents = async (token: string) => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/api/students/?page=${page}&page_size=${pageSize}${search ? `&search=${search}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(data.students || []);
        setTotalPages(data.total_pages || 1);
        setTotalStudents(data.total || 0);
      } else {
        setError(data.detail || 'Failed to fetch students');
      }
    } catch (err) {
      setError('Failed to fetch students');
    }
    setLoading(false);
  };

  const predictStudent = async (studentId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}/predict`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchStudents(token);
      }
    } catch (err) {
      console.error('Prediction failed', err);
    }
  };

  const getRiskBadge = (category: string) => {
    const styles: Record<string, string> = {
      'High': 'bg-red-100 text-red-700 border-red-200',
      'Medium': 'bg-amber-100 text-amber-700 border-amber-200',
      'Low': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return styles[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1); // Reset to first page when changing page size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👨‍🎓 Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalStudents} students in the system</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const token = localStorage.getItem('access_token');
              if (token) {
                fetch('/api/seed/students?count=10', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                }).then(() => fetchStudents(token));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Seed
          </button>
          <button
            onClick={() => router.push('/admin/students/add')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search and Page Size */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Show</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none bg-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-500">per page</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Email</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Assignments</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Test Scores</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Absences</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student: any, index: number) => {
                  const serialNumber = (page - 1) * pageSize + index + 1;
                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-3 py-3 text-sm text-gray-400 text-center">{serialNumber}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-xs text-gray-400 sm:hidden">{student.email}</div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 hidden sm:table-cell">{student.email}</td>
                      <td className="px-3 py-3 text-sm font-medium">{student.attendance_rate}%</td>
                      <td className="px-3 py-3 text-sm hidden md:table-cell">{student.assignments_completed}%</td>
                      <td className="px-3 py-3 text-sm hidden lg:table-cell">{student.test_scores_avg}%</td>
                      <td className="px-3 py-3 text-sm hidden xl:table-cell">{student.days_absent_last_term}</td>
                      <td className="px-3 py-3">
                        {student.risk_category ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRiskBadge(student.risk_category)}`}>
                            {student.risk_category} ({Math.round(student.risk_score || 0)}%)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => predictStudent(student.id)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium transition mr-3"
                        >
                          Predict
                        </button>
                        <button
                          onClick={() => router.push(`/admin/students/${student.id}`)}
                          className="text-gray-500 hover:text-gray-700 text-sm transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalStudents > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
          <span className="text-gray-500">
            Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalStudents)} of {totalStudents} students
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`min-w-[36px] h-9 px-3 rounded-xl transition ${
                  pageNum === page
                    ? 'bg-primary-600 text-white font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}