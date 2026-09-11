// nextjs-dashboard/app/admin/students/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  X, 
  User, 
  Mail, 
  Shield, 
  Home, 
  AlertOctagon, 
  Clock,
  FileText
} from 'lucide-react';

import { apiCall } from '@/lib/api';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    age: 15,
    gender: 1,
    grade_level: '',
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

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchStudentData(token);
  }, [studentId]);

  const fetchStudentData = async (token: string) => {
    try {
      const response = await apiCall(`/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          age: data.age || 15,
          gender: data.gender || 1,
          grade_level: data.grade_level || '',
          previous_grade: data.previous_grade || 65,
          attendance_rate: data.attendance_rate || 78,
          assignments_completed: data.assignments_completed || 70,
          test_scores_avg: data.test_scores_avg || 62,
          days_absent_last_term: data.days_absent_last_term || 12,
          late_arrivals: data.late_arrivals || 8,
          disciplinary_incidents: data.disciplinary_incidents || 2,
          parent_education_level: data.parent_education_level || 2,
          family_income_level: data.family_income_level || 2,
          has_internet_access: data.has_internet_access || 0,
        });
      } else {
        setError(data.detail || 'Failed to fetch student');
      }
    } catch (err) {
      setError('Failed to fetch student');
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await apiCall(`/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/students');
        }, 1500);
      } else {
        let errorMsg = 'Failed to update student';
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
          }
        }
        setError(errorMsg);
      }
    } catch (err) {
      setError('Failed to update student');
    }
    setSaving(false);
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none bg-white/50";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/admin/students')}
          className="p-2 hover:bg-gray-100 rounded-xl transition"
          title="Back to Students List"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update student information and academic records</p>
        </div>
        <button
          onClick={() => router.push(`/admin/students/${studentId}`)}
          className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-sm flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          View Profile
        </button>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <Save className="w-5 h-5" />
          Student updated successfully! Redirecting...
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        {/* Personal Information */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">👤 Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={inputClass} required />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} required />
            </div>
          </div>
        </div>

        {/* Demographic Features */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">📊 Demographic Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} min="5" max="25" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                <option value={0}>Female</option>
                <option value={1}>Male</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Grade Level</label>
              <input type="number" name="grade_level" value={formData.grade_level} onChange={handleChange} min="1" max="12" className={inputClass} placeholder="e.g., 9" />
            </div>
          </div>
        </div>

        {/* Academic Features */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">📚 Academic Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Previous Grade (%)</label>
              <input type="number" name="previous_grade" value={formData.previous_grade} onChange={handleChange} min="0" max="100" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Attendance Rate (%)</label>
              <input type="number" name="attendance_rate" value={formData.attendance_rate} onChange={handleChange} min="0" max="100" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Assignments (%)</label>
              <input type="number" name="assignments_completed" value={formData.assignments_completed} onChange={handleChange} min="0" max="100" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Test Scores (%)</label>
              <input type="number" name="test_scores_avg" value={formData.test_scores_avg} onChange={handleChange} min="0" max="100" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Behavioral Features */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">⚠️ Behavioral Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Days Absent</label>
              <input type="number" name="days_absent_last_term" value={formData.days_absent_last_term} onChange={handleChange} min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Late Arrivals</label>
              <input type="number" name="late_arrivals" value={formData.late_arrivals} onChange={handleChange} min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Disciplinary Incidents</label>
              <input type="number" name="disciplinary_incidents" value={formData.disciplinary_incidents} onChange={handleChange} min="0" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Socioeconomic Features */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">🏠 Socioeconomic Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Parent Education Level</label>
              <select name="parent_education_level" value={formData.parent_education_level} onChange={handleChange} className={inputClass}>
                <option value={1}>1 - None</option>
                <option value={2}>2 - Primary</option>
                <option value={3}>3 - Secondary</option>
                <option value={4}>4 - Diploma</option>
                <option value={5}>5 - Degree</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Family Income Level</label>
              <select name="family_income_level" value={formData.family_income_level} onChange={handleChange} className={inputClass}>
                <option value={1}>1 - Very Low</option>
                <option value={2}>2 - Low</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Very High</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Internet Access</label>
              <select name="has_internet_access" value={formData.has_internet_access} onChange={handleChange} className={inputClass}>
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
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