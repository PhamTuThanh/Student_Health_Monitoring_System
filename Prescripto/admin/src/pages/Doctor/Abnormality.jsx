import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Abnormality() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [abnormalMap, setAbnormalMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:9000/api/students').then((res) => {
       // console.log('STUDENTS:', res.data);
      if (res.data.success) {
        setStudents(res.data.students);
        setFiltered(res.data.students);
        setYears([...new Set(res.data.students.map(s => s.year))].filter(Boolean));
        setClasses([...new Set(res.data.students.map(s => s.cohort))].filter(Boolean));
      }
    });
    // Lấy danh sách abnormality
    axios.get('http://localhost:9000/api/doctor/abnormality').then((res) => {
      // Tạo map studentId => true nếu đã nhập bất thường
      const map = {};
      res.data.data.forEach(a => {
        map[a.studentId] = true;
      });
      setAbnormalMap(map);  
    });
  }, []);

  useEffect(() => {
    let data = [...students];
    if (selectedYear) data = data.filter(s => s.year === selectedYear);
    if (selectedClass) data = data.filter(s => s.cohort === selectedClass);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.studentId?.toLowerCase().includes(q)
      );
    }
    setFiltered(data);
    setCurrentPage(1); // Reset về trang 1 khi filter
  }, [selectedYear, selectedClass, search, students]);

  // Phân trang
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const handleInput = (student) => {
    navigate(`/doctor/abnormality/${student._id}`, { state: { student } });
  };

  return (
    <div className='w-full max-w-6xl m-5'>
    <div className="scale-[0.75] origin-top-left w-[133.33%] px-8">
      {/* <h2 className="mb-6 font-extrabold text-3xl text-gray-800 tracking-tight text-center">Abnormality Management</h2> */}
      {/* Filter Section */}
      <div className="mb-6 flex flex-wrap gap-6 items-center justify-center bg-[#f8fafc] rounded-xl py-4 px-8 shadow-sm border border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          <label className="font-semibold text-base">Year:</label>
          <select
            className="border rounded px-3 py-1.5 min-w-[120px]"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
          >
            <option value="">All</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-semibold text-base">Cohort:</label>
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
          <label className="font-semibold text-base">Search:</label>
          <input
            type="text"
            placeholder="Enter name or student ID..."
            className="border rounded px-3 py-1.5 min-w-[200px]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="bg-[#f6f7fa] p-6 rounded-xl overflow-hidden mx-auto max-w-[1400px]">
        <div className="overflow-x-auto" style={{maxHeight: '500px',   overflowY: 'auto' }}>
          <table className="min-w-[1200px] w-full border-separate border-spacing-0 bg-white rounded-lg border border-[#eee]">
            <thead>
              <tr>
                <th className="min-w-[60px] text-center align-middle py-2 border-r border-[#eee]">ID</th>
                <th className="min-w-[60px] text-center align-middle py-2 border-r border-[#eee]">Student ID</th>
                <th className="min-w-[180px] text-center align-middle py-2 border-r border-[#eee]">Name</th>
                <th className="min-w-[80px] text-center align-middle py-2 border-r border-[#eee]">Gender</th>
                <th className="min-w-[100px] text-center align-middle py-2 border-r border-[#eee]">Cohort</th>
                <th className="min-w-[120px] text-center align-middle py-2 border-r border-[#eee]">Major</th>
                <th className="min-w-[120px] text-center align-middle py-2 border-r border-[#eee]">Date of birth</th>
                <th className="min-w-[200px] text-center align-middle py-2 border-r border-[#eee]">Address</th>
                <th className="min-w-[100px] text-center align-middle py-2 border-r border-[#eee]">Status</th>
                <th className="min-w-[100px] text-center align-middle py-2 border-r border-[#eee]"></th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, idx) => (
                <tr key={row._id || idx} className="even:bg-[#f6f7fa]">
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{indexOfFirstRow + idx + 1}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{row.studentId}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{row.name}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{row.gender}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{row.cohort}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{row.major}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{row.dob}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">{row.address.line1} {row.address.line2}</td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">
                    {abnormalMap[row.studentId] ? (
                      <span className="text-green-600 font-semibold">Entered</span>
                    ) : (
                      <span className="text-red-500 font-semibold">Not entered</span>
                    )}
                  </td>
                  <td className="text-center align-middle py-2 border-r border-[#eee]">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                      onClick={() => handleInput(row)}>Enter</button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination controls */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => setCurrentPage(currentPage + 1)}
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