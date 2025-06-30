import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';

const ExamSessionManager = () => {
    const { aToken } = useContext(AdminContext);
    
    const [examSessions, setExamSessions] = useState([]);
    const [editRequests, setEditRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('sessions');
    const [loading, setLoading] = useState(true);
    const [showLockModal, setShowLockModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [lockReason, setLockReason] = useState('');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [tempUnlockHours, setTempUnlockHours] = useState(24);

    // Load exam sessions with data
    const loadExamSessions = async () => {
        try {
            console.log('Loading exam sessions...');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/exam-sessions-data`, {
                credentials: 'include'
            });
            
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            
            if (response.status === 401 || response.status === 403) {
                toast.error('Authentication failed. Please login again.');
                return;
            }
            
            if (data.success) {
                setExamSessions(data.examSessions);
            } else {
                toast.error(data.message || 'Failed to load exam sessions');
            }
        } catch (error) {
            console.error('Load exam sessions error:', error);
            toast.error('Failed to load exam sessions');
        }
    };

    // Load edit requests
    const loadEditRequests = async () => {
        try {
            console.log('Loading edit requests...');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/edit-requests`, {
                credentials: 'include'
            });
            
            console.log('Edit requests response status:', response.status);
            const data = await response.json();
            console.log('Edit requests data:', data);
            
            if (response.status === 401 || response.status === 403) {
                toast.error('Authentication failed. Please login again.');
                return;
            }
            
            if (data.success) {
                setEditRequests(data.editRequests);
                console.log('Edit requests loaded:', data.editRequests);
                // Debug: Check first request structure
                if (data.editRequests && data.editRequests.length > 0) {
                    console.log('First request structure:', data.editRequests[0]);
                    console.log('First request.requestedBy:', data.editRequests[0].requestedBy);
                }
            } else {
                toast.error(data.message || 'Failed to load edit requests');
            }
        } catch (error) {
            console.error('Load edit requests error:', error);
            toast.error('Failed to load edit requests');
        }
    };

    // Toggle exam session lock
    const toggleLock = async (session) => {
        if (!session.isLocked && !lockReason.trim()) {
            toast.error('Please provide a reason for locking');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/toggle-exam-session-lock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    examSessionId: session._id,
                    isLocked: !session.isLocked,
                    lockReason: !session.isLocked ? lockReason : null
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                toast.success(data.message);
                setShowLockModal(false);
                setSelectedSession(null);
                setLockReason('');
                loadExamSessions();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update lock status');
        }
    };

    // Handle edit request (approve/reject)
    const handleEditRequest = async (action) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/handle-edit-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    requestId: selectedRequest._id,
                    action: action,
                    adminResponse: adminResponse,
                    tempUnlockHours: action === 'approve' ? tempUnlockHours : null
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                toast.success(data.message);
                setShowRequestModal(false);
                setSelectedRequest(null);
                setAdminResponse('');
                loadEditRequests();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to process request');
        }
    };

    useEffect(() => {
        if (aToken) {
            const loadData = async () => {
                setLoading(true);
                await Promise.all([loadExamSessions(), loadEditRequests()]);
                setLoading(false);
            };
            loadData();
        } else {
            setLoading(false);
            toast.error('Please login as admin to access this page');
        }
    }, [aToken]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
            approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
            rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
            cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 h-[calc(100vh-80px)] overflow-y-auto ml-10 w-[1000px]">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-[950px]">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600">🔒</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage Exam Sessions</h1>
                        <p className="text-gray-600">Manage the status of locked and edit requests of exam sessions</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('sessions')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'sessions'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span className="flex items-center space-x-2">
                                <span>📋</span>
                                <span>Exam Sessions ({examSessions.length})</span>
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'requests'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span className="flex items-center space-x-2">
                                <span>📝</span>
                                <span>Edit Requests ({editRequests.filter(r => r.status === 'pending').length})</span>
                                {editRequests.filter(r => r.status === 'pending').length > 0 && (
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                                        {editRequests.filter(r => r.status === 'pending').length}
                                    </span>
                                )}
                            </span>
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Exam Sessions Tab */}
                    {activeTab === 'sessions' && (
                        <div className="space-y-4">
                            {examSessions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-5xl mb-4">📋</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No exam sessions</h3>
                                    <p className="text-gray-500">Exam sessions will be displayed here when data is available</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {examSessions.map((session) => (
                                        <div key={session._id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-3">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {session.examSessionName}
                                                        </h3>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            session.isLocked 
                                                                ? 'bg-red-100 text-red-800 border border-red-200'
                                                                : 'bg-green-100 text-green-800 border border-green-200'
                                                        }`}>
                                                            {session.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Academic Year</p>
                                                            <p className="font-medium text-gray-900">{session.examSessionAcademicYear}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Exam Date</p>
                                                            <p className="font-medium text-gray-900">{formatDate(session.examSessionDate)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Data Input Progress</p>
                                                            <div className="flex items-center space-x-2">
                                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                    <div 
                                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                                                        style={{width: `${session.completionRate}%`}}
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {session.completionRate}%
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {session.completedData}/{session.totalStudents} students
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {session.isLocked && (
                                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                                            <p className="text-sm text-red-800">
                                                                <strong>Lock Reason:</strong> {session.lockReason}
                                                            </p>
                                                            <p className="text-xs text-red-600 mt-1">
                                                                Locked at: {formatDate(session.lockedAt)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="ml-6">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedSession(session);
                                                            setShowLockModal(true);
                                                        }}
                                                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                                            session.isLocked
                                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                                : 'bg-red-600 text-white hover:bg-red-700'
                                                        }`}
                                                    >
                                                        {session.isLocked ? 'Unlock' : 'Lock'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Edit Requests Tab */}
                    {activeTab === 'requests' && (
                        <div className="space-y-4">
                            {editRequests.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-5xl mb-4">📝</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No edit requests</h3>
                                    <p className="text-gray-500">Edit requests will be displayed here when data is available</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {editRequests.map((request) => (
                                        <div key={request._id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-3">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {request.requestedBy?.name || 'Doctor not found'}   
                                                        </h3>
                                                        <span className={getStatusBadge(request.status)}>
                                                            {request.status === 'pending' ? 'Pending' :
                                                             request.status === 'approved' ? 'Approved' :
                                                             request.status === 'rejected' ? 'Rejected' : 'Cancelled'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Doctor Email</p>
                                                            <p className="font-medium text-gray-900">{request.requestedBy?.email || 'None'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Exam Session</p>
                                                            <p className="font-medium text-gray-900">{request.examSessionId?.examSessionName}</p>
                                                            <p className="text-sm text-gray-500">{request.examSessionId?.examSessionAcademicYear}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="text-sm text-gray-500 mb-2">Request Reason</p>
                                                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                                                            <p className="text-gray-900">{request.reason}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                                        <span>Request at: {formatDate(request.createdAt)}</span>
                                                        {request.tempUnlockUntil && new Date(request.tempUnlockUntil) > new Date() && (
                                                            <span className="text-green-600 font-medium">
                                                                Temp unlock until: {formatDate(request.tempUnlockUntil)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="ml-6">
                                                    {request.status === 'pending' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setShowRequestModal(true);
                                                            }}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                                                        >
                                                            Review
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lock/Unlock Modal */}
            {showLockModal && selectedSession && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {selectedSession.isLocked ? '🔓 Unlock' : '🔒 Lock'} Exam Session
                            </h3>
                            
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <p className="font-semibold text-gray-900">{selectedSession.examSessionName}</p>
                                <p className="text-gray-600">{selectedSession.examSessionAcademicYear}</p>
                            </div>
                            
                            {!selectedSession.isLocked && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Lock Reason <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={lockReason}
                                        onChange={(e) => setLockReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        rows={4}
                                        placeholder="Enter the reason for locking this exam session..."
                                    />
                                </div>
                            )}

                            {selectedSession.isLocked && (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm text-amber-800">
                                        <strong>Current lock reason:</strong><br />
                                        {selectedSession.lockReason}
                                    </p>
                                </div>
                            )}

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowLockModal(false);
                                        setSelectedSession(null);
                                        setLockReason('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => toggleLock(selectedSession)}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                                        selectedSession.isLocked
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    {selectedSession.isLocked ? 'Unlock' : 'Lock'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Request Review Modal */}
            {showRequestModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">
                                📝 Review Edit Request
                            </h3>
                            
                            <div className="space-y-6 mb-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                                        <p className="text-gray-900 font-medium">{selectedRequest.requestedBy?.name}</p>
                                        <p className="text-gray-600 text-sm">{selectedRequest.requestedBy?.email}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Session</label>
                                        <p className="text-gray-900 font-medium">{selectedRequest.examSessionId?.examSessionName}</p>
                                        <p className="text-gray-600 text-sm">{selectedRequest.examSessionId?.examSessionAcademicYear}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Request Reason</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <p className="text-gray-900">{selectedRequest.reason}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Response
                                    </label>
                                    <textarea
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        rows={4}
                                        placeholder="Enter your response..."
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Temp Unlock Hours
                                    </label>
                                    <select
                                        value={tempUnlockHours}
                                        onChange={(e) => setTempUnlockHours(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    >
                                        <option value={1}>1 hour</option>
                                        <option value={2}>2 hours</option>
                                        <option value={4}>4 hours</option>
                                        <option value={8}>8 hours</option>
                                        <option value={24}>24 hours</option>
                                        <option value={48}>48 hours</option>
                                        <option value={72}>72 hours</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowRequestModal(false);
                                        setSelectedRequest(null);
                                        setAdminResponse('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleEditRequest('reject')}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleEditRequest('approve')}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamSessionManager;