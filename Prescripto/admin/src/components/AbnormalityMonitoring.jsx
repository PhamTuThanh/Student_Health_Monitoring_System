import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppContext } from '../context/AppContext';

const AbnormalityMonitoring = ({ abnormalitiesData, onExport }) => {
  const { hideNavbar, showNavbar } = useAppContext();
  const [filteredData, setFilteredData] = useState(abnormalitiesData);
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    symptoms: '',
    doctor: '',
    severity: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAbnormality, setSelectedAbnormality] = useState(null);

  useEffect(() => {
    setFilteredData(abnormalitiesData);
  }, [abnormalitiesData]);

  // Apply filters
  useEffect(() => {
    let filtered = [...abnormalitiesData];

    if (filters.dateRange.start) {
      filtered = filtered.filter(item => 
        new Date(item.date) >= new Date(filters.dateRange.start)
      );
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(item => 
        new Date(item.date) <= new Date(filters.dateRange.end)
      );
    }

    if (filters.symptoms) {
      filtered = filtered.filter(item => 
        item.symptoms.some(symptom => 
          symptom.toLowerCase().includes(filters.symptoms.toLowerCase())
        )
      );
    }

    if (filters.doctor) {
      filtered = filtered.filter(item => 
        item.doctorName.toLowerCase().includes(filters.doctor.toLowerCase())
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [filters, abnormalitiesData]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Get common symptoms
  const getCommonSymptoms = () => {
    const symptomCounts = {};
    abnormalitiesData.forEach(item => {
      item.symptoms.forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    });
    return Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([symptom, count]) => ({ symptom, count }));
  };

  // Get recent trends
  const getRecentTrends = () => {
    const last30Days = abnormalitiesData.filter(item => {
      const daysDiff = (new Date() - new Date(item.date)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    const last7Days = abnormalitiesData.filter(item => {
      const daysDiff = (new Date() - new Date(item.date)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });

    return {
      last30Days: last30Days.length,
      last7Days: last7Days.length,
      trend: last7Days.length > (last30Days.length / 4) ? 'increasing' : 'stable'
    };
  };

  const getSeverityLevel = (symptoms) => {
    const highRiskSymptoms = ['chest pain', 'difficulty breathing', 'severe headache', 'fever'];
    const hasHighRisk = symptoms.some(symptom => 
      highRiskSymptoms.some(risk => symptom.toLowerCase().includes(risk))
    );
    return hasHighRisk ? 'High' : symptoms.length > 2 ? 'Medium' : 'Low';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Handler functions
  const handleViewDetails = (abnormality) => {
    hideNavbar();
    setSelectedAbnormality(abnormality);
    setShowDetailModal(true);
  };

  const handleFollowUp = (abnormality) => {
    toast.info(`Follow-up scheduled for ${abnormality.studentName} (ID: ${abnormality.studentId})`);
    // TODO: Implement follow-up functionality
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAbnormality(null);
    showNavbar();
  };

  const commonSymptoms = getCommonSymptoms();
  const trends = getRecentTrends();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Abnormality Monitoring</h2>
        <button 
          onClick={onExport}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Export Report
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-600">Total Cases</h3>
          <p className="text-2xl font-bold text-gray-900">{abnormalitiesData.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-500">
          <h3 className="text-sm font-medium text-gray-600">Last 30 Days</h3>
          <p className="text-2xl font-bold text-gray-900">{trends.last30Days}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-600">Last 7 Days</h3>
          <p className="text-2xl font-bold text-gray-900">{trends.last7Days}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-600">Trend</h3>
          <p className="text-lg font-bold text-gray-900">
            {trends.trend === 'increasing' ? '↗️ Increasing' : '➡️ Stable'}
          </p>
        </div>
      </div>

      {/* Common Symptoms */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-4">Most Common Symptoms</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {commonSymptoms.map((item, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{item.symptom}</p>
              <p className="text-sm text-gray-600">{item.count} cases</p>
            </div>
          ))}
        </div>
      </div>

      {/* Abnormalities Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium mb-4">Recent Abnormalities</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters({...filters, dateRange: {...filters.dateRange, start: e.target.value}})}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters({...filters, dateRange: {...filters.dateRange, end: e.target.value}})}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
              <input
                type="text"
                placeholder="Search symptoms..."
                value={filters.symptoms}
                onChange={(e) => setFilters({...filters, symptoms: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
              <input
                type="text"
                placeholder="Search doctor..."
                value={filters.doctor}
                onChange={(e) => setFilters({...filters, doctor: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symptoms</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((item, index) => {
                const severity = getSeverityLevel(item.symptoms);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.studentName}</div>
                        <div className="text-sm text-gray-500">ID: {item.studentId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {item.symptoms.slice(0, 2).join(', ')}
                        {item.symptoms.length > 2 && ` +${item.symptoms.length - 2} more`}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.doctorName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(severity)}`}>
                        {severity}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewDetails(item)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleFollowUp(item)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Follow-up
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
          <div className="text-sm text-gray-700">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">{currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAbnormality && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Abnormality Details</h2>
              <button 
                onClick={closeDetailModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Student Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Student Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Student Name</p>
                    <p className="font-medium">{selectedAbnormality.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <p className="font-medium">{selectedAbnormality.studentId}</p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Medical Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Date of Examination</p>
                    <p className="font-medium">{new Date(selectedAbnormality.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Attending Doctor</p>
                    <p className="font-medium">{selectedAbnormality.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Severity Level</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(getSeverityLevel(selectedAbnormality.symptoms))}`}>
                      {getSeverityLevel(selectedAbnormality.symptoms)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Symptoms */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Symptoms</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAbnormality.symptoms.map((symptom, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>

              {/* Treatment */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Temporary Treatment</h3>
                <p className="text-gray-700">
                  {selectedAbnormality.temporaryTreatment || 'No treatment notes recorded'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button 
                  onClick={() => handleFollowUp(selectedAbnormality)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                >
                  Schedule Follow-up
                </button>
                <button 
                  onClick={() => {
                    // TODO: Add print functionality
                    toast.info('Print functionality will be implemented');
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbnormalityMonitoring; 