// nextjs-dashboard/app/page.tsx
'use client';

import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
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

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        setLoggedIn(true);
        setError(null);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed: ' + err.message);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Prediction failed');
      }
    } catch (err) {
      setError('Prediction failed: ' + err.message);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const getRiskColor = (category) => {
    if (category === 'High') return 'text-red-600 font-bold';
    if (category === 'Medium') return 'text-yellow-600 font-bold';
    return 'text-green-600 font-bold';
  };

  const getRiskBg = (category) => {
    if (category === 'High') return 'bg-red-100 border-red-400';
    if (category === 'Medium') return 'bg-yellow-100 border-yellow-400';
    return 'bg-green-100 border-green-400';
  };

  // Login Screen
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200">
          <h1 className="text-2xl font-bold mb-2 text-center text-blue-600">🎓 Dropout Prediction</h1>
          <p className="text-gray-600 mb-6 text-center">Login to access the dashboard</p>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login (Admin)'}
          </button>
          {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}
          <p className="mt-4 text-gray-400 text-xs text-center">Default: admin / admin123</p>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">🎓 Dropout Prediction Dashboard</h1>
          <button
            onClick={() => { setLoggedIn(false); setToken(null); setResult(null); }}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Student Data</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender (0=Female, 1=Male)</label>
                  <input
                    type="number"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Previous Grade (%)</label>
                  <input
                    type="number"
                    name="previous_grade"
                    value={formData.previous_grade}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attendance Rate (%)</label>
                  <input
                    type="number"
                    name="attendance_rate"
                    value={formData.attendance_rate}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assignments Completed (%)</label>
                  <input
                    type="number"
                    name="assignments_completed"
                    value={formData.assignments_completed}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Test Score Average (%)</label>
                  <input
                    type="number"
                    name="test_scores_avg"
                    value={formData.test_scores_avg}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Days Absent (Last Term)</label>
                  <input
                    type="number"
                    name="days_absent_last_term"
                    value={formData.days_absent_last_term}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Predicting...' : '🎯 Predict Risk'}
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          <div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                ❌ {error}
              </div>
            )}

            {result && (
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">📊 Prediction Result</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Risk Score:</span>
                    <span className="text-3xl font-bold">{result.risk_score}%</span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded border ${getRiskBg(result.risk_category)}`}>
                    <span className="font-medium">Risk Category:</span>
                    <span className={`text-2xl ${getRiskColor(result.risk_category)}`}>
                      {result.risk_category}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">🔍 Top Contributing Factors:</h3>
                    {result.top_factors && result.top_factors.map((factor, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700">{factor.feature}: <span className="font-medium">{factor.value}</span></span>
                        <span className="text-blue-600 font-medium">Impact: {factor.impact}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">💡 Recommended Interventions:</h3>
                    {result.interventions && result.interventions.map((inv, idx) => (
                      <div key={idx} className={`p-3 rounded mb-2 ${inv.priority === 'High' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                        <p className="font-medium">{inv.action}</p>
                        <p className="text-sm text-gray-600">Priority: <span className={inv.priority === 'High' ? 'text-red-600 font-medium' : 'text-blue-600'}>{inv.priority}</span></p>
                        <p className="text-sm text-gray-600">{inv.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}