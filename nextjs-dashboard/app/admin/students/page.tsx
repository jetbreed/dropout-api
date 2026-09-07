// nextjs-dashboard/app/admin/students/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchStudents(token);
  }, [page, search, sortBy, sortOrder]);

  const fetchStudents = async (token: string) => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/api/students/?page=${page}&page_size=${pageSize}&sort_by=${sortBy}&sort_order=${sortOrder}${search ? `&search=${search}` : ''}`;
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
    const styles = {
      'High': 'bg-red-100 text-red-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-green-100 text-green-800',
    };
    return styles[category as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        ❌ {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👨‍🎓 Students</h1>
          <p className="text-sm text-gray-500">{totalStudents} total students</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin/students/add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            + Add Student
          </button>
          <button
            onClick={() => {
              const token = localStorage.getItem('access_token');
              if (token) {
                fetch('/api/seed/students?count=50', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                }).then(() => fetchStudents(token));
              }
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            Seed 50 Students
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('first_name')}>
                  Name {sortBy === 'first_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('age')}>
                  Age {sortBy === 'age' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('attendance_rate')}>
                  Attendance {sortBy === 'attendance_rate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('assignments_completed')}>
                  Assignments {sortBy === 'assignments_completed' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('test_scores_avg')}>
                  Test Scores {sortBy === 'test_scores_avg' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('days_absent_last_term')}>
                  Absences {sortBy === 'days_absent_last_term' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('risk_score')}>
                  Risk {sortBy === 'risk_score' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No students found. Click "Add Student" or "Seed Students" to get started.
                  </td>
                </tr>
              ) : (
                students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-4 whitespace-nowrap font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.email}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      {student.age}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={student.attendance_rate < 60 ? 'text-red-600 font-medium' : ''}>
                        {student.attendance_rate}%
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      {student.assignments_completed}%
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      {student.test_scores_avg}%
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={student.days_absent_last_term > 10 ? 'text-red-600 font-medium' : ''}>
                        {student.days_absent_last_term}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {student.risk_category ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadge(student.risk_category)}`}>
                          {student.risk_category} ({Math.round(student.risk_score || 0)}%)
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => predictStudent(student.id)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Predict
                      </button>
                      <button
                        onClick={() => router.push(`/admin/students/${student.id}`)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalStudents > 0 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">
            Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalStudents)} of {totalStudents}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}