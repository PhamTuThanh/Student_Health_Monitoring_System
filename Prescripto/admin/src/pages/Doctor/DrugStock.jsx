import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DrugDetail from '../../components/DrugDetail';
import { assets } from '../../assets/assets';
import AddDrug from './AddDrug';
import { Plus } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ModalWrapper from '../../components/ModalWrapper';

const DrugStock = () => {
    const { hideNavbar, showNavbar } = useAppContext();
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [search, setSearch] = useState("");
    const [filteredDrugs, setFilteredDrugs] = useState([]);
    const [showAddDrug, setShowAddDrug] = useState(false);
    const [showExpiringModal, setShowExpiringModal] = useState(false);
    const [showLowStockModal, setShowLowStockModal] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

    const fetchDrugs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${backendUrl}/api/doctor/get-drug-stock`);
            setDrugs(res.data.data || []);
        } catch (err) {
            setError('Error loading drug list');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDrugs();
    }, []);

    useEffect(() => {
        setFilteredDrugs(drugs);
    }, [drugs]);

    useEffect(() => {
        if (!search.trim()) {
            setFilteredDrugs(drugs);
        } else {
            setFilteredDrugs(
                drugs.filter(drug =>
                    (drug.drugName || "").toLowerCase().includes(search.toLowerCase()) ||
                    (drug.drugCode || "").toLowerCase().includes(search.toLowerCase()) ||
                    (drug.drugType || "").toLowerCase().includes(search.toLowerCase())
                )
            );
        }
    }, [search, drugs]);

    const handleDelete = async (drugId) => {
        if (window.confirm('Are you sure you want to delete this drug?')) {
            try {
                console.log('Attempting to delete drug with ID:', drugId);
                console.log('Using backend URL:', backendUrl);
                
                const res = await axios.delete(`${backendUrl}/api/doctor/delete-drug/${drugId}`);
                
                console.log('Delete response:', res.data);
                
                if (res.data.success) {
                    // Update local state to remove deleted drug
                    setDrugs(prevDrugs => prevDrugs.filter(drug => drug._id !== drugId));
                    alert('Drug deleted successfully!');
                } else {
                    alert('Failed to delete drug: ' + (res.data.message || 'Unknown error'));
                }
            } catch (err) {
                console.error('Error deleting drug:', err);
                console.error('Error details:', err.response?.data);
                
                // Show detailed error message to user
                const errorMessage = err.response?.data?.message || err.message || 'Failed to delete drug';
                alert('Error: ' + errorMessage);
            }
        }
    };

    const handleViewDetail = (drug) => {
        hideNavbar();
        setSelectedDrug(drug);
        setShowDetail(true);
    };

    const handleCloseDetail = () => {
        showNavbar();
        setShowDetail(false);
        setSelectedDrug(null);
    };

    const handleUpdateDrug = (updatedDrug) => {
        setDrugs(drugs.map(d => (d._id === updatedDrug._id ? updatedDrug : d)));
        handleCloseDetail();
    };

    const handleOpenAddDrug = () => {
        hideNavbar();
        setShowAddDrug(true);
    };

    const handleCloseAddDrug = () => {
        showNavbar();
        setShowAddDrug(false);
    };

    const handleAddDrugSuccess = () => {
        setShowAddDrug(false);
        fetchDrugs();
    };
  
    const isNearExpiry = (expiryDate) => {
        if (!expiryDate) return false;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const timeDiff = expiry.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return daysDiff <= 30 && daysDiff > 0;
    };

    const isExpired = (expiryDate) => {
        if (!expiryDate) return false;
        const today = new Date();
        const expiry = new Date(expiryDate);
        return expiry < today;
    };

    const isLowStock = (quantity) => {
        return quantity < 10;
    };

    const expiringDrugs = filteredDrugs.filter(drug => isNearExpiry(drug.expiryDate) || isExpired(drug.expiryDate));
    const lowStockDrugs = filteredDrugs.filter(drug => isLowStock(drug.inventoryQuantity));

    return (
        <div className="h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                        💊 Drug Inventory Management
                                    </h1>
                                    <p className="text-gray-600">
                                        Manage and monitor your pharmaceutical inventory
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleOpenAddDrug}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add Drug
                                    </button>

                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search by name, code, or type..."
                                            className="pl-10 pr-4 py-3 w-full sm:w-80 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-sm">Total Drugs</p>
                                            <p className="text-2xl font-bold">{filteredDrugs.length}</p>
                                        </div>
                                        <div className="text-blue-200 text-2xl">📋</div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100 text-sm">In Stock</p>
                                            <p className="text-2xl font-bold">
                                                {filteredDrugs.filter(drug => drug.inventoryQuantity > 10).length}
                                            </p>
                                        </div>
                                        <div className="text-green-200 text-2xl">✅</div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white cursor-pointer" onClick={() => setShowLowStockModal(true)}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-orange-100 text-sm">Low Stock</p>
                                            <p className="text-2xl font-bold">
                                                {lowStockDrugs.length}
                                            </p>
                                        </div>
                                        <div className="text-orange-200 text-2xl">⚠️</div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white cursor-pointer" onClick={() => setShowExpiringModal(true)}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-red-100 text-sm">Expiring Soon</p>
                                            <p className="text-2xl font-bold">
                                                {expiringDrugs.length}
                                            </p>
                                        </div>
                                        <div className="text-red-200 text-2xl">⏰</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-600 font-medium">Loading drugs...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                            <div className="text-red-600 text-4xl mb-2">❌</div>
                            <div className="text-red-700 font-medium">{error}</div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"> 
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Drug Inventory ({filteredDrugs.length} items)
                                </h3>
                            </div>

                            <div className="overflow-x-auto" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Drug Info</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Code & Type</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expiry</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {filteredDrugs.map((drug, idx) => (
                                            <tr key={drug._id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-600">
                                                        {idx + 1}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                                {drug.drugImage ? <img src={drug.drugImage} alt="Drug" className="w-10 h-10 rounded-full" /> : 'D'}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {drug.drugName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                Unit: {drug.drugUnit}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                                                        {drug.drugCode}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {drug.drugType}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isLowStock(drug.inventoryQuantity)
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {drug.inventoryQuantity}
                                                            {isLowStock(drug.inventoryQuantity) && (
                                                                <span className="ml-1">⚠️</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {drug.expiryDate ? new Date(drug.expiryDate).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    {drug.expiryDate && (
                                                        <div className="text-xs">
                                                            {isExpired(drug.expiryDate) ? (
                                                                <span className="text-red-600 font-medium">Expired ❌</span>
                                                            ) : isNearExpiry(drug.expiryDate) ? (
                                                                <span className="text-orange-600 font-medium">Expiring Soon ⚠️</span>
                                                            ) : (
                                                                <span className="text-green-600">Valid ✅</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {drug.supplierName || 'N/A'}
                                                </td>

                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-3">
                                                        <button
                                                            onClick={() => handleViewDetail(drug)}
                                                            className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 rounded-lg transition-colors duration-200 group"
                                                            title="View Details"
                                                        >
                                                            <img
                                                                src={assets.view_detail_icon}
                                                                alt="View"
                                                                className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(drug._id)}
                                                            className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors duration-200 group"
                                                            title="Delete Drug"
                                                        >
                                                            <img
                                                                src={assets.delete_icon}
                                                                alt="Delete"
                                                                className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {filteredDrugs.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 text-6xl mb-4">💊</div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No drugs found</h3>
                                        <p className="text-gray-500">Try adjusting your search terms</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <ModalWrapper isOpen={showDetail} onClose={handleCloseDetail}>
                        {selectedDrug && (
                            <DrugDetail
                                drug={selectedDrug}
                                onClose={handleCloseDetail}
                                onUpdate={handleUpdateDrug}
                            />
                        )}
                    </ModalWrapper>

                    <ModalWrapper isOpen={showAddDrug} onClose={handleCloseAddDrug}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
                            <AddDrug onClose={handleCloseAddDrug} onSuccess={handleAddDrugSuccess} />
                        </div>
                    </ModalWrapper>

                    <ModalWrapper isOpen={showExpiringModal} onClose={() => setShowExpiringModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-red-600">Drugs Expiring Soon</h2>
                                <button onClick={() => setShowExpiringModal(false)} className="text-gray-500 hover:text-red-500 text-2xl font-bold">&times;</button>
                            </div>
                            {expiringDrugs.length === 0 ? (
                                <div className="text-gray-500 text-center py-8">No drugs expiring soon.</div>
                            ) : (
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="px-3 py-2 text-left">Name</th>
                                            <th className="px-3 py-2 text-left">Code</th>
                                            <th className="px-3 py-2 text-left">Expiry Date</th>
                                            <th className="px-3 py-2 text-left">Stock</th>
                                            <th className="px-3 py-2 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expiringDrugs.map(drug => (
                                            <tr key={drug._id} className="border-b">
                                                <td className="px-3 py-2">{drug.drugName}</td>
                                                <td className="px-3 py-2">{drug.drugCode}</td>
                                                <td className="px-3 py-2">{drug.expiryDate ? new Date(drug.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                                <td className="px-3 py-2">{drug.inventoryQuantity}</td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        onClick={() => handleDelete(drug._id)}
                                                        className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors duration-200 group"
                                                        title="Delete Drug"
                                                    >
                                                        <span className="font-bold">Delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </ModalWrapper>

                    <ModalWrapper isOpen={showLowStockModal} onClose={() => setShowLowStockModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-orange-600">Low Stock Drugs</h2>
                                <button onClick={() => setShowLowStockModal(false)} className="text-gray-500 hover:text-orange-500 text-2xl font-bold">&times;</button>
                            </div>
                            {lowStockDrugs.length === 0 ? (
                                <div className="text-gray-500 text-center py-8">No drugs with low stock.</div>
                            ) : (
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="px-3 py-2 text-left">Name</th>
                                            <th className="px-3 py-2 text-left">Code</th>
                                            <th className="px-3 py-2 text-left">Stock</th>
                                            <th className="px-3 py-2 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStockDrugs.map(drug => (
                                            <tr key={drug._id} className="border-b">
                                                <td className="px-3 py-2">{drug.drugName}</td>
                                                <td className="px-3 py-2">{drug.drugCode}</td>
                                                <td className="px-3 py-2">{drug.inventoryQuantity}</td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        onClick={() => handleDelete(drug._id)}
                                                        className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors duration-200 group"
                                                        title="Delete Drug"
                                                    >
                                                        <span className="font-bold">Delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </ModalWrapper>
                </div>
            </div>
        </div>
    );
};

export default DrugStock; 