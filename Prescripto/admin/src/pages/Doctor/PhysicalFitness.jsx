import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

// Utility functions for calculations
const calculateZScoreCC = (height) => {
  const standard = 169.9; // Average height
  const sd = 5.7; // Standard deviation
  return height ? ((height - standard) / sd).toFixed(2) : "";
};

const calculateZScoreCN = (weight) => {
  const standard = 62.3; // Average weight
  const sd = 10.2; // Standard deviation
  return weight ? ((weight - standard) / sd).toFixed(2) : "";
};

const calculateBMI = (weight, height) => {
  if (!weight || !height) return "";
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(2);
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

const getDanhGiaBMI = (bmi) => {
  if (!bmi) return "";
  const bmiValue = parseFloat(bmi);
  if (bmiValue < 18.5) return "G";
  if (bmiValue < 22.9) return "BT";
  if (bmiValue < 24.9) return "TC";
  if (bmiValue < 29.9) return "BP I";
  if (bmiValue < 30) return "BP II";
  return "BP III";
};

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

export default function PhysicalFitness() {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchId, setSearchId] = useState("");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10; 

  const academicYears = ["2023-2024", "2024-2025", "2025-2026"];

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [studentsRes, fitnessRes] = await Promise.all([
          axios.get("http://localhost:9000/api/students"),
          axios.get("http://localhost:9000/api/doctor/get-physical-fitness")
        ]);

        if (studentsRes.data.success) {
          const fitnessData = fitnessRes.data.data;
          const newRows = studentsRes.data.students.map((s) => {
            const fit = fitnessData.find(f => String(f.studentId) === String(s.studentId));
            return {
              ...s, 
              dob: s.dob && !isNaN(s.dob) ? excelSerialDateToISO(s.dob) : s.dob || "",
              gender: s.gender || "",
              followDate: fit?.followDate && !isNaN(fit.followDate) ? excelSerialDateToISO(fit.followDate) : fit?.followDate || "",
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

          setRows(newRows);
          setFilteredRows(newRows);
          const uniqueClasses = [...new Set(newRows.map(row => row.cohort))].filter(Boolean);
          setClasses(uniqueClasses);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter rows based on selected criteria
  useEffect(() => {
    let filtered = [...rows];

    if (selectedYear) {
      filtered = filtered.filter(row => row.cohort?.includes(selectedYear));
    }

    if (selectedClass) {
      filtered = filtered.filter(row => row.cohort === selectedClass);
    }

    if (searchId.trim()) {
      filtered = filtered.filter(row => {
        const studentId = String(row.studentId || '').toLowerCase();
        const searchTerm = searchId.toLowerCase().trim();
        return studentId.includes(searchTerm);
      });
    }

    setFilteredRows(filtered);
    setCurrentPage(1); // Reset về trang 1 khi filter
  }, [selectedYear, selectedClass, searchId, rows]);

  function excelSerialDateToISO(serial) {
    if (!serial || isNaN(serial)) return "";
    // Excel serial date: 1/1/1900 is 1, JS Date: 1/1/1970 is 0
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400; // seconds
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().slice(0, 10);
  }

  // Handle input changes and recalculate values
  const handleChange = (idx, field, value) => {
    const newRows = [...rows];
    newRows[idx][field] = value;

    const height = parseFloat(newRows[idx].height) || 0;
    const weight = parseFloat(newRows[idx].weight) || 0;

    // Chỉ tính lại các chỉ số khi người dùng chỉnh sửa
    newRows[idx].zScoreCC = calculateZScoreCC(height);
    newRows[idx].danhGiaCC = getDanhGiaCC(newRows[idx].zScoreCC);
    newRows[idx].zScoreCN = calculateZScoreCN(weight);
    newRows[idx].danhGiaCN = getDanhGiaCN(newRows[idx].zScoreCN);
    newRows[idx].bmi = calculateBMI(weight, height);
    newRows[idx].danhGiaBMI = getDanhGiaBMI(newRows[idx].bmi);
    newRows[idx].danhGiaTTH = getDanhGiaTTH(newRows[idx].systolic, newRows[idx].diastolic);
    newRows[idx].danhGiaHeartRate = getDanhGiaHeartRate(newRows[idx].heartRate);
    newRows[idx].zScoreCNCc =
      newRows[idx].zScoreCN && newRows[idx].zScoreCC
        ? (parseFloat(newRows[idx].zScoreCN) - parseFloat(newRows[idx].zScoreCC)).toFixed(2)
        : "";

    setRows(newRows);
  };

  // Save individual row data
  const handleSave = async (idx) => {
    try {
      const row = rows[idx];
      const response = await axios.post("http://localhost:9000/api/doctor/physical-fitness", {
        stt: indexOfFirstRow + idx + 1,
        studentId: row.studentId  ,
        gender: row.gender,
        followDate: row.followDate,
        height: row.height,
        weight: row.weight,
        zScoreCC: row.zScoreCC,
        danhGiaCC: row.danhGiaCC,
        zScoreCN: row.zScoreCN,
        danhGiaCN: row.danhGiaCN,
        zScoreCNCc: row.zScoreCNCc,
        bmi: row.bmi,
        danhGiaBMI: row.danhGiaBMI,
        systolic: row.systolic,
        diastolic: row.diastolic,
        danhGiaTTH: row.danhGiaTTH,
        heartRate: row.heartRate,
        danhGiaHeartRate: row.danhGiaHeartRate,
      });

      alert(response.data.message);
    } catch (err) {
      alert("Error saving data: " + (err.response?.data?.message || err.message));
    }
  };

  // Handle Excel import
  const handleImportExcel = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) {
      alert('Please select an Excel file!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:9000/api/doctor/import-physical-fitness-excel',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      // Sau khi import thành công, lấy dữ liệu mới
      const [studentsRes, fitnessRes] = await Promise.all([
        axios.get("http://localhost:9000/api/students"),
        axios.get("http://localhost:9000/api/doctor/get-physical-fitness")
      ]);

      if (studentsRes.data.success) {
        const fitnessData = fitnessRes.data.data;
        const newRows = studentsRes.data.students.map((s) => {
          const fit = fitnessData.find(f => String(f.studentId) === String(s.studentId));
          return {
            ...s,
            dob: s.dob && !isNaN(s.dob) ? excelSerialDateToISO(s.dob) : s.dob || "",
            gender: s.gender || "",
            followDate: fit?.followDate && !isNaN(fit.followDate) ? excelSerialDateToISO(fit.followDate) : fit?.followDate || "",
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

        setRows(newRows);
        setFilteredRows(newRows);
        const uniqueClasses = [...new Set(newRows.map(row => row.cohort))].filter(Boolean);
        setClasses(uniqueClasses);
      }

      alert(response.data.message);
    } catch (err) {
      alert('Import error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Tính toán dữ liệu cho trang hiện tại
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  // Chuyển trang
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  return (
    <div className='w-full max-w-6xl m-5'>
    <div className="scale-[0.75] origin-top-left w-[133.33%] px-8">
      {/* <h2 className="mb-6 font-extrabold text-3xl text-gray-800 tracking-tight text-center pt-8">
        Tracking Student's Physical Fitness
      </h2> */}

      {/* Filter Section */}
      <div className="mb-6 flex flex-wrap gap-6 items-center justify-center bg-[#f8fafc] rounded-xl py-4 px-8 shadow-sm border border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          <label className="font-semibold text-base">Academic Year:</label>
          <select
            className="border rounded px-3 py-1.5 min-w-[120px]"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">All</option>
            {academicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
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
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
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
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            className="border rounded px-3 py-1.5"
          />
          <button
            onClick={handleImportExcel}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded"
            disabled={loading}
          >
            Import Excel
          </button>
        </div>
      </div>

      <div className="bg-[#f6f7fa] p-6 rounded-xl overflow-hidden mx-auto max-w-[1400px]">
        <div className="overflow-x-auto" style={{maxHeight: '500px', overflowY: 'auto' }}>
          <table className="min-w-[1700px] w-full border-separate border-spacing-0 bg-white rounded-lg border border-[#eee]">
            <thead>
              <tr className="sticky top-0 z-20 bg-white shadow">
                <th className="min-w-[80px] text-center align-middle py-2 sticky left-0 z-10 bg-white border-r border-[#eee]">STT</th>
                <th className="min-w-[120px] text-center align-middle py-2 sticky left-0 z-10 bg-white border-r border-[#eee]">Student ID</th>
                <th className="min-w-[120px] text-center align-middle py-2 sticky left-[120px] z-10 bg-white border-r border-[#eee]">Name</th>
                <th className="min-w-[80px] text-center align-middle py-2 sticky left-[240px] z-10 bg-white border-r border-[#eee]">Gender</th>
                <th className="min-w-[100px] text-center align-middle py-2 sticky left-[320px] z-10 bg-white border-r border-[#eee]">Class</th>
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
                  <td className="text-center align-middle py-2 sticky left-0 z-10 bg-white border-r border-[#eee]">{indexOfFirstRow + idx + 1}</td>
                  <td className="text-center align-middle py-2 sticky left-0 z-10 bg-white border-r border-[#eee]">{row.studentId}</td>
                  <td className="text-center align-middle py-2 sticky left-[120px] z-10 bg-white border-r border-[#eee]">{row.name}</td>
                  <td className="text-center align-middle py-2 sticky left-[240px] z-10 bg-white border-r border-[#eee]">{row.gender}</td>
                  <td className="text-center align-middle py-2 sticky left-[320px] z-10 bg-white border-r border-[#eee]">{row.cohort}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{row.dob}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">
                    <input
                      type="date"
                      className="w-[120px] border rounded px-2 py-1"
                      value={row.followDate}
                      onChange={(e) => handleChange(idx, "followDate", e.target.value)}
                    />
                  </td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">
                    <input
                      type="number"
                      className="w-[80px] border rounded px-2 py-1"
                      value={row.height}
                      onChange={(e) => handleChange(idx, "height", e.target.value)}
                    />
                  </td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{row.zScoreCC}</td>
                  <td className={`text-center align-middle py-2 border-r border-[#eee] ${row.danhGiaCC === "TCN" || row.danhGiaCC === "TCV" ? "text-red-500" : "text-blue-600"}`}>{row.danhGiaCC}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">
                    <input
                      type="number"
                      className="w-[80px] border rounded px-2 py-1"
                      value={row.weight}
                      onChange={(e) => handleChange(idx, "weight", e.target.value)}
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
                      onChange={(e) => handleChange(idx, "systolic", e.target.value)}
                    />
                  </td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">
                    <input
                      type="number"
                      className="w-[70px] border rounded px-2 py-1"
                      value={row.diastolic}
                      onChange={(e) => handleChange(idx, "diastolic", e.target.value)}
                    />
                  </td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{row.danhGiaTTH}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">
                    <input
                      type="number"
                      className="w-[70px] border rounded px-2 py-1"
                      value={row.heartRate}
                      onChange={(e) => handleChange(idx, "heartRate", e.target.value)}
                    />
                  </td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{row.danhGiaHeartRate}</td>
                  <td className="text-center align-middle py-2">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                      onClick={() => handleSave(idx)}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination controls */}
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
    </div>
  );
}