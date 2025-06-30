import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const HealthAnalytics = ({ analyticsData }) => {
  // Check if we have any data to display
  const hasData = analyticsData && (
    (analyticsData.bmiDistribution && analyticsData.bmiDistribution.some(item => item.count > 0)) ||
    (analyticsData.healthTrends && analyticsData.healthTrends.some(trend => trend.total > 0)) ||
    (analyticsData.abnormalityBreakdown && analyticsData.abnormalityBreakdown.length > 0) ||
    (analyticsData.cohortComparison && analyticsData.cohortComparison.some(cohort => cohort.totalStudents > 0))
  );

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold mb-4">Health Analytics & Visualizations</h2>
      
      {!hasData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>No Health Data Available</strong><br />
                There is currently no valid health data to display analytics. Please ensure that students have completed their health examinations and the data has been properly recorded.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* BMI Distribution */}
      {analyticsData.bmiDistribution && analyticsData.bmiDistribution.some(item => item.count > 0) && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">BMI Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.bmiDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Health Trends */}
      {analyticsData.healthTrends && analyticsData.healthTrends.some(trend => trend.total > 0) && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Health Trends (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.healthTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="healthyRate" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="total" stroke="#6B7280" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Two column layout for smaller charts */}
      {(analyticsData.abnormalityBreakdown?.length > 0 || analyticsData.cohortComparison?.some(cohort => cohort.totalStudents > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Abnormality Breakdown */}
          {analyticsData.abnormalityBreakdown && analyticsData.abnormalityBreakdown.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Most Common Symptoms</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.abnormalityBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ symptom, count }) => `${symptom}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.abnormalityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Cohort Comparison */}
          {analyticsData.cohortComparison && analyticsData.cohortComparison.some(cohort => cohort.totalStudents > 0) && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Health Rate by Cohort</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.cohortComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cohort" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="healthyRate" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <h4 className="text-lg font-medium">Average BMI</h4>
          <p className="text-2xl font-bold">
            {(() => {
              const totalStudents = analyticsData.bmiDistribution.reduce((acc, item) => acc + item.count, 0);
              if (totalStudents === 0) return 'No Data';
              
              // Calculate weighted average BMI based on distribution
              let totalBMI = 0;
              analyticsData.bmiDistribution.forEach(item => {
                let avgBMI = 22; // default average
                switch(item.category) {
                  case 'Underweight': avgBMI = 17; break;
                  case 'Normal': avgBMI = 21.7; break;
                  case 'Overweight': avgBMI = 27.2; break;
                  case 'Obese': avgBMI = 32; break;
                }
                totalBMI += avgBMI * item.count;
              });
              return (totalBMI / totalStudents).toFixed(1);
            })()}
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <h4 className="text-lg font-medium">Health Trend</h4>
          <p className="text-2xl font-bold">
            {(() => {
              if (!analyticsData.healthTrends || analyticsData.healthTrends.length === 0) return 'No Data';
              
              const validTrends = analyticsData.healthTrends.filter(trend => trend.total > 0);
              if (validTrends.length < 2) return 'Insufficient Data';
              
              const latestRate = validTrends[validTrends.length - 1]?.healthyRate || 0;
              const earliestRate = validTrends[0]?.healthyRate || 0;
              
              if (latestRate > earliestRate) return '↗️ Improving';
              else if (latestRate < earliestRate) return '↘️ Declining';
              else return '➡️ Stable';
            })()}
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <h4 className="text-lg font-medium">Risk Students</h4>
          <p className="text-2xl font-bold">
            {analyticsData.bmiDistribution && analyticsData.bmiDistribution.length > 0 
              ? analyticsData.bmiDistribution.filter(item => 
                  item.category === 'Underweight' || item.category === 'Obese'
                ).reduce((acc, item) => acc + item.count, 0)
              : 0
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthAnalytics;