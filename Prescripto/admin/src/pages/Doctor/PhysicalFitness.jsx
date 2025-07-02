import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { DoctorContext } from "../../context/DoctorContext";
import * as XLSX from 'xlsx';
import { saveAs } from "file-saver";
import ImportExcelModal from "../../components/ImportExcelModal";
import EditRequestModal from "./EditRequestModal";
// Import BMI utilities đã chuẩn hóa
import { calculateBMI, getBMIClassification, isValidBMI } from "../../utils/bmiUtils";

// Utility functions for other health calculations
const calculateZScoreCC = (height) => {
  const standard = 169.9;
  const sd = 5.7;
  return height ? ((height - standard) / sd).toFixed(2) : "";
};
const calculateZScoreCN = (weight) => {
  const standard = 62.3;
  const sd = 10.2;
  return weight ? ((weight - standard) / sd).toFixed(2) : "";
};
const getDanhGiaCC = (zScore) => {
  if (!zScore) return "";
  const z = parseFloat(zScore);
  if (z < -2) return "TCN";
  if (z < -1) return "TC";
  if (z < 1) return "BT";
  return "RC";
};
const getDanhGiaCN = (zScore) => {
  if (!zScore) return "";
  const z = parseFloat(zScore);
  if (z < -3) return "NCN";
  if (z < -2) return "NC";
  if (z < 1) return "BT";
  return "NC";
};
const getDanhGiaBMI = getBMIClassification; // Sử dụng function từ bmiUtils
const getDanhGiaTTH = (systolic, diastolic) => {
  if (!systolic || !diastolic) return "";
  if (systolic < 120 || diastolic < 80) return "HAT";
  if (systolic > 140 || diastolic > 90) return "HAC";
  return "HABT";
};
const getDanhGiaHeartRate = (heartRate) => {
  if (!heartRate) return "";
  const heartRateValue = parseFloat(heartRate);
  if (heartRateValue < 60) return "NTT";
  if (heartRateValue > 100) return "NTC";
  return "NTBT";
};

// Helper function to normalize examSessionId for comparison
const normalizeExamSessionId = (id) => {
  if (!id) return "";
  if (typeof id === 'object' && id !== null) {
    return String(id._id || id.$oid || id).trim();
  }
  return String(id).trim();
};

const exportToExcel = (data, filename) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, filename);
};

export default function PhysicalFitness() {
  const { dToken } = useContext(DoctorContext);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [examSessions, setExamSessions] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [searchId, setSearchId] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [examSessionId, setExamSessionId] = useState("");
  const [autoSelected, setAutoSelected] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Lock Management States
  const [editPermission, setEditPermission] = useState({ canEdit: true, reason: '', isLocked: false });
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [selectedExamSession, setSelectedExamSession] = useState(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  const getAcademicYears = (range = 2) => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -range; i <= range; i++) {
      const start = currentYear + i;
      const end = start + 1;
      years.push(`${start}-${end}`);
    }
    return years;
  };

  // Check edit permission when examSessionId changes
  const checkEditPermission = async (sessionId) => {
    if (!sessionId) return;
    
    try {
      setIsCheckingPermission(true);
      const response = await axios.get(`${backendUrl}/api/doctor/check-edit-permission/${sessionId}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setEditPermission({
          canEdit: response.data.canEdit,
          reason: response.data.reason,
          isLocked: !response.data.canEdit && response.data.reason.includes('locked')
        });
      }
    } catch (error) {
      console.error('Error checking edit permission:', error);
      // Default to allowing edit if can't check permission
      setEditPermission({ canEdit: true, reason: '', isLocked: false });
    } finally {
      setIsCheckingPermission(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 fetchData - examSessionId:', examSessionId, 'type:', typeof examSessionId);
        
        // Check edit permission and fetch data in parallel
        const [studentsRes, fitnessRes] = await Promise.all([
          axios.get(`${backendUrl}/api/students`, { withCredentials: true }),
          axios.get(`${backendUrl}/api/doctor/physical-fitness-by-session?examSessionId=${examSessionId}`, { withCredentials: true }),
        ]);
        
        console.log('🎓 Students Response:', studentsRes.data.success, 'Count:', studentsRes.data.students?.length);
        console.log('🏃‍♂️ Fitness Response:', fitnessRes.data.success, 'Count:', fitnessRes.data.data?.length);
        console.log('🔍 First 2 fitness records:', fitnessRes.data.data?.slice(0, 2));
        
        // Check edit permission for this exam session
        await checkEditPermission(examSessionId);
        
        if (studentsRes.data.success) {
          const fitnessData = Array.isArray(fitnessRes.data.data) ? fitnessRes.data.data : [];
          
          // Debug: Show unique examSessionIds in fitness data
          const uniqueExamSessionIds = [...new Set(fitnessData.map(f => {
            let id = f.examSessionId;
            if (typeof id === 'object' && id !== null) {
              id = id._id || id.$oid || String(id);
            }
            return String(id);
          }))];
          console.log('🆔 Unique examSessionIds in fitness data:', uniqueExamSessionIds);
          console.log('🎯 Looking for examSessionId:', String(examSessionId));
          
          const newRows = studentsRes.data.students.map((s) => {
            const fit = fitnessData.find(f => {
              let fExamSessionId = f.examSessionId;
              if (typeof fExamSessionId === 'object' && fExamSessionId !== null) {
                fExamSessionId = fExamSessionId._id || fExamSessionId.$oid || String(fExamSessionId);
              }
              const sId = String(s.studentId).replace(/^['"]+|['"]+$/g, '').trim();
              const fId = String(f.studentId).replace(/^['"]+|['"]+$/g, '').trim();
              
              // Debug log to see what we're comparing
              if (sId === fId) {
                console.log('🔍 Matching student:', sId, 'examSessionIds:', String(fExamSessionId), 'vs', String(examSessionId), 'match:', String(fExamSessionId).trim() === String(examSessionId).trim());
              }
              
              return sId === fId && String(fExamSessionId).trim() === String(examSessionId).trim();
            });
            return {
              ...s,
              dob: formatDate(s.dob),
              gender: s.gender || "",
              followDate: formatDate(fit?.followDate),
              height: fit?.height || "",
              weight: fit?.weight || "",
              zScoreCC: fit?.zScoreCC || "",
              danhGiaCC: fit?.danhGiaCC || "",
              zScoreCN: fit?.zScoreCN || "",
              danhGiaCN: fit?.danhGiaCN || "",
              zScoreCNCc: fit?.zScoreCNCc || "",
              bmi: fit?.bmi || "",
              danhGiaBMI: fit?.danhGiaBMI || "",
              systolic: fit?.systolic || "",
              diastolic: fit?.diastolic || "",
              danhGiaTTH: fit?.danhGiaTTH || "",
              heartRate: fit?.heartRate || "",
              danhGiaHeartRate: fit?.danhGiaHeartRate || "",
            };
          });
          
          console.log('📊 Final rows with fitness data:', newRows.filter(r => r.height).length, 'out of', newRows.length);
          setRows(newRows);
          setFilteredRows(newRows);
          const uniqueClasses = [...new Set(newRows.map(row => row.cohort))].filter(Boolean);
          setClasses(uniqueClasses);
          const uniqueMajors = [...new Set(newRows.map(row => row.major))].filter(Boolean);
          setMajors(uniqueMajors);
        }
      } catch (err) {
        console.error('❌ fetchData error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (examSessionId) {
      fetchData();
    }
  }, [examSessionId]);

  // Reset page to 1 only when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedClass, selectedMajor, searchId]);

  // Apply filters when rows or filter criteria change
  useEffect(() => {
    let filtered = [...rows];
    if (selectedYear) {
      filtered = filtered.filter(row => row.cohort?.includes(selectedYear));
    }
    if (selectedClass) {
      filtered = filtered.filter(row => row.cohort === selectedClass);
    }
    if (selectedMajor) {
      filtered = filtered.filter(row => row.major === selectedMajor);
    }
    if (searchId.trim()) {
      filtered = filtered.filter(row => {
        const studentId = String(row.studentId || '').toLowerCase();
        const searchTerm = searchId.toLowerCase().trim();
        return studentId.includes(searchTerm);
      });
    }
    setFilteredRows(filtered);
  }, [rows, selectedYear, selectedClass, selectedMajor, searchId]);

  const exportColumns = [
    "studentId", "name", "gender", "cohort", "dob", "followDate",
    "height", "weight", "systolic", "diastolic", "heartRate"
  ];
  const exportData = filteredRows.map((row) => {
       const obj = {}
       exportColumns.forEach(col => {
          obj[col] = row[col]
       })
       return obj
    });
    
  function excelSerialDateToISO(serial) {
    if (!serial || isNaN(serial)) return "";
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().slice(0, 10);
  }

  const formatDate = (value) => {
    if (!value) return "";
    const sValue = String(value);
    // Excel dates are numbers and don't contain typical date string characters.
    if (!isNaN(value) && !sValue.includes('-') && !sValue.includes('/') && sValue.trim() !== '') {
      return excelSerialDateToISO(value);
    }
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
    return "";
  };

  const handleChange = (rowId, field, value) => {
    const newRows = rows.map(row => {
      if (row._id === rowId) {
        const updatedRow = { ...row, [field]: value };
        const height = parseFloat(updatedRow.height) || 0;
        const weight = parseFloat(updatedRow.weight) || 0;
        updatedRow.zScoreCC = calculateZScoreCC(height);
        updatedRow.danhGiaCC = getDanhGiaCC(updatedRow.zScoreCC);
        updatedRow.zScoreCN = calculateZScoreCN(weight);
        updatedRow.danhGiaCN = getDanhGiaCN(updatedRow.zScoreCN);
        updatedRow.bmi = calculateBMI(weight, height);
        updatedRow.danhGiaBMI = getDanhGiaBMI(updatedRow.bmi);
        updatedRow.danhGiaTTH = getDanhGiaTTH(updatedRow.systolic, updatedRow.diastolic);
        updatedRow.danhGiaHeartRate = getDanhGiaHeartRate(updatedRow.heartRate);
        updatedRow.zScoreCNCc =
          updatedRow.zScoreCN && updatedRow.zScoreCC
            ? (parseFloat(updatedRow.zScoreCN) - parseFloat(updatedRow.zScoreCC)).toFixed(2)
            : "";
        return updatedRow;
      }
      return row;
    });
    setRows(newRows);
  };

  const handleSave = async (rowId) => {
    try {
      const rowToSave = rows.find(r => r._id === rowId);
      if (!rowToSave) {
        toast.error("Could not find row to save.");
        return;
      }
      const stt = filteredRows.findIndex(r => r._id === rowId) + 1;
      const response = await axios.post(`${backendUrl}/api/doctor/physical-fitness`, {
        stt,
        studentId: rowToSave.studentId,
        examSessionId: examSessionId,
        cohort: rowToSave.cohort,
        gender: rowToSave.gender,
        followDate: rowToSave.followDate,
        height: rowToSave.height,
        weight: rowToSave.weight,
        zScoreCC: rowToSave.zScoreCC,
        danhGiaCC: rowToSave.danhGiaCC,
        zScoreCN: rowToSave.zScoreCN,
        danhGiaCN: rowToSave.danhGiaCN,
        zScoreCNCc: rowToSave.zScoreCNCc,
        bmi: rowToSave.bmi,
        danhGiaBMI: rowToSave.danhGiaBMI,
        systolic: rowToSave.systolic,
        diastolic: rowToSave.diastolic,
        danhGiaTTH: rowToSave.danhGiaTTH,
        heartRate: rowToSave.heartRate,
        danhGiaHeartRate: rowToSave.danhGiaHeartRate,
      });
      toast.success(response.data.message);
    } catch (err) {
      toast.error("Error saving data: " + (err.response?.data?.message || err.message));
    }
  };

  const refreshData = async () => {
    try {
      console.log('🔄 Refreshing data for examSessionId:', examSessionId);
      const [studentsRes, fitnessRes] = await Promise.all([
        axios.get(`${backendUrl}/api/students`, { withCredentials: true }),
        axios.get(`${backendUrl}/api/doctor/physical-fitness-by-session?examSessionId=${examSessionId}`, { withCredentials: true }),
      ]);
      
      console.log('🎓 Students Response:', studentsRes.data.success, 'Count:', studentsRes.data.students?.length);
      console.log('🏃‍♂️ Fitness Response:', fitnessRes.data.success, 'Count:', fitnessRes.data.data?.length);
      
      if (studentsRes.data.success) {
        const fitnessData = Array.isArray(fitnessRes.data.data) ? fitnessRes.data.data : [];
        console.log('🔍 First fitness record sample:', fitnessData[0]);
        
        const newRows = studentsRes.data.students.map((s) => {
          const fit = fitnessData.find(f => {
            let fExamSessionId = f.examSessionId;
            if (typeof fExamSessionId === 'object' && fExamSessionId !== null) {
              fExamSessionId = fExamSessionId._id || fExamSessionId.$oid || String(fExamSessionId);
            }
            const sId = String(s.studentId).replace(/^['"]+|['"]+$/g, '').trim();
            const fId = String(f.studentId).replace(/^['"]+|['"]+$/g, '').trim();
            
            // Debug log to see what we're comparing
            if (sId === fId) {
              console.log('🔍 Matching student:', sId, 'examSessionIds:', String(fExamSessionId), 'vs', String(examSessionId));
            }
            
            return sId === fId && String(fExamSessionId).trim() === String(examSessionId).trim();
          });
          return {
            ...s,
            dob: formatDate(s.dob),
            gender: s.gender || "",
            followDate: formatDate(fit?.followDate),
            height: fit?.height || "",
            weight: fit?.weight || "",
            zScoreCC: fit?.zScoreCC || "",
            danhGiaCC: fit?.danhGiaCC || "",
            zScoreCN: fit?.zScoreCN || "",
            danhGiaCN: fit?.danhGiaCN || "",
            zScoreCNCc: fit?.zScoreCNCc || "",
            bmi: fit?.bmi || "",
            danhGiaBMI: fit?.danhGiaBMI || "",
            systolic: fit?.systolic || "",
            diastolic: fit?.diastolic || "",
            danhGiaTTH: fit?.danhGiaTTH || "",
            heartRate: fit?.heartRate || "",
            danhGiaHeartRate: fit?.danhGiaHeartRate || "",
          };
        });
        
        console.log('📊 Final rows with fitness data:', newRows.filter(r => r.height).length, 'out of', newRows.length);
        setRows(newRows);
        setFilteredRows(newRows);
        const uniqueClasses = [...new Set(newRows.map(row => row.cohort))].filter(Boolean);
        setClasses(uniqueClasses);
        const uniqueMajors = [...new Set(newRows.map(row => row.major))].filter(Boolean);
        setMajors(uniqueMajors);
      }
    } catch (error) {
      console.error('❌ Refresh data error:', error);
      toast.error('Error refreshing data');
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    const fetchExamSessions = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/doctor/list-exam-sessions`, {
          withCredentials: true
        });
        if (res.data.success) {
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
        }
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      }
    };
    fetchExamSessions();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-white bg-opacity-70">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-lg text-blue-600 font-semibold animate-pulse">Loading...</div>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }


  return (
    <div className='w-full max-w-6xl m-5'>
      <ImportExcelModal
        open={isModalOpen}
        onClose={(shouldRefresh) => {
            setIsModalOpen(false);
            if (shouldRefresh) {
                refreshData();
            }
        }}
        type="physical-fitness"
        examSessionId={examSessionId}
        templateUrl={"/example_phys_randomized.xlsx"}
      />
      <div className="scale-[0.75] origin-top-left w-[133.33%] px-8">
        <div className="mb-6 flex flex-wrap gap-6 items-center justify-center bg-[#f8fafc] rounded-xl py-4 px-8 shadow-sm border border-[#e5e7eb]">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-base">Academic Year:</label>
            <select
              value={examSessionId}
              onChange={(e) => setExamSessionId(e.target.value)}
              className="border rounded px-3 py-1.5 min-w-[120px]"
            >
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
          <div className="flex items-center gap-2">
            <label className="font-semibold text-base">Class:</label>
            <select
              className="border rounded px-3 py-1.5 min-w-[120px]"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">All</option>
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
          <div className="flex items-center gap-2">
            <label className="font-semibold text-base">Major:</label>
            <select
              className="border rounded px-3 py-1.5 min-w-[120px]"
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
            >
              <option value="">All</option>
              {majors
                .slice()
                .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
                .map(major => (
                  <option key={major} value={major}>{major}</option>
                ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-semibold text-base">Search:</label>
            <input
              type="text"
              placeholder="Enter student ID..."
              className="border rounded px-3 py-1.5 min-w-[200px]"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                console.log('Debug - Opening import modal with examSessionId:', examSessionId);
                console.log('Debug - examSessionId type:', typeof examSessionId);
                if (!examSessionId || examSessionId === '' || examSessionId === 'No exam session') {
                  toast.error('Please select an academic year first!');
                  return;
                }
                setIsModalOpen(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded"
              disabled={loading || !examSessionId}
            >
              Import Excel
            </button>
            <button
              onClick={() => exportToExcel(exportData,  `physical_fitness_${examSessionId}.xlsx`)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded"
              disabled={!examSessionId}
            >
              Export Excel
            </button>
            
            {/* Only show Edit Request button when exam session is locked */}
            {editPermission.isLocked && (
              <button
                onClick={() => setShowEditRequestModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded flex items-center gap-2"
                disabled={!examSessionId || isCheckingPermission}
              > 
                {isCheckingPermission ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Checking...
                  </>
                ) : (
                  <>
                    🔒 Edit Request
                  </>
                )}
              </button>
            )}
            
            {/* Show lock status indicator */}
            {editPermission.isLocked && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-1.5 rounded text-sm">
                <span className="flex items-center gap-1">
                  🔒 Session Locked
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#f6f7fa] p-6 rounded-xl overflow-hidden mx-auto max-w-[1400px]">
          <div className="overflow-x-auto" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table className="min-w-[1700px] w-full border-separate border-spacing-0 bg-white rounded-lg border border-[#eee]">
              <thead>
                <tr className="sticky top-0 z-20 bg-white shadow">
                  <th className="min-w-[80px] text-center align-middle py-2 sticky left-0 z-30 bg-white border-r border-[#eee]">STT</th>
                  <th className="min-w-[120px] text-center align-middle py-2 sticky left-[80px] z-30 bg-white border-r border-[#eee]">Student ID</th>
                  <th className="min-w-[120px] text-center align-middle py-2 sticky left-[200px] z-30 bg-white border-r border-[#eee]">Name</th>
                  <th className="min-w-[80px] text-center align-middle py-2 sticky left-[320px] z-30 bg-white border-r border-[#eee]">Gender</th>
                  <th className="min-w-[100px] text-center align-middle py-2 sticky left-[400px] z-30 bg-white border-r border-[#eee]">Class</th>
                  <th className="min-w-[120px] text-center align-middle py-2 border-r border-[#eee]">Date of birth</th>
                  <th className="min-w-[120px] text-center align-middle py-2 border-r border-[#eee]">Follow Date</th>
                  <th className="min-w-[120px] text-center align-middle py-2 border-r border-[#eee]">Height (cm)</th>
                  <th className="min-w-[100px] text-center align-middle py-2 border-r border-[#eee]">Z-score CC</th>
                  <th className="min-w-[100px] text-center align-middle py-2 border-r border-[#eee]">CC Eval</th>
                  <th className="min-w-[120px] text-center align-middle py-2 border-r border-[#eee]">Weight (kg)</th>
                  <th className="min-w-[100px] text-center align-middle py-2 border-r border-[#eee]">Z-score CN</th>
                  <th className="min-w-[100px] text-center align-middle py-2 border-r border-[#eee]">CN Eval</th>
                  <th className="min-w-[120px] text-center align-middle py-2 border-r border-[#eee]">Z-score CN</th>
                  <th className="min-w-[120px] text-center align-middle py-2 border-r border-[#eee]">BMI</th>
                  <th className="min-w-[100px] text-center align-middle py-2 border-r border-[#eee]">BMI Eval</th>
                  <th className="min-w-[80px] text-center align-middle py-2 border-r border-[#eee]">Systolic</th>
                  <th className="min-w-[80px] text-center align-middle py-2 border-r border-[#eee]">Diastolic</th>
                  <th className="min-w-[80px] text-center align-middle py-2 border-r border-[#eee]">TTH Eval</th>
                  <th className="min-w-[90px] text-center align-middle py-2 border-r border-[#eee]">Heart Rate</th>
                  <th className="min-w-[90px] text-center align-middle py-2 border-r border-[#eee]">HR Eval</th>
                  <th className="min-w-[80px] text-center align-middle py-2"></th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, idx) => (
                  <tr key={row._id || idx} className="even:bg-[#f6f7fa]">
                    <td className="text-center align-middle py-2 sticky left-0 z-20 bg-white border-r border-[#eee]">{indexOfFirstRow + idx + 1}</td>
                    <td className="text-center align-middle py-2 sticky left-[80px] z-20 bg-white border-r border-[#eee]">{row.studentId}</td>
                    <td className="text-center align-middle py-2 sticky left-[200px] z-20 bg-white border-r border-[#eee]">{row.name}</td>
                    <td className="text-center align-middle py-2 sticky left-[320px] z-20 bg-white border-r border-[#eee]">{row.gender}</td>
                    <td className="text-center align-middle py-2 sticky left-[400px] z-20 bg-white border-r border-[#eee]">{row.cohort}</td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">{row.dob}</td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">
                      <input
                        type="date"
                        className="w-[120px] border rounded px-2 py-1"
                        value={row.followDate}
                        onChange={(e) => handleChange(row._id, "followDate", e.target.value)}
                        disabled={editPermission.isLocked}
                      />
                    </td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">
                      <input
                        type="number"
                        className="w-[80px] border rounded px-2 py-1"
                        value={row.height}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleChange(row._id, "height", Number(value) < 0 ? 0 : value);
                        }}
                        disabled={editPermission.isLocked}
                      />
                    </td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">{row.zScoreCC}</td>
                    <td className={`text-center align-middle py-2 border-r border-[#eee] ${row.danhGiaCC === "TCN" || row.danhGiaCC === "TCV" ? "text-red-500" : "text-blue-600"}`}>{row.danhGiaCC}</td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">
                      <input
                        type="number"
                        className="w-[80px] border rounded px-2 py-1"
                        value={row.weight}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleChange(row._id, "weight", Number(value) < 0 ? 0 : value);
                        }}
                        disabled={editPermission.isLocked}
                      />
                    </td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">{row.zScoreCN}</td>
                    <td className={`text-center align-middle py-2 border-r border-[#eee] ${row.danhGiaCN === "NCN" || row.danhGiaCN === "NCV" ? "text-red-500" : "text-blue-600"}`}>{row.danhGiaCN}</td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">{row.zScoreCNCc}</td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">{row.bmi}</td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">{row.danhGiaBMI}</td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">
                      <input
                        type="number"
                        className="w-[70px] border rounded px-2 py-1"
                        value={row.systolic}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleChange(row._id, "systolic", Number(value) < 0 ? 0 : value);
                        }}
                        disabled={editPermission.isLocked}
                      />
                    </td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">
                      <input
                        type="number"
                        className="w-[70px] border rounded px-2 py-1"
                        value={row.diastolic}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleChange(row._id, "diastolic", Number(value) < 0 ? 0 : value);
                        }}
                        disabled={editPermission.isLocked}
                      />
                    </td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">{row.danhGiaTTH}</td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">
                      <input
                        type="number"
                        className="w-[70px] border rounded px-2 py-1"
                        value={row.heartRate}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleChange(row._id, "heartRate", Number(value) < 0 ? 0 : value);
                        }}
                        disabled={editPermission.isLocked}
                      />
                    </td>
                    <td className="text-center align-middle py-2 border-r border-[#eee]">{row.danhGiaHeartRate}</td>
                    <td className="text-center align-middle py-2">
                      <button
                        className={`px-3 py-1 rounded text-white ${
                          editPermission.isLocked 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        onClick={() => handleSave(row._id)}
                        disabled={editPermission.isLocked}
                        title={editPermission.isLocked ? 'Session is locked. Request edit access to make changes.' : 'Save changes'}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>  
        </div>
      </div>
      <EditRequestModal
        isOpen={showEditRequestModal}
        onClose={() => setShowEditRequestModal(false)}
        examSessionId={examSessions.find(session => session._id === examSessionId) || { _id: examSessionId }}
        onRequestSent={() => {
          setShowEditRequestModal(false);
          refreshData();
        }}
      />
    </div>
  );
}