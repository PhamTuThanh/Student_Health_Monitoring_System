import React, { useEffect, useState } from 'react';
import { Users, Activity, UserCheck, TrendingUp } from 'lucide-react';
import axios from 'axios';

const DataAnalysis = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with mock data
    // setTimeout(() => {
    //   const mockStats = {
    //     total: 1250,
    //     daTDSK: 1100,
    //     male: 680,
    //     female: 570,
    //     bmiStats: {
    //       'Underweight': 125,
    //       'Normal': 750,
    //       'Overweight': 275,
    //       'Obese': 100
    //     }
    //   };
    //   setStats(mockStats);
    //   setLoading(false);
    // }, 1000);
    
    axios.get('http://localhost:9000/api/doctor/physical-fitness-status')
      .then(res => {
        console.log('API response:', res.data);
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('API error:', err);
        setLoading(false);
      });
  }, []);

  // Prepare chart data
  const bmiLabels = stats ? Object.keys(stats.bmiStats) : [];
  const bmiValues = stats ? Object.values(stats.bmiStats) : [];

  const barChartData = bmiLabels.map((label, index) => ({
    name: label,
    value: bmiValues[index],
    fill: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]
  }));

  const pieChartData = bmiLabels.map((label, index) => ({
    name: label,
    value: bmiValues[index],
    fill: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]
  }));

  const StatCard = ({ title, value, subtitle, icon: Icon, color, bgColor }) => (
    <div className={`${bgColor} rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-xl border border-gray-100`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color} mb-1`}>
            {loading ? (
              <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
            ) : (
              value?.toLocaleString() || '-'
            )}
          </p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const CustomBarChart = ({ data }) => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm font-medium text-gray-700">{item.name}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
                backgroundColor: item.fill
              }}
            />
          </div>
          <div className="w-12 text-sm font-semibold text-gray-600">{item.value}</div>
        </div>
      ))}
    </div>
  );

  const CustomPieChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="flex items-center justify-center space-x-8">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            {data.map((item, index) => {
              const percentage = item.value / total;
              const angle = percentage * 360;
              const prevAngles = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 360, 0);
              
              return (
                <circle
                  key={index}
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke={item.fill}
                  strokeWidth="20"
                  strokeDasharray={`${(angle / 360) * 502.65} 502.65`}
                  strokeDashoffset={`${-((prevAngles / 360) * 502.65)}`}
                  className="transition-all duration-1000 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.fill }}></div>
              <div className="text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-500 ml-2">({item.value})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Physical Fitness Analytics</h1>
          </div>
          <p className="text-gray-600">Monitor and analyze student health data with comprehensive insights</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters & Options</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <select className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option>Academic Year 2024-2025</option>
            </select>
            <select className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option>All Classes</option>
            </select>
            <select className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option>Health Tracking</option>
            </select>
            <select className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option>1st Assessment</option>
            </select>
            <select className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option>Combined View</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats?.total}
            subtitle="Registered students"
            icon={Users}
            color="text-blue-600"
            bgColor="bg-white"
          />
          <StatCard
            title="Health Assessed"
            value={stats?.daTDSK}
            subtitle="TDSK completed"
            icon={UserCheck}
            color="text-green-600"
            bgColor="bg-white"
          />
          <StatCard
            title="Male Students"
            value={stats?.male}
            subtitle={`${stats ? ((stats.male / stats.total) * 100).toFixed(1) : 0}% of total`}
            icon={Users}
            color="text-blue-600"
            bgColor="bg-white"
          />
          <StatCard
            title="Female Students"
            value={stats?.female}
            subtitle={`${stats ? ((stats.female / stats.total) * 100).toFixed(1) : 0}% of total`}
            icon={Users}
            color="text-pink-600"
            bgColor="bg-white"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">BMI Distribution</h3>
            </div>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-20 h-4 bg-gray-300 rounded"></div>
                    <div className="flex-1 h-3 bg-gray-300 rounded"></div>
                    <div className="w-12 h-4 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <CustomBarChart data={barChartData} />
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">BMI Composition</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="w-48 h-48 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            ) : (
              <CustomPieChart data={pieChartData} />
            )}
          </div>
        </div>

        {/* Additional Insights */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-4">Health Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {stats ? ((stats.daTDSK / stats.total) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm opacity-90">Assessment Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {stats ? ((stats.bmiStats?.["Bình thường"] || 0) / stats.total * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm opacity-90">Students with Normal BMI</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {stats ? Math.round((stats.male + stats.female) / 2) : 0}
              </div>
              <div className="text-sm opacity-90">Average Class Size</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAnalysis;