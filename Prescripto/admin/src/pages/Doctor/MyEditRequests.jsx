import React, { useState, useEffect, useContext } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { toast } from 'react-toastify';

const MyEditRequests = () => {
    const { dToken } = useContext(DoctorContext);
    const [editRequests, setEditRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const loadEditRequests = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/my-edit-requests?status=${filter}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                setEditRequests(data.editRequests);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load edit requests');
        } finally {
            setLoading(false);
        }
    };

    const cancelRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to cancel this request?')) {
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/cancel-edit-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ requestId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                toast.success('Request cancelled successfully');
                loadEditRequests();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to cancel request');
        }
    };

    useEffect(() => {
        if (dToken) {
            loadEditRequests();
        }
    }, [dToken, filter]);

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
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
            cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return `px-3 py-1 rounded-full text-xs font-medium border ${colors[status]}`;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return '⏳';
            case 'approved':
                return '✅';
            case 'rejected':
                return '❌';
            case 'cancelled':
                return '⚪';
            default:
                return '📝';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 h-[calc(100vh-80px)] overflow-y-auto ml-10 w-[1000px]">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">📝 My Edit Requests</h1>
                <p className="text-gray-600">Track your edit access requests for locked exam sessions</p>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 pl-[250px]">
                        {[
                            { key: 'all', label: 'All', count: editRequests.length },
                            { key: 'pending', label: 'Pending', count: editRequests.filter(r => r.status === 'pending').length },
                            { key: 'approved', label: 'Approved', count: editRequests.filter(r => r.status === 'approved').length },
                            { key: 'rejected', label: 'Rejected', count: editRequests.filter(r => r.status === 'rejected').length }
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                    filter === key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {label} ({count})
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Edit Requests List */}
            {editRequests.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No edit requests found</h3>
                    <p className="text-gray-500">
                        {filter === 'all' 
                            ? "You haven't submitted any edit requests yet."
                            : `No ${filter} requests found.`
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {editRequests.map((request) => (
                        <div key={request._id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                        <span className="text-2xl mr-2">{getStatusIcon(request.status)}</span>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {request.examSessionId?.examSessionName || 'Unknown Session'}
                                        </h3>
                                        <span className={getStatusBadge(request.status)}>
                                            {request.status.toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    <div className="text-sm text-gray-600 mb-3">
                                        <p><strong>Academic Year:</strong> {request.examSessionId?.examSessionAcademicYear}</p>
                                        <p><strong>Submitted:</strong> {formatDate(request.createdAt)}</p>
                                        {request.processedAt && (
                                            <p><strong>Processed:</strong> {formatDate(request.processedAt)}</p>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Your Request:</p>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                            {request.reason}
                                        </p>
                                    </div>

                                    {request.adminResponse && (
                                        <div className="mb-3">
                                            <p className="text-sm font-medium text-gray-700 mb-1">Admin Response:</p>
                                            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                                                {request.adminResponse}
                                            </p>
                                        </div>
                                    )}

                                    {request.tempUnlockUntil && new Date(request.tempUnlockUntil) > new Date() && (
                                        <div className="mb-3">
                                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                                <div className="flex items-center">
                                                    <span className="text-green-600 mr-2">🔓</span>
                                                    <div>
                                                        <p className="text-sm font-medium text-green-800">
                                                            Temporary Access Granted
                                                        </p>
                                                        <p className="text-sm text-green-700">
                                                            Valid until: {formatDate(request.tempUnlockUntil)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-end space-y-2">
                                    {request.status === 'pending' && (
                                        <button
                                            onClick={() => cancelRequest(request._id)}
                                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Refresh Button */}
            {/* <div className="mt-6 text-center">
                <button
                    onClick={loadEditRequests}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                    🔄 Refresh
                </button>
            </div> */}
        </div>
    );
};

export default MyEditRequests; 