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
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
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

      const data = await response.json();

      if (response.ok) {
        router.push('/admin/students');
      } else {
        // Extract error message properly
        let errorMsg = 'Failed to create student';
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
          } else if (typeof data.detail === 'object') {
            errorMsg = JSON.stringify(data.detail);
          }
        } else if (data.error) {
          errorMsg = data.error;
        }
        setError(errorMsg);
      }
    } catch (err) {
      setError('Failed to create student');
    }
    setLoading(false);
  };

  const getErrorMessage = (field: string) => {
    // Validate fields before submission
    if (formData.has_internet_access < 0 || formData.has_internet_access > 1) {
      return 'Internet access must be 0 (No) or 1 (Yes)';
    }
    if (formData.age < 5 || formData.age > 25) {
      return 'Age must be between 5 and 25';
    }
    if (formData.gender < 0 || formData.gender > 1) {
      return 'Gender must be 0 (Female) or 1 (Male)';
    }
    return null;
  };

  const validationError = getErrorMessage('');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/admin/students')}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">➕ Add Student</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {validationError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
          ⚠️ {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
              required
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
              required
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            required
            placeholder="student@school.com"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="5"
              max="25"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <input
              type="number"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              min="0"
              max="1"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">0=Female, 1=Male</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internet Access</label>
            <input
              type="number"
              name="has_internet_access"
              value={formData.has_internet_access}
              onChange={handleChange}
              min="0"
              max="1"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">0=No, 1=Yes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Rate (%)</label>
            <input
              type="number"
              name="attendance_rate"
              value={formData.attendance_rate}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignments Completed (%)</label>
            <input
              type="number"
              name="assignments_completed"
              value={formData.assignments_completed}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Score Average (%)</label>
            <input
              type="number"
              name="test_scores_avg"
              value={formData.test_scores_avg}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Previous Grade (%)</label>
            <input
              type="number"
              name="previous_grade"
              value={formData.previous_grade}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days Absent</label>
            <input
              type="number"
              name="days_absent_last_term"
              value={formData.days_absent_last_term}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Late Arrivals</label>
            <input
              type="number"
              name="late_arrivals"
              value={formData.late_arrivals}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disciplinary Incidents</label>
            <input
              type="number"
              name="disciplinary_incidents"
              value={formData.disciplinary_incidents}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Education Level <span className="text-gray-400 text-xs">(1-5)</span>
            </label>
            <input
              type="number"
              name="parent_education_level"
              value={formData.parent_education_level}
              onChange={handleChange}
              min="1"
              max="5"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Family Income Level <span className="text-gray-400 text-xs">(1-5)</span>
            </label>
            <input
              type="number"
              name="family_income_level"
              value={formData.family_income_level}
              onChange={handleChange}
              min="1"
              max="5"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading || !!validationError}
            className="flex-1 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 font-medium shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : 'Create Student'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/students')}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}