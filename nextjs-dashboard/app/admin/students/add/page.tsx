// nextjs-dashboard/app/admin/students/add/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:3001';

export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    age: 15,
    gender: 1,
    previous_grade: 65,
    attendance_rate: 78,
    assignments_completed: 70,
    test_scores_avg: 62,
    days_absent_last_term: 12,
    late_arrivals: 8,
    disciplinary_incidents: 2,
    parent_education_level: 2,
    family_income_level: 2,
    has_internet_access: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/students');
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to create student');
      }
    } catch (err) {
      setError('Failed to create student');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">➕ Add Student</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender (0=F, 1=M)</label>
            <input
              type="number"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Rate (%)</label>
            <input
              type="number"
              name="attendance_rate"
              value={formData.attendance_rate}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignments Completed (%)</label>
            <input
              type="number"
              name="assignments_completed"
              value={formData.assignments_completed}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Test Score Average (%)</label>
          <input
            type="number"
            name="test_scores_avg"
            value={formData.test_scores_avg}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days Absent</label>
            <input
              type="number"
              name="days_absent_last_term"
              value={formData.days_absent_last_term}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Late Arrivals</label>
            <input
              type="number"
              name="late_arrivals"
              value={formData.late_arrivals}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disciplinary Incidents</label>
            <input
              type="number"
              name="disciplinary_incidents"
              value={formData.disciplinary_incidents}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internet Access (0=No, 1=Yes)</label>
            <input
              type="number"
              name="has_internet_access"
              value={formData.has_internet_access}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Student'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/students')}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}