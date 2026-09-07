// nextjs-dashboard/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:3001';

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setStudent(user);
        fetchStudentData(token, user.id);
      } catch (e) {
        setError('Failed to load user data');
      }
    }
  }, []);

  const fetchStudentData = async (token: string, userId: number) => {
    try {
      // Fetch student info
      const studentResponse = await fetch(`${API_BASE_URL}/api/students/?search=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const studentData = await studentResponse.json();
      if (studentResponse.ok && studentData.students?.length > 0) {
        const studentInfo = studentData.students[0];
        setStudent({ ...studentInfo, role: 'student' });
        // Fetch predictions for this student
        fetchPredictions(token, studentInfo.id);
      } else {
        // No student profile yet - show setup page
        setStudent({ ...JSON.parse(localStorage.getItem('user') || '{}'), role: 'student' });
      }
    } catch (err) {
      setError('Failed to fetch student data');
    }
    setLoading(false);
  };

  const fetchPredictions = async (token: string, studentId: number) => {
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
  };

  const runPrediction = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !student?.id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${student.id}/predict`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchPredictions(token, student.id);
        fetchStudentData(token, student.id);
      }
    } catch (err) {
      console.error('Prediction failed', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🎓 My Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              router.push('/login');
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Student Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              {student?.first_name?.[0]}{student?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{student?.first_name} {student?.last_name}</h2>
              <p className="text-gray-600">{student?.email}</p>
              <p className="text-sm text-gray-500">Role: {student?.role || 'Student'}</p>
            </div>
          </div>
        </div>

        {/* Risk Gauge */}
        {student?.risk_score !== undefined && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Current Risk Score</h3>
                <p className="text-3xl font-bold mt-2">
                  {Math.round(student.risk_score || 0)}%
                </p>
              </div>
              <div className={`px-4 py-2 rounded-lg text-white font-bold ${
                student.risk_category === 'High' ? 'bg-red-500' :
                student.risk_category === 'Medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}>
                {student.risk_category || 'Not Predicted'}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">Actions</h3>
          <div className="flex gap-4">
            <button
              onClick={runPrediction}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              🎯 Predict My Risk
            </button>
            <button
              onClick={() => router.push('/dashboard/features')}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition"
            >
              View My Features
            </button>
          </div>
        </div>

        {/* Prediction History */}
        {predictions.length > 0 && (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">📊 Prediction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Top Factors</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred: any) => (
                    <tr key={pred.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(pred.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold">{Math.round(pred.risk_score)}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pred.risk_category === 'High' ? 'bg-red-100 text-red-800' :
                          pred.risk_category === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {pred.risk_category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {pred.top_factors?.map((f: any, i: number) => (
                          <span key={i} className="inline-block bg-gray-100 rounded px-2 py-1 mr-1 text-xs">
                            {f.feature.replace(/_/g, ' ')}: {f.value}
                          </span>
                        ))}
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