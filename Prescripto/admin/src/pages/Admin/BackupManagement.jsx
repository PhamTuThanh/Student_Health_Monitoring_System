import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';

const BackupManagement = () => {
    const { aToken } = useContext(AdminContext);
    const [backups, setBackups] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState({
        status: '',
        backupType: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState(null);
    const [restoreLoading, setRestoreLoading] = useState(false);

    // Form state for creating backup
    const [backupForm, setBackupForm] = useState({
        backupName: '',
        retentionDays: 30
    });

    // Form state for restoring backup
    const [restoreForm, setRestoreForm] = useState({
        confirmRestore: false,
        dropExisting: false,
        conflictResolution: 'skip',
        collections: null,
        selectedCollections: []
    });

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Fetch backup statistics
    const fetchStats = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/backup/stats`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching backup stats:', error);
        }
    };

    // Fetch backups list
    const fetchBackups = async (page = 1) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...filter
            });

            const response = await fetch(`${backendUrl}/api/admin/backup/list?${queryParams}`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            if (data.success) {
                setBackups(data.data.backups);
                setCurrentPage(data.data.pagination.currentPage);
                setTotalPages(data.data.pagination.totalPages);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching backups:', error);
            toast.error('Failed to fetch backups');
        }
        setLoading(false);
    };

    // Create manual backup
    const createBackup = async () => {
        if (!backupForm.backupName.trim()) {
            toast.error('Please enter a backup name');
            return;
        }

        setCreateLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/admin/backup/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(backupForm)
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Backup process started successfully');
                setShowCreateModal(false);
                setBackupForm({ backupName: '', retentionDays: 30 });
                fetchBackups();
                fetchStats();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error creating backup:', error);
            toast.error('Failed to create backup');
        }
        setCreateLoading(false);
    };

    // Download backup
    const downloadBackup = async (backupId, backupName) => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/backup/${backupId}/download`, {
                credentials: 'include'
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${backupName}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Backup downloaded successfully');
            } else {
                toast.error('Failed to download backup');
            }
        } catch (error) {
            console.error('Error downloading backup:', error);
            toast.error('Failed to download backup');
        }
    };

    // Verify backup
    const verifyBackup = async (backupId) => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/backup/${backupId}/verify`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Backup verification: ${data.data.message}`);
                fetchBackups();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error verifying backup:', error);
            toast.error('Failed to verify backup');
        }
    };

    // Delete backup
    const deleteBackup = async (backupId) => {
        if (!confirm('Are you sure you want to delete this backup?')) {
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/admin/backup/${backupId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Backup deleted successfully');
                fetchBackups();
                fetchStats();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error deleting backup:', error);
            toast.error('Failed to delete backup');
        }
    };

    // Restore backup
    const restoreBackup = async () => {
        if (!restoreForm.confirmRestore) {
            toast.error('Please confirm that you want to restore this backup');
            return;
        }

        setRestoreLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/admin/backup/${selectedBackup.backupId}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    confirmRestore: restoreForm.confirmRestore,
                    dropExisting: restoreForm.dropExisting,
                    conflictResolution: restoreForm.conflictResolution,
                    collections: restoreForm.selectedCollections.length > 0 ? restoreForm.selectedCollections : null
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Database restored successfully');
                setShowRestoreModal(false);
                setSelectedBackup(null);
                setRestoreForm({
                    confirmRestore: false,
                    dropExisting: false,
                    conflictResolution: 'skip',
                    collections: null,
                    selectedCollections: []
                });
                // Show restore stats in console or modal
                console.log('Restore Stats:', data.data.stats);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error restoring backup:', error);
            toast.error('Failed to restore backup');
        }
        setRestoreLoading(false);
    };

    // Open restore modal
    const openRestoreModal = (backup) => {
        setSelectedBackup(backup);
        setShowRestoreModal(true);
    };

    // Cleanup old backups
    const cleanupOldBackups = async () => {
        if (!confirm('Are you sure you want to cleanup old backups?')) {
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/admin/backup/cleanup`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) { 
                toast.success('Old backups cleaned up successfully');
                fetchBackups();
                fetchStats();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error cleaning up backups:', error);
            toast.error('Failed to cleanup backups');
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'corrupted':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    useEffect(() => {
        if (aToken) {
            fetchBackups();
            fetchStats();
        }
    }, [aToken, filter]);

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 h-[calc(100vh-80px)] overflow-y-auto ml-10 w-[1000px]">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Backup Management</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark flex items-center gap-2"
                    >
                        <img src={assets.add_icon} alt="" className="w-4 h-4" />
                        Create Backup
                    </button>
                    <button
                        onClick={cleanupOldBackups}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                    >
                        Cleanup Old
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Backups</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalBackups || 0}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <img src={assets.appointments_icon} alt="" className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Success Rate</p>
                            <p className="text-3xl font-bold text-green-600">{stats.successRate || 0}%</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <img src={assets.tick_icon} alt="" className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Size</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.formattedTotalSize || '0 Bytes'}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <img src={assets.earning_icon} alt="" className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Failed Backups</p>
                            <p className="text-3xl font-bold text-red-600">{stats.failedBackups || 0}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                            <img src={assets.cancel_icon} alt="" className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filter.status}
                            onChange={(e) => setFilter({...filter, status: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                            <option value="">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="corrupted">Corrupted</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={filter.backupType}
                            onChange={(e) => setFilter({...filter, backupType: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                            <option value="">All Types</option>
                            <option value="manual">Manual</option>
                            <option value="automatic">Automatic</option>
                            <option value="scheduled">Scheduled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <select
                            value={filter.sortBy}
                            onChange={(e) => setFilter({...filter, sortBy: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                            <option value="createdAt">Date Created</option>
                            <option value="backupSize">Size</option>
                            <option value="backupName">Name</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                        <select
                            value={filter.sortOrder}
                            onChange={(e) => setFilter({...filter, sortOrder: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Backups Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Backup Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Size
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : backups.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No backups found
                                    </td>
                                </tr>
                            ) : (
                                backups.map((backup) => (
                                    <tr key={backup._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {backup.backupName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {backup.backupId}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(backup.status)}`}>
                                                {backup.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {backup.backupType}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {backup.formattedSize}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(backup.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {backup.status === 'completed' && backup.canDownload && (
                                                    <button
                                                        onClick={() => downloadBackup(backup.backupId, backup.backupName)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Download"
                                                    >
                                                        📥
                                                    </button>
                                                )}
                                                {backup.status === 'completed' && backup.isVerified && (
                                                    <button
                                                        onClick={() => openRestoreModal(backup)}
                                                        className="text-purple-600 hover:text-purple-900"
                                                        title="Restore"
                                                    >
                                                        🔄
                                                    </button>
                                                )}
                                                {backup.status === 'completed' && (
                                                    <button
                                                        onClick={() => verifyBackup(backup.backupId)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Verify"
                                                    >
                                                        ✓
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteBackup(backup.backupId)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                        <div className="flex justify-between">
                            <button
                                onClick={() => fetchBackups(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => fetchBackups(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Restore Backup Modal */}
            {showRestoreModal && selectedBackup && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Restore Database from Backup
                            </h3>
                            
                            {/* Backup Info */}
                            <div className="bg-gray-50 p-4 rounded mb-4">
                                <h4 className="font-medium text-gray-900 mb-2">Backup Information</h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><strong>Name:</strong> {selectedBackup.backupName}</p>
                                    <p><strong>Created:</strong> {formatDate(selectedBackup.createdAt)}</p>
                                    <p><strong>Size:</strong> {selectedBackup.formattedSize}</p>
                                    <p><strong>Collections:</strong> {selectedBackup.collections?.length || 0}</p>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                                <div className="flex">
                                    <div className="text-red-600 text-lg mr-3">⚠️</div>
                                    <div>
                                        <h4 className="text-red-800 font-medium">Warning</h4>
                                        <p className="text-red-700 text-sm mt-1">
                                            This action will restore data from the backup to your database. 
                                            Please ensure you understand the impact before proceeding.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Conflict Resolution */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Conflict Resolution Strategy
                                    </label>
                                    <select
                                        value={restoreForm.conflictResolution}
                                        onChange={(e) => setRestoreForm({...restoreForm, conflictResolution: e.target.value})}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                    >
                                        <option value="skip">Skip existing documents</option>
                                        <option value="replace">Replace existing documents</option>
                                        <option value="merge">Merge/update existing documents</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {restoreForm.conflictResolution === 'skip' && 'Documents with existing IDs will be skipped'}
                                        {restoreForm.conflictResolution === 'replace' && 'Existing documents will be replaced with backup data'}
                                        {restoreForm.conflictResolution === 'merge' && 'Existing documents will be updated with backup data'}
                                    </p>
                                </div>

                                {/* Drop Existing */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="dropExisting"
                                        checked={restoreForm.dropExisting}
                                        onChange={(e) => setRestoreForm({...restoreForm, dropExisting: e.target.checked})}
                                        className="mr-2"
                                    />
                                    <label htmlFor="dropExisting" className="text-sm text-gray-700">
                                        Drop existing collections before restore (⚠️ This will delete all current data)
                                    </label>
                                </div>

                                {/* Collections Selection */}
                                {selectedBackup.collections && selectedBackup.collections.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Collections to Restore (leave empty to restore all)
                                        </label>
                                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2">
                                            {selectedBackup.collections.map((collection) => (
                                                <div key={collection.name} className="flex items-center mb-1">
                                                    <input
                                                        type="checkbox"
                                                        id={collection.name}
                                                        checked={restoreForm.selectedCollections.includes(collection.name)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setRestoreForm({
                                                                    ...restoreForm,
                                                                    selectedCollections: [...restoreForm.selectedCollections, collection.name]
                                                                });
                                                            } else {
                                                                setRestoreForm({
                                                                    ...restoreForm,
                                                                    selectedCollections: restoreForm.selectedCollections.filter(c => c !== collection.name)
                                                                });
                                                            }
                                                        }}
                                                        className="mr-2"
                                                    />
                                                    <label htmlFor={collection.name} className="text-sm text-gray-700">
                                                        {collection.name} ({collection.documentCount} docs)
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Confirmation */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="confirmRestore"
                                        checked={restoreForm.confirmRestore}
                                        onChange={(e) => setRestoreForm({...restoreForm, confirmRestore: e.target.checked})}
                                        className="mr-2"
                                    />
                                    <label htmlFor="confirmRestore" className="text-sm text-gray-700 font-medium">
                                        I understand the consequences and want to proceed with the restore
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowRestoreModal(false);
                                        setSelectedBackup(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={restoreBackup}
                                    disabled={restoreLoading || !restoreForm.confirmRestore}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {restoreLoading ? 'Restoring...' : 'Restore Database'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Backup Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Manual Backup</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Backup Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={backupForm.backupName}
                                        onChange={(e) => setBackupForm({...backupForm, backupName: e.target.value})}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        placeholder="Enter backup name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Retention Days
                                    </label>
                                    <input
                                        type="number"
                                        value={backupForm.retentionDays}
                                        onChange={(e) => setBackupForm({...backupForm, retentionDays: parseInt(e.target.value)})}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        min="1"
                                        max="365"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createBackup}
                                    disabled={createLoading}
                                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
                                >
                                    {createLoading ? 'Creating...' : 'Create Backup'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BackupManagement; 