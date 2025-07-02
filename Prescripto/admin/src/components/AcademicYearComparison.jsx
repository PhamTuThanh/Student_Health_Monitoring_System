import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { isHealthyBMI, isValidBMI, getBMICategory } from '../utils/bmiUtils';

const AcademicYearComparison = () => {
  const [academicYearData, setAcademicYearData] = useState([]);
  const [loading, setLoading] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const fetchAllDataForComparison = async () => {
    try {
      setLoading(true);
      const [physicalFitnessRes, examSessionsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/admin/all-physical-fitness`), // Always get ALL data
        axios.get(`${backendUrl}/api/admin/list-exam-session`)
      ]);

      const allPhysicalFitnessData = physicalFitnessRes.data.data || [];
      const examSessionsData = examSessionsRes.data.data || [];

      // Process academic year comparison with ALL data
      const academicYearComparison = processAcademicYearData(allPhysicalFitnessData, examSessionsData);
      setAcademicYearData(academicYearComparison);

    } catch (error) {
      console.error('Error fetching academic year comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAcademicYearData = (physicalData, examSessions) => {
    const academicYearData = {};
    
    if (physicalData && physicalData.length > 0) {
      physicalData.forEach(item => {
        const bmi = parseFloat(item.bmi);
        
        // Get academic year from examSessionId
        let academicYear = 'Unknown';
        if (item.examSessionId) {
          if (typeof item.examSessionId === 'object' && item.examSessionId.examSessionAcademicYear) {
            academicYear = item.examSessionId.examSessionAcademicYear;
          } else if (typeof item.examSessionId === 'string') {
            const examSession = examSessions.find(session => session._id === item.examSessionId);
            if (examSession) {
              academicYear = examSession.examSessionAcademicYear || examSession.academicYear || 'Unknown';
            }
          }
        }
        
        // Only process records with valid BMI data - SỬ DỤNG isValidBMI từ bmiUtils
        if (isValidBMI(bmi)) {
          if (!academicYearData[academicYear]) {
            academicYearData[academicYear] = { 
              total: 0, 
              healthy: 0, 
              underweight: 0, 
              overweight: 0, 
              obese: 0,
              avgBMI: 0,
              totalBMI: 0
            };
          }
          
          academicYearData[academicYear].total++;
          academicYearData[academicYear].totalBMI += bmi;
          
          // SỬ DỤNG getBMICategory để phân loại BMI chuẩn hóa
          const category = getBMICategory(bmi);
          switch (category) {
            case 'Underweight':
              academicYearData[academicYear].underweight++;
              break;
            case 'Normal':
              academicYearData[academicYear].healthy++;
              break;
            case 'Overweight':
              academicYearData[academicYear].overweight++;
              break;
            case 'Obese':
              academicYearData[academicYear].obese++;
              break;
          }
        }
      });
    }

    // Calculate averages and rates for academic years
    return Object.entries(academicYearData)
      .filter(([year]) => year !== 'Unknown')
      .map(([academicYear, data]) => ({
        academicYear,
        healthyRate: data.total > 0 ? Math.round((data.healthy / data.total) * 100) : 0,
        totalStudents: data.total,
        avgBMI: data.total > 0 ? Math.round((data.totalBMI / data.total) * 10) / 10 : 0,
        underweightRate: data.total > 0 ? Math.round((data.underweight / data.total) * 100) : 0,
        overweightRate: data.total > 0 ? Math.round((data.overweight / data.total) * 100) : 0,
        obeseRate: data.total > 0 ? Math.round((data.obese / data.total) * 100) : 0
      }))
      .sort((a, b) => a.academicYear.localeCompare(b.academicYear));
  };

  useEffect(() => {
    fetchAllDataForComparison();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Academic Year Health Comparison</h3>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Healthy Students Rate */}
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <h4 className="text-lg font-medium mb-4">Healthy Students Rate (%)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={academicYearData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="academicYear" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="healthyRate" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Average BMI by Academic Year */}
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <h4 className="text-lg font-medium mb-4">Average BMI by Academic Year</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={academicYearData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="academicYear"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="avgBMI" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-medium">Detailed Statistics by Academic Year</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Year
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Students
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg BMI
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Healthy (%)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Underweight (%)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overweight (%)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Obese (%)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {academicYearData.map((yearData, index) => (
                <tr key={yearData.academicYear} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {yearData.academicYear}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {yearData.totalStudents}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <span className="font-medium text-blue-600">{yearData.avgBMI}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <span className="font-medium text-green-600">{yearData.healthyRate}%</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <span className="font-medium text-yellow-600">{yearData.underweightRate}%</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <span className="font-medium text-orange-600">{yearData.overweightRate}%</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <span className="font-medium text-red-600">{yearData.obeseRate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AcademicYearComparison; 