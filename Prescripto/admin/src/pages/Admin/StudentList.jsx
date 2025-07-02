import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Search, Users, GraduationCap, Filter, User, Mail, Hash, Calendar, BookOpen, ChevronLeft, ChevronRight, X, Trash2, Phone, MapPin, FileText } from 'lucide-react';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import { useAppContext } from '../../context/AppContext';
import { generateCohortOptions } from '../../components/ModalCohort'

const StudentList = () => {
  const { backendUrl, aToken } = useContext(AdminContext);
  const { hideNavbar, showNavbar } = useAppContext();
  const [selectedCohort, setSelectedCohort] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [students, setStudents] = useState([]);
  const [availableMajors, setAvailableMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchStudentId, setSearchStudentId] = useState(''); 
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Fetch all students to extract unique majors
  const fetchAllStudents = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/students');
      if (data.success && Array.isArray(data.students)) {
        // Extract unique majors
        const uniqueMajors = [...new Set(data.students.map(s => s.major))].filter(Boolean);
        setAvailableMajors(uniqueMajors);
      }
    } catch (error) {
      console.error('Error fetching students for majors:', error);
    }
  };

  useEffect(() => {
    fetchAllStudents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      fetchStudents();
    }, searchStudentId ? 500 : 0); // 500ms delay for search, immediate for other filters
    
    setSearchTimeout(timeoutId);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedCohort, selectedMajor, searchStudentId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        backendUrl + '/api/admin/list-students',
        { cohort: selectedCohort, major: selectedMajor, studentId: searchStudentId },
        {
          headers: { aToken }
        }
      );
      if (data.success && Array.isArray(data.students)) {
        setStudents(data.students);
      } else {
        setStudents([]);
        console.warn('Invalid students data received:', data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      toast.error('Failed to fetch students. Please try again.');
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setSelectedCohort('');
    setSelectedMajor('');
    setSearchStudentId('');
  };

  const handleStudentClick = (student) => {
    if (!student || !student._id) {
      toast.error('Invalid student data');
      return;
    }
    hideNavbar();
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    showNavbar();
    setShowDetailModal(false);
    setSelectedStudent(null);
  };


  const handleDeleteStudent = async (studentId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this student?\n\nThis action cannot be undone."
    );
    
    if (!isConfirmed) return;

    try {
      const { data } = await axios.delete(backendUrl + `/api/admin/delete-student/${studentId}`, {
        headers: { aToken }
      });
      
      if (data.success) {
        setStudents(prev => prev.filter(student => student._id !== studentId));
        toast.success('Student deleted successfully!');
        handleCloseModal();
      } else {
        toast.error(data.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      if (error.response?.status === 404) {
        toast.error('Student not found');
      } else if (error.response?.status === 401) {
        toast.error('Unauthorized access');
      } else {
        toast.error('Failed to delete student. Please try again.');
      }
    }
  };

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ml-10 h-[calc(100vh-40px)] overflow-auto ">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {/* <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
          </div>
          <p className="text-gray-600">Manage and view student information across different cohorts and majors</p>
        </div> */}

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          {/* <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filter Students</h2>
          </div> */}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                value={selectedCohort}
                onChange={e => setSelectedCohort(e.target.value)}
              >
                <option value="">All Cohorts</option>
                {generateCohortOptions().map(cohort => (
                  <option key={cohort} value={cohort}>
                    {cohort}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                value={selectedMajor}
                onChange={e => setSelectedMajor(e.target.value)}
              >
                <option value="">All Majors</option>
                {availableMajors.map(major => (
                  <option key={major} value={major}>
                    {major.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by student ID..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  value={searchStudentId}
                  onChange={e => setSearchStudentId(e.target.value)}
                />
                {searchStudentId && (
                  <button
                    onClick={() => setSearchStudentId('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
           
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-20 w-full">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-600" />
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Student Results
                    {students.length > 0 && (
                      <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {students.length} student{students.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </h2>
                  {(selectedCohort || selectedMajor || searchStudentId) && (
                    <div className="flex flex-wrap gap-2 text-sm">
                      {selectedCohort && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md">
                          Cohort: {selectedCohort}
                        </span>
                      )}
                      {selectedMajor && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
                          Major: {selectedMajor.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      )}
                      {searchStudentId && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md">
                          Student ID: {searchStudentId}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-w-full">
            {loading ? (
              <div className="flex items-center justify-center py-12 w-[990px]">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Loading students...</span>
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 w-[990px]">
                <Users className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {(selectedCohort || selectedMajor || searchStudentId) 
                    ? 'No students match your search criteria' 
                    : 'No students found'
                  }
                </h3>
                <p className="text-sm text-center">
                  {(selectedCohort || selectedMajor || searchStudentId) 
                    ? 'Try adjusting your filters or search terms' 
                    : 'Try adjusting your filters or check back later'
                  }
                </p>
                {(selectedCohort || selectedMajor || searchStudentId) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        #
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Name
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Student ID
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Cohort
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Major
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentStudents.map((student, idx) => (
                    <tr 
                      key={`${student._id}-${idx}`} 
                      className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => handleStudentClick(student)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                          {indexOfFirstStudent + idx + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'N'}
                          </div>
                          <span className="font-medium text-gray-900">{student.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {student.email || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-mono">
                          {searchStudentId && student.studentId?.toLowerCase().includes(searchStudentId.toLowerCase()) ? (
                            <>
                              {student.studentId?.split(new RegExp(`(${searchStudentId})`, 'gi')).map((part, index) => 
                                part.toLowerCase() === searchStudentId.toLowerCase() ? (
                                  <mark key={index} className="bg-yellow-200 text-gray-900">{part}</mark>
                                ) : (
                                  part
                                )
                              )}
                            </>
                          ) : (
                            student.studentId || 'Not specified'
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {student.cohort ? student.cohort.charAt(0).toUpperCase() + student.cohort.slice(1) : 'Not specified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {student.major ? student.major.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Not specified'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {totalPages > 0 && (
            <div className="p-6 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center px-3 h-8 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center px-3 h-8 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && selectedStudent._id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
             onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Student Details</h3>
                    <p className="text-blue-100 text-sm">{selectedStudent.name}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Full Name:</span>
                        <p className="text-gray-800 font-medium">{selectedStudent.name || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Student ID:</span>
                        <p className="text-gray-800 font-mono">{selectedStudent.studentId || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
                        <p className="text-gray-800">
                          {selectedStudent.dob ? (() => {
                            try {
                              return new Date(selectedStudent.dob).toLocaleDateString();
                            } catch (error) {
                              return 'Invalid date';
                            }
                          })() : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Gender:</span>
                        <p className="text-gray-800">{selectedStudent.gender || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-green-600" />
                      Contact Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <p className="text-gray-800">{selectedStudent.email || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Phone:</span>
                        <p className="text-gray-800">{selectedStudent.phone || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Address:</span>
                        <div className="text-gray-800">
                          {selectedStudent.address ? (
                            (() => {
                              try {
                                const address = typeof selectedStudent.address === 'string' 
                                  ? JSON.parse(selectedStudent.address) 
                                  : selectedStudent.address;
                                return (
                                  <>
                                    <p>{address.line1 || 'Not specified'}</p>
                                    {address.line2 && (
                                      <p className="text-sm text-gray-600">{address.line2}</p>
                                    )}
                                  </>
                                );
                              } catch (error) {
                                return <p>Invalid address format</p>;
                              }
                            })()
                          ) : (
                            <p>Not specified</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                      Academic Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Cohort:</span>
                        <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {selectedStudent.cohort ? 
                            selectedStudent.cohort.charAt(0).toUpperCase() + selectedStudent.cohort.slice(1) : 
                            'Not specified'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Major:</span>
                        <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {selectedStudent.major ? 
                            selectedStudent.major.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') :
                            'Not specified'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedStudent.about && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-orange-600" />
                        About Student
                      </h4>
                      <p className="text-gray-800 leading-relaxed">{selectedStudent.about}</p>
                    </div>
                  )}

                  {selectedStudent.image && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <h4 className="font-semibold text-gray-800 mb-4">Profile Picture</h4>
                      <img 
                        src={selectedStudent.image} 
                        alt={selectedStudent.name}
                        className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Close
                </button>

                <button
                  onClick={() => handleDeleteStudent(selectedStudent._id)}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;