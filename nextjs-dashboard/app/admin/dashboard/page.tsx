// nextjs-dashboard/app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isAuthenticated, logout } from '@/lib/session';
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
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  BarChart3,
  ChevronRight,
  Zap,
  Shield,
  BookOpen,
  Home
} from 'lucide-react';

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

const API_BASE_URL = 'http://localhost:3001';

const COLORS = {
  primary: '#4F46E5',
  secondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
};

const StatCard = ({ icon: Icon, label, value, change, color, subtitle }: any) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-50`}>
        <Icon className={`w-6 h-6 text-${color}-500`} />
      </div>
    </div>
    {change !== undefined && (
      <div className={`flex items-center gap-1 mt-3 text-sm ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
        {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        <span className="font-medium">{Math.abs(change)}%</span>
        <span className="text-gray-400 text-xs">vs last week</span>
      </div>
    )}
  </div>
);

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [riskFactors, setRiskFactors] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // const storedToken = localStorage.getItem('access_token');
    const storedToken = getToken();
    if (!storedToken || !isAuthenticated()) {
      logout('/login?session_expired=true');
      return;
    }
    
    const userStr = localStorage.getItem('user');
    
    if (!storedToken) {
      router.push('/login');
      return;
    }

    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        if (userData.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
      } catch (e) {}
    }
    
    fetchDashboardData(storedToken);
  }, []);

  const fetchDashboardData = async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, trendRes, factorsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/dashboard-stats`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/api/analytics/risk-trend?days=30`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/api/analytics/top-risk-factors`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      const statsData = await statsRes.json();
      const trendData = await trendRes.json();
      const factorsData = await factorsRes.json();

      if (statsRes.ok) setStats(statsData);
      if (trendRes.ok) setTrendData(trendData);
      if (factorsRes.ok) setRiskFactors(factorsData);
    } catch (err) {
      setError('Unable to connect to the server. Please check your connection.');
    }
    setLoading(false);
  };

  // Chart configurations
  const riskDistributionData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [{
      data: [
        stats?.risk_distribution?.Low || 0,
        stats?.risk_distribution?.Medium || 0,
        stats?.risk_distribution?.High || 0
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };

  const riskTrendChartData = {
    labels: trendData?.labels || [],
    datasets: [
      {
        label: 'Average Risk Score',
        data: trendData?.avg_risk || [],
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#4F46E5',
      },
      {
        label: 'Predictions',
        data: trendData?.counts || [],
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#7C3AED',
        yAxisID: 'y1',
      }
    ]
  };

  const riskFactorsData = {
    labels: riskFactors?.map((f: any) => f.feature.replace(/_/g, ' ')) || [],
    datasets: [{
      label: 'Impact',
      data: riskFactors?.map((f: any) => f.avg_impact) || [],
      backgroundColor: '#4F46E5',
      borderRadius: 8,
    }]
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-primary-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your dashboard...</p>
          <p className="text-sm text-gray-400 mt-1">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Connection Error</h3>
          <p className="text-gray-500 mt-2 text-sm">{error}</p>
          <button
            onClick={() => {
              const token = localStorage.getItem('access_token');
              if (token) fetchDashboardData(token);
            }}
            className="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Welcome Banner */}
      <div className="gradient-primary rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2LTRoNHY0aC00em0wIDB2LTRoNHY0aC00eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.username || 'Admin'}! 👋</h1>
            <p className="mt-1 text-primary-100 text-sm md:text-base">
              Here's what's happening with your students today
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <button 
              onClick={() => router.push('/admin/students/add')}
              className="px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 text-sm font-medium border border-white/20"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>
            <button 
              onClick={() => router.push('/admin/students')}
              className="px-5 py-2.5 bg-white text-primary-600 rounded-xl hover:bg-primary-50 transition-all flex items-center gap-2 text-sm font-medium"
            >
              View All Students
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats?.total_students || 0}
          change={12}
          color="primary"
          subtitle="Active students"
        />
        <StatCard
          icon={Activity}
          label="Total Predictions"
          value={stats?.total_predictions || 0}
          change={8}
          color="success"
          subtitle="All time"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Risk Score"
          value={`${stats?.average_risk_score || 0}%`}
          change={-3}
          color="warning"
          subtitle="Overall"
        />
        <StatCard
          icon={Clock}
          label="Recent Predictions"
          value={stats?.recent_predictions || 0}
          change={5}
          color="secondary"
          subtitle="Last 7 days"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Risk Distribution</h3>
              <p className="text-sm text-gray-500">Students by risk level</p>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Low
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Medium
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                High
              </span>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={riskDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>

        {/* Risk Factors */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Top Risk Factors</h3>
              <p className="text-sm text-gray-500">Most impactful features</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
              Impact Score
            </span>
          </div>
          <div className="h-64">
            <Bar
              data={riskFactorsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    beginAtZero: true,
                  },
                  y: {
                    grid: { display: false },
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Risk Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Risk Trend</h3>
              <p className="text-sm text-gray-500">30-day overview of risk scores</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-500"></span>
                Avg Risk Score
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-500"></span>
                Predictions
              </span>
            </div>
          </div>
          <div className="h-72">
            <Line
              data={riskTrendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    title: { display: true, text: 'Risk Score (%)', color: '#9CA3AF' }
                  },
                  y1: {
                    position: 'right',
                    beginAtZero: true,
                    grid: { display: false },
                    title: { display: true, text: 'Count', color: '#9CA3AF' }
                  }
                },
                interaction: {
                  intersect: false,
                  mode: 'index'
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}