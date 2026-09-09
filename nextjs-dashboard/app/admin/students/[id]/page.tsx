// nextjs-dashboard/app/admin/students/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, Mail, Calendar, Activity, TrendingUp, Clock, BarChart3 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id;

  const [student, setStudent] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (studentId) {
      fetchStudentData(token);
      fetchPredictionHistory(token);
    }
  }, [studentId]);

  const fetchStudentData = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStudent(data);
      } else {
        setError(data.detail || 'Student not found');
      }
    } catch (err) {
      setError('Failed to fetch student');
    }
  };

  const fetchPredictionHistory = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}/predictions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPredictions(data.predictions || []);
      }
    } catch (err) {
      console.error('Failed to fetch predictions', err);
    }
    setLoading(false);
  };

  const runPrediction = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}/predict`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchStudentData(token);
        fetchPredictionHistory(token);
      }
    } catch (err) {
      console.error('Prediction failed', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getRiskColor = (category: string) => {
    const colors: Record<string, string> = {
      'High': 'text-red-600',
      'Medium': 'text-amber-600',
      'Low': 'text-emerald-600',
    };
    return colors[category] || 'text-gray-600';
  };

  const getRiskBg = (category: string) => {
    const colors: Record<string, string> = {
      'High': 'bg-red-50 border-red-200',
      'Medium': 'bg-amber-50 border-amber-200',
      'Low': 'bg-emerald-50 border-emerald-200',
    };
    return colors[category] || 'bg-gray-50 border-gray-200';
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

  if (error || !student) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        {error || 'Student not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/students')}
            className="p-2 hover:bg-gray-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {student.email}
            </p>
          </div>
        </div>
        <button
          onClick={runPrediction}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition shadow-sm flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Predict Risk
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-sm text-gray-500">Age</p>
          <p className="text-xl font-bold text-gray-900">{student.age}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-sm text-gray-500">Gender</p>
          <p className="text-xl font-bold text-gray-900">{student.gender === 0 ? 'Female' : 'Male'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-sm text-gray-500">Grade</p>
          <p className="text-xl font-bold text-gray-900">{student.grade_level || 'N/A'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-sm text-gray-500">Risk Score</p>
          <p className={`text-xl font-bold ${student.risk_score ? getRiskColor(student.risk_category) : 'text-gray-400'}`}>
            {student.risk_score ? `${Math.round(student.risk_score)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Risk Card */}
      {student.risk_category && (
        <div className={`rounded-2xl border p-6 ${getRiskBg(student.risk_category)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Category</p>
              <p className={`text-2xl font-bold ${getRiskColor(student.risk_category)}`}>
                {student.risk_category}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Risk Score</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(student.risk_score)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Feature Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Academic Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400">Attendance Rate</p>
            <p className="font-semibold text-gray-900">{student.attendance_rate}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Assignments</p>
            <p className="font-semibold text-gray-900">{student.assignments_completed}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Test Scores</p>
            <p className="font-semibold text-gray-900">{student.test_scores_avg}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Previous Grade</p>
            <p className="font-semibold text-gray-900">{student.previous_grade}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Days Absent</p>
            <p className="font-semibold text-gray-900">{student.days_absent_last_term}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Late Arrivals</p>
            <p className="font-semibold text-gray-900">{student.late_arrivals}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Disciplinary Incidents</p>
            <p className="font-semibold text-gray-900">{student.disciplinary_incidents}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Parent Education</p>
            <p className="font-semibold text-gray-900">{student.parent_education_level}/5</p>
          </div>
        </div>
      </div>

      {/* Prediction History */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Prediction History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {predictions.map((pred: any) => (
                  <tr key={pred.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3 text-sm text-gray-500">{formatDate(pred.created_at)}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{Math.round(pred.risk_score)}%</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getRiskBadge(pred.risk_category)}`}>
                        {pred.risk_category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}