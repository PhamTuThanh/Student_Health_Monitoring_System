import React, { useState } from 'react';

const ReportsAndSettings = ({ 
  onExportStudent, 
  onExportAbnormalities, 
  onExportComprehensive,
  systemSettings,
  onUpdateSettings,
  onBackupData 
}) => {
  const [activeSubTab, setActiveSubTab] = useState('reports');
  const [localSettings, setLocalSettings] = useState(systemSettings);
  const [customReport, setCustomReport] = useState({
    startDate: '',
    endDate: '',
    sections: {
      studentHealth: true,
      bmiAnalytics: true,
      abnormalities: false,
      trends: false
    }
  });
  const [schedules, setSchedules] = useState([
    { id: 1, name: 'Monthly Health Summary', description: 'Sent to administrators every month', active: true },
    { id: 2, name: 'Weekly Abnormality Alert', description: 'Emergency cases summary', active: false }
  ]);

  const handleSettingsUpdate = () => {
    onUpdateSettings(localSettings);
  };

  const generateCustomReport = () => {
    if (!customReport.startDate || !customReport.endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    const selectedSections = Object.entries(customReport.sections)
      .filter(([key, value]) => value)
      .map(([key]) => key);
    
    if (selectedSections.length === 0) {
      alert('Please select at least one section to include');
      return;
    }

    // Simulate custom report generation
    const reportName = `custom_report_${customReport.startDate}_${customReport.endDate}.xlsx`;
    console.log('Generating custom report:', { 
      dateRange: `${customReport.startDate} to ${customReport.endDate}`,
      sections: selectedSections 
    });
    
    // Here you would call the actual export function with filters
    alert(`Custom report "${reportName}" generated successfully!\nSections: ${selectedSections.join(', ')}`);
  };

  const toggleSchedule = (id) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === id ? { ...schedule, active: !schedule.active } : schedule
    ));
  };

  const addNewSchedule = () => {
    const name = prompt('Enter schedule name:');
    if (name) {
      setSchedules(prev => [...prev, {
        id: Date.now(),
        name,
        description: 'Custom schedule',
        active: false
      }]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 Reports & Export
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ System Settings
          </button>
        </nav>
      </div>

      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Reports & Data Export</h2>
          
          {/* Quick Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Student Health Data</h3>
                  <p className="text-gray-600">Complete health records</p>
                </div>
              </div>
              <button 
                onClick={onExportStudent}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Export Excel
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <span className="text-2xl">🚨</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Abnormalities Report</h3>
                  <p className="text-gray-600">All abnormality cases</p>
                </div>
              </div>
              <button 
                onClick={onExportAbnormalities}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Export Excel
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Comprehensive Report</h3>
                  <p className="text-gray-600">Complete system overview</p>
                </div>
              </div>
              <button 
                onClick={onExportComprehensive}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Export Excel
              </button>
            </div>
          </div>

          {/* Custom Report Builder */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-4">Custom Report Builder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Range</label>
                <div className="space-y-2">
                  <input 
                    type="date" 
                    value={customReport.startDate}
                    onChange={(e) => setCustomReport(prev => ({ ...prev, startDate: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full" 
                    placeholder="Start Date" 
                  />
                  <input 
                    type="date" 
                    value={customReport.endDate}
                    onChange={(e) => setCustomReport(prev => ({ ...prev, endDate: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full" 
                    placeholder="End Date" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Include Sections</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={customReport.sections.studentHealth}
                      onChange={(e) => setCustomReport(prev => ({
                        ...prev,
                        sections: { ...prev.sections, studentHealth: e.target.checked }
                      }))}
                    />
                    <span>Student Health Summary</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={customReport.sections.bmiAnalytics}
                      onChange={(e) => setCustomReport(prev => ({
                        ...prev,
                        sections: { ...prev.sections, bmiAnalytics: e.target.checked }
                      }))}
                    />
                    <span>BMI Analytics</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={customReport.sections.abnormalities}
                      onChange={(e) => setCustomReport(prev => ({
                        ...prev,
                        sections: { ...prev.sections, abnormalities: e.target.checked }
                      }))}
                    />
                    <span>Abnormalities Detail</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={customReport.sections.trends}
                      onChange={(e) => setCustomReport(prev => ({
                        ...prev,
                        sections: { ...prev.sections, trends: e.target.checked }
                      }))}
                    />
                    <span>Trends Analysis</span>
                  </label>
                </div>
              </div>
            </div>
            <button 
              onClick={generateCustomReport}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Generate Custom Report
            </button>
          </div>

          {/* Scheduled Reports */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-4">Scheduled Reports</h3>
            <div className="space-y-4">
              {schedules.map(schedule => (
                <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{schedule.name}</h4>
                    <p className="text-sm text-gray-600">{schedule.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${schedule.active ? 'text-green-600' : 'text-gray-500'}`}>
                      {schedule.active ? 'Active' : 'Inactive'}
                    </span>
                    <button 
                      onClick={() => toggleSchedule(schedule.id)}
                      className={`px-3 py-1 text-xs rounded ${
                        schedule.active 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      {schedule.active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="text-blue-600 hover:text-blue-800">Edit</button>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={addNewSchedule}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add New Schedule
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">System Settings</h2>
          
          {/* Data Management */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-4">Data Management</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Data Lock</label>
                  <p className="text-sm text-gray-600">Prevent data modification when enabled</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={localSettings.dataLocked}
                    onChange={(e) => setLocalSettings({...localSettings, dataLocked: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Auto Backup</label>
                  <p className="text-sm text-gray-600">Automatically backup data daily</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={localSettings.backupEnabled}
                    onChange={(e) => setLocalSettings({...localSettings, backupEnabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Auto Reports</label>
                  <p className="text-sm text-gray-600">Generate reports automatically</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={localSettings.autoReports}
                    onChange={(e) => setLocalSettings({...localSettings, autoReports: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            <button 
              onClick={handleSettingsUpdate}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>

          {/* Backup Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-4">Data Backup</h3>
            <p className="text-gray-600 mb-4">Create a complete backup of all health data including students, fitness records, abnormalities, and analytics.</p>
            <div className="space-y-2">
              <button 
                onClick={onBackupData}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                💾 Create Full Backup
              </button>
              <p className="text-xs text-gray-500">Backup includes: Students, Physical fitness data, Abnormalities, Exam sessions, System statistics, and Analytics data</p>
            </div>
          </div>

          {/* Alert Settings */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-4">Alert Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Health Alerts</label>
                  <p className="text-sm text-gray-600">Notify when critical health issues detected</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={localSettings.alertsEnabled}
                    onChange={(e) => setLocalSettings({...localSettings, alertsEnabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsAndSettings; 