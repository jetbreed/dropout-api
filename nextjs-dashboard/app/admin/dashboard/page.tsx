// nextjs-dashboard/app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Color palette
const COLORS = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

// API Base URL - change this based on environment
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : 'http://express-gateway:3001';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [riskFactors, setRiskFactors] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    fetchDashboardData(storedToken);
  }, []);

  const fetchDashboardData = async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch dashboard stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/analytics/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const statsData = await statsResponse.json();
      if (statsResponse.ok) {
        setStats(statsData);
      } else {
        setError(statsData.detail || 'Failed to fetch stats');
      }

      // Fetch risk trend
      const trendResponse = await fetch(`${API_BASE_URL}/api/analytics/risk-trend?days=30`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const trendData = await trendResponse.json();
      if (trendResponse.ok) {
        setTrendData(trendData);
      }

      // Fetch top risk factors
      const factorsResponse = await fetch(`${API_BASE_URL}/api/analytics/top-risk-factors`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const factorsData = await factorsResponse.json();
      if (factorsResponse.ok) {
        setRiskFactors(factorsData);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch dashboard data. Please check if the server is running.');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-2 text-red-600">Make sure FastAPI and Express Gateway are running.</p>
          <button 
            onClick={() => {
              const token = localStorage.getItem('access_token');
              if (token) fetchDashboardData(token);
            }}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const riskDistributionData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      data: [
        stats?.risk_distribution?.Low || 0,
        stats?.risk_distribution?.Medium || 0,
        stats?.risk_distribution?.High || 0
      ],
      backgroundColor: [COLORS.low, COLORS.medium, COLORS.high],
      borderWidth: 2,
      borderColor: '#fff',
    }]
  };

  const riskTrendChartData = {
    labels: trendData?.labels || [],
    datasets: [
      {
        label: 'Average Risk Score',
        data: trendData?.avg_risk || [],
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: COLORS.primary,
      },
      {
        label: 'Predictions Count',
        data: trendData?.counts || [],
        borderColor: COLORS.secondary,
        backgroundColor: COLORS.secondary + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: COLORS.secondary,
        yAxisID: 'y1',
      }
    ]
  };

  const riskFactorsData = {
    labels: riskFactors?.map((f: any) => f.feature.replace(/_/g, ' ')) || [],
    datasets: [{
      label: 'Impact Score',
      data: riskFactors?.map((f: any) => f.avg_impact) || [],
      backgroundColor: COLORS.primary,
      borderRadius: 4,
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📊 Admin Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold">{stats?.total_students || 0}</p>
              </div>
              <div className="text-3xl">👨‍🎓</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Predictions</p>
                <p className="text-2xl font-bold">{stats?.total_predictions || 0}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Risk Score</p>
                <p className="text-2xl font-bold">{stats?.average_risk_score || 0}%</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recent Predictions</p>
                <p className="text-2xl font-bold">{stats?.recent_predictions || 0}</p>
              </div>
              <div className="text-3xl">🔄</div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Risk Distribution</h2>
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={riskDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Top Risk Factors</h2>
            <div className="h-64">
              <Bar
                data={riskFactorsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: {
                    legend: {
                      display: false,
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Risk Trend */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Risk Trend (30 Days)</h2>
            <div className="h-72">
              <Line
                data={riskTrendChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Risk Score (%)'
                      }
                    },
                    y1: {
                      position: 'right',
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Count'
                      },
                      grid: {
                        drawOnChartArea: false,
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        {stats?.grade_distribution && stats.grade_distribution.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Students by Grade Level</h2>
            <div className="h-64">
              <Bar
                data={{
                  labels: stats.grade_distribution.map((g: any) => `Grade ${g.grade}`),
                  datasets: [{
                    label: 'Number of Students',
                    data: stats.grade_distribution.map((g: any) => g.count),
                    backgroundColor: COLORS.primary,
                    borderRadius: 4,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}