// nextjs-dashboard/app/admin/students/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Activity, 
  TrendingUp, 
  Clock, 
  BarChart3,
  BookOpen,
  Award,
  Target,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id;

  const [student, setStudent] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);

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

    setPredicting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}/predict`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchStudentData(token);
        await fetchPredictionHistory(token);
      }
    } catch (err) {
      console.error('Prediction failed', err);
    }
    setPredicting(false);
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

  const getRiskBadge = (category: string) => {
    const styles: Record<string, string> = {
      'High': 'bg-red-100 text-red-700 border-red-200',
      'Medium': 'bg-amber-100 text-amber-700 border-amber-200',
      'Low': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return styles[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getRiskEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      'High': '🔴',
      'Medium': '🟡',
      'Low': '🟢',
    };
    return emojis[category] || '⚪';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-200">
              {getInitials(student.first_name, student.last_name)}
            </div>
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
        </div>
        <button
          onClick={runPrediction}
          disabled={predicting}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {predicting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Predicting...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Predict Risk
            </>
          )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400">Age</p>
          <p className="text-xl font-bold text-gray-900">{student.age}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400">Gender</p>
          <p className="text-xl font-bold text-gray-900">{student.gender === 0 ? 'Female' : 'Male'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400">Grade</p>
          <p className="text-xl font-bold text-gray-900">{student.grade_level || 'N/A'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400">Risk Score</p>
          <p className={`text-xl font-bold ${student.risk_score ? getRiskColor(student.risk_category) : 'text-gray-400'}`}>
            {student.risk_score ? `${Math.round(student.risk_score)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Risk Card */}
      {student.risk_category && (
        <div className={`rounded-2xl border-2 p-6 ${getRiskBg(student.risk_category)}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl">
                {getRiskEmoji(student.risk_category)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Risk Category</p>
                <p className={`text-2xl font-bold ${getRiskColor(student.risk_category)}`}>
                  {student.risk_category} Risk
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Risk Score</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(student.risk_score)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Predictions</p>
                <p className="text-2xl font-bold text-gray-900">{predictions.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">📚 Academic Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Attendance Rate</p>
            <p className="text-lg font-bold text-gray-900">{student.attendance_rate}%</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Assignments</p>
            <p className="text-lg font-bold text-gray-900">{student.assignments_completed}%</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Test Scores</p>
            <p className="text-lg font-bold text-gray-900">{student.test_scores_avg}%</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Previous Grade</p>
            <p className="text-lg font-bold text-gray-900">{student.previous_grade}%</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Days Absent</p>
            <p className="text-lg font-bold text-gray-900">{student.days_absent_last_term}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Late Arrivals</p>
            <p className="text-lg font-bold text-gray-900">{student.late_arrivals}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Disciplinary Incidents</p>
            <p className="text-lg font-bold text-gray-900">{student.disciplinary_incidents}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Parent Education</p>
            <p className="text-lg font-bold text-gray-900">{student.parent_education_level}/5</p>
          </div>
        </div>
      </div>

      {/* Prediction History */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">📊 Prediction History</h3>
            <span className="text-xs text-gray-400">{predictions.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {predictions.map((pred: any, index: number) => (
                  <tr key={pred.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{formatDate(pred.created_at)}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{Math.round(pred.risk_score)}%</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getRiskBadge(pred.risk_category)}`}>
                        {getRiskEmoji(pred.risk_category)} {pred.risk_category}
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