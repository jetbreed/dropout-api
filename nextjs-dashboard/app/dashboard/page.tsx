// nextjs-dashboard/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Clock,
  BookOpen,
  LogOut,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Sparkles,
} from 'lucide-react';

import { API_BASE_URL } from '@/lib/api';

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

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
        if (userData.role === 'admin') {
          router.push('/admin/dashboard');
          return;
        }
      } catch (e) {}
    }

    fetchStudentData(token);
  }, []);

  const fetchStudentData = async (token: string) => {
    setLoading(true);
    try {
      // Get user info first
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userResponse.json();
      
      if (!userResponse.ok) {
        setError('Failed to get user info');
        setLoading(false);
        return;
      }

      console.log('User data:', userData);

      // Try to fetch student by user_id
      const response = await fetch(`${API_BASE_URL}/api/students/?page=1&page_size=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      console.log('Student data:', data);
      
      if (response.ok && data.students && data.students.length > 0) {
        const studentData = data.students[0];
        setStudent(studentData);
        
        // Fetch predictions
        const predResponse = await fetch(`${API_BASE_URL}/api/students/${studentData.id}/predictions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const predData = await predResponse.json();
        if (predResponse.ok) {
          setPredictions(predData.predictions || []);
          if (predData.predictions && predData.predictions.length > 0) {
            setLatestPrediction(predData.predictions[0]);
          }
        }
      } else {
        setStudent(null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch your data');
    }
    setLoading(false);
  };

  const runPrediction = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !student?.id) return;

    setPredicting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${student.id}/predict`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchStudentData(token);
      }
    } catch (err) {
      console.error('Prediction failed', err);
    }
    setPredicting(false);
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

  const getRiskIcon = (category: string) => {
    const icons: Record<string, any> = {
      'High': <XCircle className="w-8 h-8 text-red-500" />,
      'Medium': <AlertTriangle className="w-8 h-8 text-amber-500" />,
      'Low': <CheckCircle className="w-8 h-8 text-emerald-500" />,
    };
    return icons[category] || <Info className="w-8 h-8 text-gray-400" />;
  };

  const getRiskEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      'High': '🔴',
      'Medium': '🟡',
      'Low': '🟢',
    };
    return emojis[category] || '⚪';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-primary-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center max-w-md">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Welcome, {user?.username || 'Student'}! 👋</h2>
          <p className="text-gray-500 mt-2">
            Your student profile hasn't been set up yet. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 rounded-2xl p-2.5 shadow-lg shadow-primary-200">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-sm text-gray-500">View your academic risk profile</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              router.push('/login');
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-200">
                {getInitials(student.first_name, student.last_name)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {student.first_name} {student.last_name}
                </h2>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {student.email}
                </p>
              </div>
            </div>
            <button
              onClick={runPrediction}
              disabled={predicting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition shadow-sm disabled:opacity-50"
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

        {/* Latest Prediction */}
        <div className="mb-6">
          {latestPrediction ? (
            <div className={`rounded-3xl border-2 p-6 animate-fade-in ${getRiskBg(latestPrediction.risk_category)}`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getRiskIcon(latestPrediction.risk_category)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Your Current Risk Status</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-2xl font-bold ${getRiskColor(latestPrediction.risk_category)}`}>
                          {getRiskEmoji(latestPrediction.risk_category)} {latestPrediction.risk_category} Risk
                        </span>
                        <span className="text-sm text-gray-500">
                          Score: <span className="font-bold text-gray-900">{Math.round(latestPrediction.risk_score)}%</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatDate(latestPrediction.created_at)}
                    </div>
                  </div>

                  {latestPrediction.top_factors && latestPrediction.top_factors.length > 0 && (
                    <div className="mt-4 p-4 bg-white/60 rounded-xl border border-white/80">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">🔍 Top Contributing Factors</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {latestPrediction.top_factors.map((factor: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm">
                            <span className="text-sm text-gray-600 capitalize">{factor.feature.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-medium text-gray-900">{factor.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestPrediction.interventions && latestPrediction.interventions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">💡 Recommended Actions</p>
                      <div className="flex flex-wrap gap-2">
                        {latestPrediction.interventions.map((inv: any, idx: number) => (
                          <span key={idx} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${inv.priority === 'High' ? 'bg-red-100 text-red-700' : inv.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {inv.priority === 'High' && <AlertTriangle className="w-3 h-3" />}
                            {inv.priority === 'Medium' && <Info className="w-3 h-3" />}
                            {inv.priority === 'Low' && <CheckCircle className="w-3 h-3" />}
                            {inv.action}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-3xl border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">No Prediction Yet</h3>
              <p className="text-gray-500 text-sm mt-1">Click the <strong>"Predict Risk"</strong> button above to get your first prediction.</p>
            </div>
          )}
        </div>

        {/* Quick Stats - Safe with null handling */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400">Attendance</p>
            <p className={`text-lg font-bold ${(student.attendance_rate || 0) < 60 ? 'text-red-600' : 'text-gray-900'}`}>
              {student.attendance_rate !== null && student.attendance_rate !== undefined ? `${student.attendance_rate}%` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400">Assignments</p>
            <p className="text-lg font-bold text-gray-900">
              {student.assignments_completed !== null && student.assignments_completed !== undefined ? `${student.assignments_completed}%` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400">Test Scores</p>
            <p className="text-lg font-bold text-gray-900">
              {student.test_scores_avg !== null && student.test_scores_avg !== undefined ? `${student.test_scores_avg}%` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400">Absences</p>
            <p className={`text-lg font-bold ${(student.days_absent_last_term || 0) > 10 ? 'text-red-600' : 'text-gray-900'}`}>
              {student.days_absent_last_term !== null && student.days_absent_last_term !== undefined ? student.days_absent_last_term : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400">Late Arrivals</p>
            <p className={`text-lg font-bold ${(student.late_arrivals || 0) > 5 ? 'text-amber-600' : 'text-gray-900'}`}>
              {student.late_arrivals !== null && student.late_arrivals !== undefined ? student.late_arrivals : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400">Disciplinary</p>
            <p className={`text-lg font-bold ${(student.disciplinary_incidents || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {student.disciplinary_incidents !== null && student.disciplinary_incidents !== undefined ? student.disciplinary_incidents : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400">Parent Education</p>
            <p className="text-lg font-bold text-gray-900">
              {student.parent_education_level !== null && student.parent_education_level !== undefined ? `${student.parent_education_level}/5` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400">Family Income</p>
            <p className="text-lg font-bold text-gray-900">
              {student.family_income_level !== null && student.family_income_level !== undefined ? `${student.family_income_level}/5` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400">Internet Access</p>
            <p className="text-lg font-bold text-gray-900">
              {student.has_internet_access === 1 ? '✅ Yes' : student.has_internet_access === 0 ? '❌ No' : '—'}
            </p>
          </div>
        </div>

        {/* Prediction History */}
        {predictions.length > 1 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">📊 Prediction History</h3>
              <span className="text-xs text-gray-400">{predictions.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {predictions.map((pred: any, index: number) => (
                    <tr key={pred.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-3 text-sm text-gray-400">{index + 1}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{formatDate(pred.created_at)}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{Math.round(pred.risk_score)}%</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getRiskBg(pred.risk_category)}`}>
                          {getRiskEmoji(pred.risk_category)} {pred.risk_category}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {index === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Latest
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Previous</span>
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
    </div>
  );
}