// nextjs-dashboard/app/page.tsx
'use client';

import { useState, useEffect } from 'react';

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
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('predict'); // 'predict' | 'history'

  // Load history from localStorage on login
  useEffect(() => {
    if (loggedIn) {
      const saved = localStorage.getItem('predictionHistory');
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          setHistory([]);
        }
      }
    }
  }, [loggedIn]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (loggedIn && history.length > 0) {
      localStorage.setItem('predictionHistory', JSON.stringify(history));
    }
  }, [history, loggedIn]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
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
      const response = await fetch('http://localhost:3001/api/predict', {
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
        
        // Add to history with timestamp and student data
        const historyEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          student: { ...formData },
          prediction: data,
        };
        setHistory([historyEntry, ...history]);
        
        // Switch to history tab to show results
        setActiveTab('history');
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

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('predictionHistory');
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">🎓 Dropout Prediction Dashboard</h1>
          <div className="flex gap-3">
            <span className="text-sm text-gray-500 self-center">
              {history.length} predictions saved
            </span>
            <button
              onClick={() => { setLoggedIn(false); setToken(null); setResult(null); }}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('predict')}
            className={`px-4 py-2 rounded-md transition ${
              activeTab === 'predict' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔮 New Prediction
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md transition ${
              activeTab === 'history' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📊 History ({history.length})
          </button>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 rounded-md transition bg-red-100 text-red-600 hover:bg-red-200"
            >
              🗑️ Clear All
            </button>
          )}
        </div>

        {/* Prediction Tab */}
        {activeTab === 'predict' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Student Data</h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
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
                  <h2 className="text-xl font-semibold mb-4">📊 Latest Prediction</h2>
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
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">📊 Prediction History ({history.length})</h2>
            
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>No predictions made yet.</p>
                <p className="text-sm">Go to the "New Prediction" tab to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Attendance</th>
                      <th className="px-4 py-2 text-left">Assignments</th>
                      <th className="px-4 py-2 text-left">Risk Score</th>
                      <th className="px-4 py-2 text-left">Category</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry, index) => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{index + 1}</td>
                        <td className="px-4 py-2 text-xs">{formatDate(entry.timestamp)}</td>
                        <td className="px-4 py-2">{entry.student.attendance_rate}%</td>
                        <td className="px-4 py-2">{entry.student.assignments_completed}%</td>
                        <td className="px-4 py-2 font-bold">{entry.prediction.risk_score}%</td>
                        <td className={`px-4 py-2 ${getRiskColor(entry.prediction.risk_category)}`}>
                          {entry.prediction.risk_category}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => {
                              setResult(entry.prediction);
                              setFormData(entry.student);
                              setActiveTab('predict');
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}