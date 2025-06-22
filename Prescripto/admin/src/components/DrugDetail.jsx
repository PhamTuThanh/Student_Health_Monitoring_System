// Fixed DrugDetail.js - Ngăn auto submit khi edit

import React, { useState, useEffect } from 'react';
import { X, Edit, Save, Pill, Calendar, Package, User, FileText, Hash, Tag, Beaker, XCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavbarControl } from '../hooks/useNavbarControl';
    
const DrugDetail = ({ drug, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({});
    const [initialData, setInitialData] = useState({});
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [errors, setErrors] = useState({});
    const { hideNavbar, showNavbar } = useNavbarControl(false);

    useEffect(() => {
        hideNavbar();
        return () => {
            showNavbar();
        };
    }, [hideNavbar, showNavbar]);
    
    useEffect(() => {
        if (drug) {
            const initial = {
                drugName: drug.drugName || '',
                drugCode: drug.drugCode || '',
                drugType: drug.drugType || '',
                drugUnit: drug.drugUnit || '',
                inventoryQuantity: drug.inventoryQuantity || '',
                expiryDate: drug.expiryDate ? new Date(drug.expiryDate).toISOString().split('T')[0] : '',
                supplierName: drug.supplierName || '',
                notes: drug.notes || '',
            };
            setFormData(initial);
            setInitialData(initial);
            setIsEditing(false);
            setErrors({});
        }
    }, [drug]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.drugName?.trim()) {
            newErrors.drugName = 'Drug name is required';
        }
        
        if (!formData.drugCode?.trim()) {
            newErrors.drugCode = 'Drug code is required';
        }
        
        if (!formData.drugType) {
            newErrors.drugType = 'Drug type is required';
        }
        
        if (!formData.inventoryQuantity || formData.inventoryQuantity < 0) {
            newErrors.inventoryQuantity = 'Valid quantity is required';
        }

        if (formData.expiryDate) {
            const expiryDate = new Date(formData.expiryDate);
            const today = new Date();
            if (expiryDate < today) {
                newErrors.expiryDate = 'Expiry date cannot be in the past';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const hasChanges = () => {
        return JSON.stringify(formData) !== JSON.stringify(initialData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // ✅ FIX: Thêm preventDefault để ngăn form submit
    const handleSubmit = async (e) => {
        e.preventDefault(); // Ngăn form submit mặc định
        
        if (!validateForm()) {
            toast.error('Please fix the validation errors');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.put(`http://localhost:9000/api/doctor/update-drug/${drug._id}`, formData);

            if (res.data.success) {
                toast.success(res.data.message || "Drug updated successfully!");
                setInitialData(formData);
                
                if (onUpdate && typeof onUpdate === 'function') {
                    onUpdate(res.data.data);
                }
                setIsEditing(false);
            } else {
                toast.error(res.data.message || 'Update failed!');
            }
        } catch (err) {
            console.error('Update failed:', err);
            toast.error(err.response?.data?.message || 'An error occurred while updating.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormData(initialData);
        setErrors({});
    };

    // ✅ FIX: Thêm preventDefault để ngăn form submit không mong muốn
    const handleEditClick = (e) => {
        e.preventDefault(); // Ngăn form submit
        e.stopPropagation(); // Ngăn event bubbling
        console.log('Edit button clicked'); // Debug
        setIsEditing(true);
    };

    const handleClose = () => {
        if (isEditing && hasChanges()) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    if (!drug) {
        return null;
    }

    const getExpiryStatus = () => {
        if (!formData.expiryDate) return null;
        const today = new Date();
        const expiry = new Date(formData.expiryDate);
        const daysDiff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 0) return { status: 'expired', text: 'Expired', color: 'bg-red-100 text-red-800' };
        if (daysDiff <= 30) return { status: 'warning', text: `${daysDiff} days left`, color: 'bg-yellow-100 text-yellow-800' };
        return { status: 'valid', text: `${daysDiff} days left`, color: 'bg-green-100 text-green-800' };
    };

    const expiryStatus = getExpiryStatus();

    const inputClasses = (isSelect = false, hasError = false) => {
        const baseClasses = "w-full px-4 py-3 border transition-all duration-300 focus:outline-none";
        const errorClasses = hasError ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "";
        const editingClasses = isEditing 
            ? `border-indigo-300 rounded-xl bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 hover:border-indigo-400 ${errorClasses}` 
            : "border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 cursor-default";
        
        const selectAppearance = isSelect && !isEditing ? "appearance-none" : "";

        return `${baseClasses} ${editingClasses} ${selectAppearance}`;
    };

    const ErrorMessage = ({ error }) => {
        if (!error) return null;
        return <p className="text-red-600 text-sm mt-1">{error}</p>;
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-grow">
                {/* Drug Image and Basic Info */}
                <div className="mb-8 flex flex-col lg:flex-row items-start gap-6">
                    <div className="flex-shrink-0">
                        {drug.drugImage ? (
                            <img 
                                src={drug.drugImage} 
                                alt="Drug" 
                                className="w-32 h-32 object-cover rounded-2xl border-4 border-indigo-100 shadow-lg" 
                            />
                        ) : (
                            <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-400 rounded-2xl border-4 border-indigo-100 shadow-lg">
                                <Pill className="w-12 h-12 text-indigo-300" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Tag className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-600">Drug Name</span>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">{formData.drugName || 'N/A'}</p>
                            </div>
                            
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-600">Stock Quantity</span>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">{formData.inventoryQuantity || '0'} {formData.drugUnit}</p>
                            </div>
                        </div>
                        
                        {expiryStatus && (
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${expiryStatus.color}`}>
                                <Calendar className="w-4 h-4" />
                                {expiryStatus.text}
                            </div>
                        )}
                    </div>
                </div>

                {/* ✅ FIX: Chỉ render form khi đang edit hoặc có onSubmit explicit */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Drug Name */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Pill className="w-4 h-4 text-indigo-500" />
                            Drug Name *
                        </label>
                        <input
                            type="text"
                            name="drugName"
                            value={formData.drugName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={inputClasses(false, errors.drugName)}
                            placeholder="Enter drug name"
                        />
                        <ErrorMessage error={errors.drugName} />
                    </div>

                    {/* Drug Code */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Hash className="w-4 h-4 text-indigo-500" />
                            Drug Code *
                        </label>
                        <input
                            type="text"
                            name="drugCode"
                            value={formData.drugCode}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={inputClasses(false, errors.drugCode)}
                            placeholder="Enter drug code"
                        />
                        <ErrorMessage error={errors.drugCode} />
                    </div>

                    {/* Drug Type */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Beaker className="w-4 h-4 text-indigo-500" />
                            Drug Type *
                        </label>
                        <select
                            name="drugType"
                            value={formData.drugType}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={inputClasses(true, errors.drugType)}
                        >
                            <option value="">Select Drug Type</option>
                            <option value="Antibiotic">Antibiotic</option>
                            <option value="Analgesic">Analgesic</option>
                            <option value="Antipyretic">Antipyretic</option>
                            <option value="Antiseptic">Antiseptic</option>
                            <option value="Supplement">Supplement</option>
                            <option value="Vaccine">Vaccine</option>
                            <option value="Hormone">Hormone</option>
                            <option value="Controlled drug">Controlled drug</option>
                            <option value="Other">Other</option>
                        </select>
                        <ErrorMessage error={errors.drugType} />
                    </div>

                    {/* Drug Unit */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Tag className="w-4 h-4 text-indigo-500" />
                            Unit
                        </label>
                        <input
                            type="text"
                            name="drugUnit"
                            value={formData.drugUnit}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={inputClasses()}
                            placeholder="e.g., tablets, ml, mg"
                        />
                    </div>

                    {/* Inventory Quantity */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Package className="w-4 h-4 text-indigo-500" />
                            Inventory Quantity *
                        </label>
                        <input
                            type="number"
                            name="inventoryQuantity"
                            value={formData.inventoryQuantity}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={inputClasses(false, errors.inventoryQuantity)}
                            placeholder="Enter quantity"
                            min="0"
                        />
                        <ErrorMessage error={errors.inventoryQuantity} />
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            Expiry Date
                        </label>
                        <input
                            type="date"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={inputClasses(false, errors.expiryDate)}
                        />
                        <ErrorMessage error={errors.expiryDate} />
                    </div>

                    {/* Supplier */}
                    <div className="lg:col-span-2 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <User className="w-4 h-4 text-indigo-500" />
                            Supplier
                        </label>
                        <input
                            type="text"
                            name="supplierName"
                            value={formData.supplierName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={inputClasses()}
                            placeholder="Enter supplier name"
                        />
                    </div>

                    {/* Notes */}
                    <div className="lg:col-span-2 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            disabled={!isEditing}
                            rows="4"
                            className={`${inputClasses()} resize-none`}
                            placeholder="Add any additional notes or instructions..."
                        />
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex justify-end gap-3">
                    {!isEditing ? (
                        <>
                            <button 
                                type="button" 
                                onClick={handleClose} 
                                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <XCircle className="w-4 h-4" /> 
                                Close
                            </button>
                            {/* ✅ FIX: Thêm type="button" và event handlers rõ ràng */}
                            <button 
                                type="button" 
                                onClick={handleEditClick} 
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <Edit className="w-4 h-4" /> 
                                Edit Details
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                type="button" 
                                onClick={handleCancelEdit} 
                                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <XCircle className="w-4 h-4" /> 
                                Cancel
                            </button>
                            {/* ✅ FIX: Thêm type="button" và onClick explicit cho save */}
                            <button 
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading} 
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" /> 
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DrugDetail;