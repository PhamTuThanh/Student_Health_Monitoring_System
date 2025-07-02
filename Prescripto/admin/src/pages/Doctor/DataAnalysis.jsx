import React, { useEffect, useState } from 'react';
import { Users, Activity, UserCheck, TrendingUp } from 'lucide-react';
import axios from 'axios';


const DataAnalysis = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examSessionId, setExamSessionId] = useState("");
  const [autoSelected, setAutoSelected] = useState(false);
  const [examSessions, setExamSessions] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [classes, setClasses] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState("All");
  const [majors, setMajors] = useState([]);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    axios.get(`${backendUrl}/api/doctor/list-exam-sessions`)
      .then(res => {
        setExamSessions(res.data.data);
        if (!examSessionId && res.data.data.length > 0 && !autoSelected) {
          const sorted = [...res.data.data].sort((a, b) => {
            const getYear = (s) => {
              if (s.examSessionAcademicYear) {
                const y = parseInt(String(s.examSessionAcademicYear).split('-')[0]);
                return isNaN(y) ? 0 : y;
              }
              return s.createdAt ? new Date(s.createdAt).getFullYear() : 0;
            };
            return getYear(b) - getYear(a);
          });
          setExamSessionId(sorted[0]._id);
          setAutoSelected(true);
        }
      })
      .catch(err => console.error(err));
  }, []);
  
  useEffect(() => {
    if (!examSessionId) {
      setClasses([]);
      setSelectedClass("All");
      setMajors([]);
      setSelectedMajor("All");
      return;
    }
    
    // Fetch physical fitness data and students data to get unique classes and majors
    Promise.all([
      axios.get(`${backendUrl}/api/doctor/physical-fitness-by-session?examSessionId=${examSessionId}`),
      axios.get(`${backendUrl}/api/students`)
    ])
    .then(([fitnessRes, studentsRes]) => {
      const fitnessData = fitnessRes.data.data || [];
      const studentsData = studentsRes.data.students || [];
      
      // Get unique classes from fitness data
      const uniqueClasses = [...new Set(fitnessData.map(row => row.cohort))].filter(Boolean);
      setClasses(uniqueClasses);
      setSelectedClass("All");
      
      // Get unique majors from students data
      const uniqueMajors = [...new Set(studentsData.map(row => row.major))].filter(Boolean);
      setMajors(uniqueMajors);
      setSelectedMajor("All");
    })
    .catch(() => {
      setClasses([]);
      setMajors([]);
    });
  }, [examSessionId]);

  useEffect(() => {
    if (!examSessionId) return;
    setLoading(true);
    let url = `${backendUrl}/api/doctor/physical-fitness-status?examSessionId=${examSessionId}`;
    if (selectedClass && selectedClass !== "All") {
      url += `&cohort=${encodeURIComponent(selectedClass)}`;
    }
    if (selectedMajor && selectedMajor !== "All") {
      url += `&major=${encodeURIComponent(selectedMajor)}`;
    }
    axios.get(url)
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        setStats(null);
      });
  }, [examSessionId, selectedClass, selectedMajor]);

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
                width: `${data.length > 0 ? (item.value / Math.max(...data.map(d => d.value))) * 100 : 0}%`,
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <select onChange={(e) => setExamSessionId(e.target.value)} value={examSessionId} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                {examSessions.length === 0 && <option value="">No exam session</option>}
                {examSessions.length > 0 && 
                  [...examSessions]
                    .sort((a, b) => {
                      const getYear = (s) => {
                        if (s.examSessionAcademicYear) {
                          const y = parseInt(String(s.examSessionAcademicYear).split('-')[0]);
                          return isNaN(y) ? 0 : y;
                        }
                        return s.createdAt ? new Date(s.createdAt).getFullYear() : 0;
                      };
                      return getYear(b) - getYear(a); // Descending order (newest first)
                    })
                    .map(session => (
                      <option key={session._id} value={session._id}>{session.examSessionAcademicYear}</option>
                    ))
                }
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                disabled={classes.length === 0}
              >
                <option value="All">All Classes</option>
                {classes
                  .slice()
                  .sort((a, b) => {
                    const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
                    const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
                    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                    return a.toLowerCase().localeCompare(b.toLowerCase(), undefined, { numeric: true });
                  })
                  .map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Major</label>
              <select
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={selectedMajor}
                onChange={e => setSelectedMajor(e.target.value)}
                disabled={majors.length === 0}
              >
                <option value="All">All Majors</option>
                {majors
                  .slice()
                  .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
                  .map(major => (
                    <option key={major} value={major}>{major}</option>
                  ))}
              </select>
            </div>
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
                {stats ? ((stats.bmiStats?.["BT"] || 0) / stats.total * 100).toFixed(1) : 0}%
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