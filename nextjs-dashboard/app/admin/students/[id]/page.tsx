// nextjs-dashboard/app/admin/students/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  FileText,
  TrendingUp,
  BarChart3,
  Award,
  Calendar,
  Clock,
  AlertOctagon,
  Shield,
  Home,
  Activity,
  Users,
  GraduationCap,
  User,              // ✅ ADD THIS
} from 'lucide-react';

import { API_BASE_URL } from '@/lib/api';

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
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
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
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/predictions`, {
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
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/predict`, {
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

  // Feature sections with all fields
  const academicFeatures = [
    { label: 'Attendance Rate', value: `${student.attendance_rate}%`, icon: TrendingUp },
    { label: 'Assignments Completed', value: `${student.assignments_completed}%`, icon: FileText },
    { label: 'Test Scores', value: `${student.test_scores_avg}%`, icon: BarChart3 },
    { label: 'Previous Grade', value: `${student.previous_grade}%`, icon: Award },
  ];

  const behavioralFeatures = [
    { label: 'Days Absent', value: student.days_absent_last_term, icon: Calendar },
    { label: 'Late Arrivals', value: student.late_arrivals, icon: Clock },
    { label: 'Disciplinary Incidents', value: student.disciplinary_incidents, icon: AlertOctagon },
  ];

  const demographicFeatures = [
    { label: 'Age', value: student.age, icon: Users },
    { label: 'Gender', value: student.gender === 0 ? 'Female' : 'Male', icon: User },
    { label: 'Grade Level', value: student.grade_level || 'N/A', icon: GraduationCap },
    { label: 'Parent Education', value: `${student.parent_education_level}/5`, icon: Shield },
    { label: 'Family Income', value: `${student.family_income_level}/5`, icon: Home },
    { label: 'Internet Access', value: student.has_internet_access === 1 ? '✅ Yes' : '❌ No', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Back, Title, Edit, and Predict buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/students')}
            className="p-2 hover:bg-gray-100 rounded-xl transition"
            title="Back to Students List"
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

        {/* Edit and Predict buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/students/${studentId}/edit`)}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Edit
          </button>
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-400">Age</p>
          <p className="text-lg font-bold text-gray-900">{student.age}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-400">Gender</p>
          <p className="text-lg font-bold text-gray-900">{student.gender === 0 ? 'Female' : 'Male'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-400">Grade</p>
          <p className="text-lg font-bold text-gray-900">{student.grade_level || 'N/A'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-400">Parent Ed.</p>
          <p className="text-lg font-bold text-gray-900">{student.parent_education_level}/5</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-400">Late Arrivals</p>
          <p className="text-lg font-bold text-gray-900">{student.late_arrivals}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-400">Disciplinary</p>
          <p className={`text-lg font-bold ${student.disciplinary_incidents > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {student.disciplinary_incidents}
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

      {/* Academic Features */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">📚 Academic Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {academicFeatures.map((feature, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">{feature.label}</p>
              <div className="flex items-center gap-2">
                <feature.icon className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-lg font-bold text-gray-900">{feature.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Behavioral Features */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">⚠️ Behavioral Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {behavioralFeatures.map((feature, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">{feature.label}</p>
              <div className="flex items-center gap-2">
                <feature.icon className="w-3.5 h-3.5 text-gray-400" />
                <p className={`text-lg font-bold ${(feature.label === 'Disciplinary Incidents' && feature.value > 0) || (feature.label === 'Days Absent' && feature.value > 10) ? 'text-red-600' : 'text-gray-900'}`}>
                  {feature.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demographic Features */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">👤 Demographic Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {demographicFeatures.map((feature, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">{feature.label}</p>
              <div className="flex items-center gap-2">
                <feature.icon className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-lg font-bold text-gray-900">{feature.value}</p>
              </div>
            </div>
          ))}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Factors</th>
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
                    <td className="px-6 py-3">
                      {pred.top_factors && pred.top_factors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {pred.top_factors.map((factor: any, fi: number) => (
                            <span key={fi} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                              {factor.feature.replace(/_/g, ' ')}: {factor.value}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
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