'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        ❌ {error || 'Student not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-gray-600">{student.email}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runPrediction}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            🎯 Predict Risk
          </button>
          <button
            onClick={() => router.push('/admin/students')}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Student Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Age</p>
          <p className="text-lg font-semibold">{student.age}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Gender</p>
          <p className="text-lg font-semibold">{student.gender === 0 ? 'Female' : 'Male'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Grade Level</p>
          <p className="text-lg font-semibold">{student.grade_level || 'N/A'}</p>
        </div>
      </div>

      {/* Risk Score Card */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">📊 Current Risk Assessment</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold">
              {student.risk_score ? Math.round(student.risk_score) : '—'}%
            </p>
            <p className="text-sm text-gray-500">Risk Score</p>
          </div>
          <div>
            {student.risk_category ? (
              <span className={`px-4 py-2 rounded-lg text-white font-bold text-lg ${
                student.risk_category === 'High' ? 'bg-red-500' :
                student.risk_category === 'Medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}>
                {student.risk_category}
              </span>
            ) : (
              <span className="text-gray-400">Not predicted yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Academic Features */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">📚 Academic Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Previous Grade</p>
            <p className="font-medium">{student.previous_grade}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Attendance Rate</p>
            <p className={`font-medium ${student.attendance_rate < 60 ? 'text-red-600' : ''}`}>
              {student.attendance_rate}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Assignments Completed</p>
            <p className={`font-medium ${student.assignments_completed < 60 ? 'text-red-600' : ''}`}>
              {student.assignments_completed}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Test Score Average</p>
            <p className={`font-medium ${student.test_scores_avg < 60 ? 'text-red-600' : ''}`}>
              {student.test_scores_avg}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Days Absent</p>
            <p className={`font-medium ${student.days_absent_last_term > 10 ? 'text-red-600' : ''}`}>
              {student.days_absent_last_term}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Late Arrivals</p>
            <p className="font-medium">{student.late_arrivals}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Disciplinary Incidents</p>
            <p className={`font-medium ${student.disciplinary_incidents > 0 ? 'text-red-600' : ''}`}>
              {student.disciplinary_incidents}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Parent Education Level</p>
            <p className="font-medium">{student.parent_education_level}/5</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Family Income Level</p>
            <p className="font-medium">{student.family_income_level}/5</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Internet Access</p>
            <p className="font-medium">{student.has_internet_access === 1 ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>
      </div>

      {/* Prediction History */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">📊 Prediction History</h2>
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
                    <td className="px-6 py-4 text-sm">{formatDate(pred.created_at)}</td>
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
                    <td className="px-6 py-4">
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
  );
}