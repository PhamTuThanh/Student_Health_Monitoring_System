import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";
import * as XLSX from 'xlsx';
import { saveAs } from "file-saver";
import HealthAnalytics from "../../components/HealthAnalytics";
import AbnormalityMonitoring from "../../components/AbnormalityMonitoring";
import ReportsAndSettings from "../../components/ReportsAndSettings";
import { useAppContext } from "../../context/AppContext";

const HealthDataManager = () => {
  const { aToken } = useContext(AdminContext);
  const { hideNavbar, showNavbar } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [kpiData, setKpiData] = useState({
    totalStudents: 0,
    totalStudentsWithData: 0,
    abnormalitiesThisMonth: 0,
    healthyStudentsRate: 0,
    completedExamSessions: 0
  });
  const [studentsData, setStudentsData] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filters, setFilters] = useState({
    academicYear: '',
    examSessionId: '',
    cohort: '',
    healthStatus: '',
    searchTerm: ''
  });
  const [availableCohorts, setAvailableCohorts] = useState([]);
  const [examSessions, setExamSessions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  // Analytics states
  const [analyticsData, setAnalyticsData] = useState({
    bmiDistribution: [],
    healthTrends: [],
    abnormalityBreakdown: [],
    cohortComparison: []
  });
  
  // Abnormalities states
  const [abnormalitiesData, setAbnormalitiesData] = useState([]);
  
  // Settings states
  const [systemSettings, setSystemSettings] = useState({
    dataLocked: false,
    backupEnabled: true,
    alertsEnabled: true,
    autoReports: false
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('healthDataSettings');
    if (savedSettings) {
      setSystemSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Get KPI data
  const fetchKPIData = async (selectedExamSessionId = null) => {
    try {
      setLoading(true);
      
      // Determine which exam session to use for KPI calculation
      const targetExamSessionId = selectedExamSessionId || filters.examSessionId;
      
      let physicalFitnessUrl = `${backendUrl}/api/admin/all-physical-fitness`;
      if (targetExamSessionId) {
        physicalFitnessUrl = `${backendUrl}/api/admin/physical-fitness-by-session?examSessionId=${targetExamSessionId}`;
      }
      
      const [studentsRes, physicalFitnessRes, abnormalityRes, examSessionsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/students`),
        axios.get(physicalFitnessUrl),
        axios.get(`${backendUrl}/api/admin/all-abnormality`),
        axios.get(`${backendUrl}/api/admin/list-exam-session`)
      ]);

      const allStudentsData = studentsRes.data.students || [];
      const physicalFitnessData = physicalFitnessRes.data.data || [];
      const abnormalityData = abnormalityRes.data.data || [];
      const examSessionsData = examSessionsRes.data.data || [];

      // Calculate KPIs based on exam session
      let totalStudents = allStudentsData.length;
      
      // If filtering by exam session, count only students with data in that session
      if (targetExamSessionId && physicalFitnessData.length > 0) {
        const studentsInSession = new Set(physicalFitnessData.map(item => item.studentId));
        totalStudents = studentsInSession.size;
      }
      
      // Only count students with valid health data
      const studentsWithValidData = physicalFitnessData.filter(item => {
        const bmi = parseFloat(item.bmi);
        return item.studentId && !isNaN(bmi) && bmi > 0 && bmi < 100;
      });
      
      const totalStudentsWithData = new Set(studentsWithValidData.map(item => item.studentId)).size;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const abnormalitiesThisMonth = abnormalityData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      }).length;

      const healthyStudents = studentsWithValidData.filter(item => {
        const bmi = parseFloat(item.bmi);
        return bmi >= 18.5 && bmi <= 24.9;
      });
      const healthyStudentsRate = totalStudentsWithData > 0 ? Math.round((healthyStudents.length / totalStudentsWithData) * 100) : 0;

      setKpiData({
        totalStudents,
        totalStudentsWithData,
        abnormalitiesThisMonth,
        healthyStudentsRate,
        completedExamSessions: examSessionsData.length
      });

      // Process analytics data
      const bmiDistribution = processAnalyticsData(physicalFitnessData, abnormalityData);
      setAnalyticsData(bmiDistribution);
      setAbnormalitiesData(abnormalityData);

    } catch (error) {
      console.error('Error fetching KPI data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Process analytics data function
  const processAnalyticsData = (physicalData, abnormalityData) => {
    // BMI Distribution
    const bmiRanges = { 'Underweight': 0, 'Normal': 0, 'Overweight': 0, 'Obese': 0 };
    
    // Only process if we have physical data
    if (physicalData && physicalData.length > 0) {
      physicalData.forEach(item => {
        // Validate BMI data before processing
        const bmi = parseFloat(item.bmi);
        
        // Only count valid BMI values (not NaN, not null, not undefined, and reasonable range)
        if (!isNaN(bmi) && bmi > 0 && bmi < 100) {
          if (bmi < 18.5) bmiRanges['Underweight']++;
          else if (bmi <= 24.9) bmiRanges['Normal']++;
          else if (bmi <= 29.9) bmiRanges['Overweight']++;
          else bmiRanges['Obese']++;
        }
      });
    }

    // Health trends (last 6 months)
    const healthTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthData = physicalData.filter(item => {
        const itemDate = new Date(item.followDate);
        return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
      });
      
      // Only count records with valid BMI data
      const validMonthData = monthData.filter(item => {
        const bmi = parseFloat(item.bmi);
        return !isNaN(bmi) && bmi > 0 && bmi < 100;
      });
      
      const healthyCount = validMonthData.filter(item => {
        const bmi = parseFloat(item.bmi);
        return bmi >= 18.5 && bmi <= 24.9;
      }).length;
      
      healthTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        healthy: healthyCount,
        total: validMonthData.length,
        healthyRate: validMonthData.length > 0 ? Math.round((healthyCount / validMonthData.length) * 100) : 0
      });
    }

    // Abnormality breakdown
    const symptomCounts = {};
    if (abnormalityData && abnormalityData.length > 0) {
      abnormalityData.forEach(item => {
        // Only process if symptoms array exists and is not empty
        if (item.symptoms && Array.isArray(item.symptoms) && item.symptoms.length > 0) {
          item.symptoms.forEach(symptom => {
            if (symptom && symptom.trim()) { // Only count non-empty symptoms
              symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
            }
          });
        }
      });
    }
    
    const abnormalityBreakdown = Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([symptom, count]) => ({ symptom, count }));

    // Cohort comparison
    const cohortData = {};
    if (physicalData && physicalData.length > 0) {
      physicalData.forEach(item => {
        const bmi = parseFloat(item.bmi);
        
        // Only process records with valid BMI and cohort data
        if (item.cohort && !isNaN(bmi) && bmi > 0 && bmi < 100) {
          if (!cohortData[item.cohort]) {
            cohortData[item.cohort] = { total: 0, healthy: 0 };
          }
          cohortData[item.cohort].total++;
          
          if (bmi >= 18.5 && bmi <= 24.9) {
            cohortData[item.cohort].healthy++;
          }
        }
      });
    }
    
    const cohortComparison = Object.entries(cohortData).map(([cohort, data]) => ({
      cohort,
      healthyRate: data.total > 0 ? Math.round((data.healthy / data.total) * 100) : 0,
      totalStudents: data.total
    }));

    return {
      bmiDistribution: Object.entries(bmiRanges).map(([category, count]) => ({ category, count })),
      healthTrends,
      abnormalityBreakdown,
      cohortComparison
    };
  };

  // Get students health summary
  const fetchStudentsHealthData = async (selectedExamSessionId = null) => {
    try {
      setLoading(true);
      
      // Determine which exam session to use for filtering
      const targetExamSessionId = selectedExamSessionId || filters.examSessionId;
      
      let physicalFitnessUrl = `${backendUrl}/api/admin/all-physical-fitness`;
      if (targetExamSessionId) {
        physicalFitnessUrl = `${backendUrl}/api/admin/physical-fitness-by-session?examSessionId=${targetExamSessionId}`;
      }
      
      const [studentsRes, physicalFitnessRes, abnormalityRes] = await Promise.all([
        axios.get(`${backendUrl}/api/students`),
        axios.get(physicalFitnessUrl),
        axios.get(`${backendUrl}/api/admin/all-abnormality`)
      ]);

      const students = studentsRes.data.students || [];
      const physicalFitnessData = physicalFitnessRes.data.data || [];
      const abnormalityData = abnormalityRes.data.data || [];

      // Combine data
      const combinedData = students.map(student => {
        const latestFitness = physicalFitnessData
          .filter(item => {
            const studentMatch = item.studentId === student.studentId;
            // If filtering by exam session, ensure the fitness data is from that session
            if (targetExamSessionId) {
              let fExamSessionId = item.examSessionId;
              if (typeof fExamSessionId === 'object' && fExamSessionId !== null) {
                fExamSessionId = fExamSessionId._id || fExamSessionId.$oid || '';
              }
              return studentMatch && String(fExamSessionId) === String(targetExamSessionId);
            }
            return studentMatch;
          })
          .sort((a, b) => new Date(b.followDate) - new Date(a.followDate))[0];

        const abnormalityCount = abnormalityData.filter(item => item.studentId === student.studentId).length;

        let healthStatus = 'Normal';
        if (latestFitness) {
          const bmi = parseFloat(latestFitness.bmi);
          const systolic = parseFloat(latestFitness.systolic);
          const diastolic = parseFloat(latestFitness.diastolic);
          
          if (bmi < 18.5 || bmi > 30 || systolic > 140 || diastolic > 90 || abnormalityCount > 0) {
            healthStatus = 'Alert';
          } else if (bmi < 20 || bmi > 25 || systolic > 120 || diastolic > 80) {
            healthStatus = 'Warning';
          }
        }

        return {
          ...student,
          latestFitness,
          abnormalityCount,
          healthStatus,
          lastCheckDate: latestFitness?.followDate || 'No data'
        };
      });

      setStudentsData(combinedData);
      setFilteredStudents(combinedData);
      
      // Extract unique cohorts for filter dropdown
      const uniqueCohorts = [...new Set(students.map(student => student.cohort))].filter(Boolean);
      setAvailableCohorts(uniqueCohorts);
      
    } catch (error) {
      console.error('Error fetching students health data:', error);
      toast.error('Failed to fetch students health data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch exam sessions for academic year filter
  const fetchExamSessions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/admin/list-exam-session`);
      if (res.data.success) {
        const sortedSessions = [...res.data.data].sort((a, b) => {
          const getYear = (s) => {
            if (s.examSessionAcademicYear || s.academicYear) {
              const academicYear = s.examSessionAcademicYear || s.academicYear;
              const y = parseInt(String(academicYear).split('-')[0]);
              return isNaN(y) ? 0 : y;
            }
            return s.createdAt ? new Date(s.createdAt).getFullYear() : 0;
          };
          return getYear(b) - getYear(a); // Descending order (newest first)
        });
        setExamSessions(sortedSessions);
      }
    } catch (error) {
      console.error('Error fetching exam sessions:', error);
    }
  };

  // Export functions
  const exportStudentHealthData = () => {
    hideNavbar();
    const exportData = filteredStudents.map(student => ({
      'Student ID': student.studentId,
      'Name': student.name,
      'Cohort': student.cohort,
      'Gender': student.gender,
      'BMI': student.latestFitness?.bmi || 'N/A',
      'Blood Pressure': student.latestFitness ? `${student.latestFitness.systolic}/${student.latestFitness.diastolic}` : 'N/A',
      'Heart Rate': student.latestFitness?.heartRate || 'N/A',
      'Health Status': student.healthStatus,
      'Last Check Date': student.lastCheckDate !== 'No data' ? new Date(student.lastCheckDate).toLocaleDateString() : 'No data',
      'Abnormalities Count': student.abnormalityCount
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Health Data');
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `student_health_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNavbar();
    toast.success('Student health data exported successfully!');
  };

  const exportAbnormalitiesReport = () => {
    hideNavbar();
    const exportData = abnormalitiesData.map(abnormality => ({
      'Student ID': abnormality.studentId,
      'Student Name': abnormality.studentName,
      'Doctor': abnormality.doctorName,
      'Date': new Date(abnormality.date).toLocaleDateString(),
      'Symptoms': abnormality.symptoms?.join(', ') || '',
      'Temporary Treatment': abnormality.temporaryTreatment
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Abnormalities Report');
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `abnormalities_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNavbar();
    toast.success('Abnormalities report exported successfully!');
  };

  const exportComprehensiveReport = () => {
    hideNavbar();
    const workbook = XLSX.utils.book_new();
    
    // KPI Summary
    const kpiSummary = [
      { Metric: 'Total Students with Health Data', Value: kpiData.totalStudentsWithData },
      { Metric: 'Abnormalities This Month', Value: kpiData.abnormalitiesThisMonth },
      { Metric: 'Healthy Students Rate (%)', Value: kpiData.healthyStudentsRate },
      { Metric: 'Completed Exam Sessions', Value: kpiData.completedExamSessions }
    ];
    const kpiSheet = XLSX.utils.json_to_sheet(kpiSummary);
    XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPI Summary');
    
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `comprehensive_health_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNavbar();
    toast.success('Comprehensive report exported successfully!');
  };

  // Settings functions
  const updateSystemSettings = async (newSettings) => {
    try {
      setLoading(true);
      setSystemSettings(newSettings);
      localStorage.setItem('healthDataSettings', JSON.stringify(newSettings));
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const backupData = async () => {
    try {
      hideNavbar();
      setLoading(true);
      toast.info('Starting comprehensive data backup...');
      
      // Fetch all data for backup
      const [studentsRes, physicalFitnessRes, abnormalityRes, examSessionsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/students`),
        axios.get(`${backendUrl}/api/admin/all-physical-fitness`),
        axios.get(`${backendUrl}/api/admin/all-abnormality`),
        axios.get(`${backendUrl}/api/admin/list-exam-session`)
      ]);

      const students = studentsRes.data.students || [];
      const physicalFitnessData = physicalFitnessRes.data.data || [];
      const abnormalityData = abnormalityRes.data.data || [];
      const examSessionsData = examSessionsRes.data.data || [];

      // Create comprehensive backup workbook
      const workbook = XLSX.utils.book_new();
      
      // 1. Students Data Sheet
      const studentsSheet = XLSX.utils.json_to_sheet(students.map(student => ({
        'Student ID': student.studentId,
        'Name': student.name,
        'Email': student.email,
        'Phone': student.phone,
        'Address': student.address,
        'Date of Birth': student.dob,
        'Gender': student.gender,
        'Cohort': student.cohort,
        'Created At': student.createdAt
      })));
      XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students');

      // 2. Physical Fitness Data Sheet
      const fitnessSheet = XLSX.utils.json_to_sheet(physicalFitnessData.map(item => ({
        'Exam Session ID': item.examSessionId,
        'Student ID': item.studentId,
        'Cohort': item.cohort,
        'Gender': item.gender,
        'Follow Date': item.followDate,
        'Height (cm)': item.height,
        'Weight (kg)': item.weight,
        'BMI': item.bmi,
        'BMI Assessment': item.danhGiaBMI,
        'Systolic BP': item.systolic,
        'Diastolic BP': item.diastolic,
        'BP Assessment': item.danhGiaTTH,
        'Heart Rate': item.heartRate,
        'Heart Rate Assessment': item.danhGiaHeartRate,
        'Height Z-Score': item.zScoreCC,
        'Height Assessment': item.danhGiaCC,
        'Weight Z-Score': item.zScoreCN,
        'Weight Assessment': item.danhGiaCN
      })));
      XLSX.utils.book_append_sheet(workbook, fitnessSheet, 'Physical Fitness');

      // 3. Abnormalities Data Sheet
      const abnormalitiesSheet = XLSX.utils.json_to_sheet(abnormalityData.map(item => ({
        'Student ID': item.studentId,
        'Student Name': item.studentName,
        'Doctor Name': item.doctorName,
        'Date': new Date(item.date).toLocaleDateString(),
        'Symptoms': item.symptoms.join('; '),
        'Temporary Treatment': item.temporaryTreatment,
        'Created At': item.createdAt
      })));
      XLSX.utils.book_append_sheet(workbook, abnormalitiesSheet, 'Abnormalities');

      // 4. Exam Sessions Data Sheet
      const examSessionsSheet = XLSX.utils.json_to_sheet(examSessionsData.map(session => ({
        'Session ID': session._id,
        'Academic Year': session.academicYear,
        'Start Date': session.startDate,
        'End Date': session.endDate,
        'Status': session.status,
        'Created At': session.createdAt,
        'Created By': session.createdBy
      })));
      XLSX.utils.book_append_sheet(workbook, examSessionsSheet, 'Exam Sessions');

      // 5. System Statistics Sheet
      const statsData = [
        { Metric: 'Backup Date', Value: new Date().toLocaleString() },
        { Metric: 'Total Students', Value: students.length },
        { Metric: 'Students with Health Data', Value: new Set(physicalFitnessData.map(item => item.studentId)).size },
        { Metric: 'Total Health Records', Value: physicalFitnessData.length },
        { Metric: 'Total Abnormalities', Value: abnormalityData.length },
        { Metric: 'Total Exam Sessions', Value: examSessionsData.length },
        { Metric: 'Healthy Students Rate (%)', Value: kpiData.healthyStudentsRate },
        { Metric: 'Abnormalities This Month', Value: kpiData.abnormalitiesThisMonth }
      ];
      const statsSheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'System Statistics');

      // 6. Analytics Summary Sheet
      const analyticsSheet = XLSX.utils.json_to_sheet([
        { Section: 'BMI Distribution', Data: JSON.stringify(analyticsData.bmiDistribution) },
        { Section: 'Health Trends', Data: JSON.stringify(analyticsData.healthTrends) },
        { Section: 'Abnormality Breakdown', Data: JSON.stringify(analyticsData.abnormalityBreakdown) },
        { Section: 'Cohort Comparison', Data: JSON.stringify(analyticsData.cohortComparison) }
      ]);
      XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics Data');

      // Generate and download backup file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `health_data_backup_${timestamp}.xlsx`;
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, fileName);
      
      setLoading(false);
      showNavbar();
      toast.success(`Complete data backup exported successfully! File: ${fileName}`);
      
    } catch (error) {
      setLoading(false);
      showNavbar();
      console.error('Backup error:', error);
      toast.error('Data backup failed: ' + error.message);
    }
  };

  // Student detail functions
  const viewStudentDetail = (student) => {
    hideNavbar();
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const closeStudentModal = () => {
    showNavbar();
    setShowStudentModal(false);
    setSelectedStudent(null);
  };

  const exportSingleStudent = (student) => {
    hideNavbar();
    const exportData = [{
      'Student ID': student.studentId,
      'Name': student.name,
      'Email': student.email,
      'Phone': student.phone,
      'Gender': student.gender,
      'Cohort': student.cohort,
      'BMI': student.latestFitness?.bmi || 'N/A',
      'Health Status': student.healthStatus,
      'Last Check Date': student.lastCheckDate !== 'No data' ? new Date(student.lastCheckDate).toLocaleDateString() : 'No data',
      'Abnormalities Count': student.abnormalityCount
    }];
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Detail');
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `student_${student.studentId}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNavbar();
    toast.success(`Exported data for ${student.name} successfully!`);
  };

  // Filter students based on criteria
  useEffect(() => {
    let filtered = [...studentsData];

    if (filters.cohort) {
      filtered = filtered.filter(student => student.cohort === filters.cohort);
    }

    if (filters.healthStatus) {
      filtered = filtered.filter(student => student.healthStatus === filters.healthStatus);
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(student => 
        student.studentId?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        student.name?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [filters.cohort, filters.healthStatus, filters.searchTerm, studentsData]);

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const KPICard = ({ title, value, icon, color, suffix = "" }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}{suffix}</p>
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: color + '20' }}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'Normal': return 'text-green-600 bg-green-100';
      case 'Warning': return 'text-yellow-600 bg-yellow-100';
      case 'Alert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  useEffect(() => {
    if (aToken) {
      fetchKPIData();
      fetchStudentsHealthData();
      fetchExamSessions();
    }
  }, [aToken]);

  // Update KPI when filters change
  useEffect(() => {
    if (aToken && filters.examSessionId) {
      fetchKPIData(filters.examSessionId);
    }
  }, [filters.examSessionId, aToken]);



  return (
    <div className="p-6 bg-gray-50 min-h-screen h-[calc(100vh-80px)] overflow-y-auto ml-10 w-[950px] mb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Health Data Management</h1>
        <p className="text-gray-600">Comprehensive health data monitoring and management system</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title={filters.examSessionId ? "Students Examined / In Session" : "Students Examined / Total"}
          value={`${kpiData.totalStudentsWithData}/${kpiData.totalStudents}`}
          icon="👥"
          color="#3B82F6"
        />
        <KPICard
          title="Abnormalities This Month"
          value={kpiData.abnormalitiesThisMonth}
          icon="⚠️"
          color="#EF4444"
        />
        <KPICard
          title="Healthy Students Rate"
          value={kpiData.healthyStudentsRate}
          icon="💚"
          color="#10B981"
          suffix="%"
        />
        <KPICard
          title="Completed Exam Sessions"
          value={kpiData.completedExamSessions}
          icon="📋"
          color="#8B5CF6"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'students', label: 'Student Health', icon: '👨‍⚕️' },
              { id: 'abnormalities', label: 'Abnormalities', icon: '🚨' },
              { id: 'reports', label: 'Reports & Settings', icon: '📄' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-20">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">System Overview</h2>
            
            {/* Overview Stats */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-3">System Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{kpiData.totalStudents}</p>
                  <p className="text-sm text-gray-600">{filters.examSessionId ? "Students in Session" : "Total Students"}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{kpiData.totalStudentsWithData}</p>
                  <p className="text-sm text-gray-600">Students Examined</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {kpiData.totalStudents > 0 ? Math.round((kpiData.totalStudentsWithData / kpiData.totalStudents) * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Examination Rate</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Recent Health Checks</h3>
                <div className="space-y-2">
                  {studentsData.slice(0, 5).map((student, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="font-medium">{student.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getHealthStatusColor(student.healthStatus)}`}>
                        {student.healthStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={exportStudentHealthData}
                    className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                  >
                    📊 Export Health Summary
                  </button>
                  <button 
                    onClick={() => setActiveTab('abnormalities')}
                    className="w-full bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                  >
                    🚨 View Abnormalities
                  </button>
                  <button 
                    onClick={() => setActiveTab('reports')}
                    className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
                  >
                    💾 Backup & Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <HealthAnalytics analyticsData={analyticsData} />
        )}

        {activeTab === 'students' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Student Health Summary</h2>
              <button 
                onClick={exportStudentHealthData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Export Data
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <select
                value={filters.academicYear}
                onChange={(e) => {
                  const selectedAcademicYear = e.target.value;
                  const selectedSession = examSessions.find(session => 
                    (session.examSessionAcademicYear || session.academicYear) === selectedAcademicYear
                  );
                  
                  const newFilters = {
                    ...filters, 
                    academicYear: selectedAcademicYear,
                    examSessionId: selectedSession ? selectedSession._id : ''
                  };
                  
                  setFilters(newFilters);
                  
                  // Refetch both KPI and student data with the new exam session
                  if (selectedSession) {
                    fetchKPIData(selectedSession._id);
                    fetchStudentsHealthData(selectedSession._id);
                  } else {
                    fetchKPIData(null); // Load all data when no session selected
                    fetchStudentsHealthData(null);
                  }
                }}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Academic Years</option>
                {examSessions.map(session => (
                  <option key={session._id} value={session.examSessionAcademicYear || session.academicYear}>
                    {session.examSessionAcademicYear || session.academicYear}
                  </option>
                ))}
              </select>

              <select
                value={filters.cohort}
                onChange={(e) => setFilters({...filters, cohort: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Cohorts</option>
                {availableCohorts.map(cohort => (
                  <option key={cohort} value={cohort}>{cohort}</option>
                ))}
              </select>

              <select
                value={filters.healthStatus}
                onChange={(e) => setFilters({...filters, healthStatus: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Health Status</option>
                <option value="Normal">Normal</option>
                <option value="Warning">Warning</option>
                <option value="Alert">Alert</option>
              </select>

              <input
                type="text"
                placeholder="Search by ID or Name"
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />

              <button
                onClick={() => setFilters({academicYear: '', cohort: '', healthStatus: '', searchTerm: ''})}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Info</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Check</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStudents.map((student, index) => (
                    <tr key={student.studentId || index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                          <div className="text-sm text-gray-500">{student.cohort}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {student.latestFitness ? (
                          <div className="text-sm">
                            <div>BMI: {student.latestFitness.bmi || 'N/A'}</div>
                            <div>BP: {student.latestFitness.systolic || 'N/A'}/{student.latestFitness.diastolic || 'N/A'}</div>
                            <div>HR: {student.latestFitness.heartRate || 'N/A'}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No data</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthStatusColor(student.healthStatus)}`}>
                          {student.healthStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.lastCheckDate !== 'No data' ? new Date(student.lastCheckDate).toLocaleDateString() : 'No data'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => viewStudentDetail(student)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => exportSingleStudent(student)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Export
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length} results
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
        )}

        {activeTab === 'abnormalities' && (
          <AbnormalityMonitoring 
            abnormalitiesData={abnormalitiesData}
            onExport={exportAbnormalitiesReport}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsAndSettings
            onExportStudent={exportStudentHealthData}
            onExportAbnormalities={exportAbnormalitiesReport}
            onExportComprehensive={exportComprehensiveReport}
            systemSettings={systemSettings}
            onUpdateSettings={updateSystemSettings}
            onBackupData={backupData}
          />
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Student Detail - {selectedStudent.name}</h2>
              <button 
                onClick={closeStudentModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Basic Information</h3>
                <div className="space-y-2">
                  <p><strong>Student ID:</strong> {selectedStudent.studentId}</p>
                  <p><strong>Name:</strong> {selectedStudent.name}</p>
                  <p><strong>Email:</strong> {selectedStudent.email}</p>
                  <p><strong>Phone:</strong> {selectedStudent.phone}</p>
                  <p><strong>Gender:</strong> {selectedStudent.gender}</p>
                  <p><strong>Cohort:</strong> {selectedStudent.cohort}</p>
                </div>
              </div>

              {/* Health Data */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Latest Health Data</h3>
                {selectedStudent.latestFitness ? (
                  <div className="space-y-2">
                    <p><strong>Height:</strong> {selectedStudent.latestFitness.height} cm</p>
                    <p><strong>Weight:</strong> {selectedStudent.latestFitness.weight} kg</p>
                    <p><strong>BMI:</strong> {selectedStudent.latestFitness.bmi}</p>
                    <p><strong>Blood Pressure:</strong> {selectedStudent.latestFitness.systolic}/{selectedStudent.latestFitness.diastolic}</p>
                    <p><strong>Heart Rate:</strong> {selectedStudent.latestFitness.heartRate}</p>
                    <p><strong>Last Check:</strong> {new Date(selectedStudent.lastCheckDate).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No health data available</p>
                )}
              </div>

              {/* Health Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Health Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="mr-2">Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getHealthStatusColor(selectedStudent.healthStatus)}`}>
                      {selectedStudent.healthStatus}
                    </span>
                  </div>
                  <p><strong>Abnormalities Count:</strong> {selectedStudent.abnormalityCount}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => exportSingleStudent(selectedStudent)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Export Student Data
                  </button>
                  <button 
                    onClick={() => {
                      closeStudentModal();
                      toast.info('Health history view will be implemented');
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    View Health History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthDataManager;