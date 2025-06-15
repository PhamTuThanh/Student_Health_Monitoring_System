import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const DrugDetail = ({ drug, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        drugName: '',
        drugCode: '',
        drugType: '',
        drugUnit: '',
        inventoryQuantity: '',
        expiryDate: '',
        supplierName: '',
        notes: '',
        drugImage: null
    });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (drug) {
            setFormData({
                drugName: drug.drugName || '',
                drugCode: drug.drugCode || '',
                drugType: drug.drugType || '',
                drugUnit: drug.drugUnit || '',
                inventoryQuantity: drug.inventoryQuantity || '',
                expiryDate: drug.expiryDate ? new Date(drug.expiryDate).toISOString().split('T')[0] : '',
                supplierName: drug.supplierName || '',
                notes: drug.notes || '',
                drugImage: null
            });
        }
    }, [drug]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.put(`http://localhost:9000/api/doctor/update-drug/${drug._id}`, formData);
            if (res.data.success) {
                toast.success('Update successfully!');
                onUpdate({ ...res.data.data, _id: drug._id });
            } else {
                toast.error(res.data.message || 'Update failed!');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        }
        setLoading(false);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col items-center mb-4">
                    {drug.drugImage ? (
                        <img src={drug.drugImage} alt="Drug" className="w-32 h-32 object-cover rounded mb-2 border" />
                    ) : (
                        <div className="w-32 h-32 flex items-center justify-center bg-gray-100 text-gray-400 rounded mb-2 border">
                            No Image
                        </div>
                    )}
                    <div className="flex justify-between items-center w-full">
                        <h2 className="text-xl font-bold">Drug Detail</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name</label>
                            <input
                                type="text"
                                name="drugName"
                                value={formData.drugName}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Drug Code</label>
                            <input
                                type="text"
                                name="drugCode"
                                value={formData.drugCode}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Drug Type</label>
                            <select
                                name="drugType"
                                value={formData.drugType}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border rounded-md"
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
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Drug Unit</label>
                            <input
                                type="text"
                                name="drugUnit"
                                value={formData.drugUnit}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Quantity</label>
                            <input
                                type="number"
                                name="inventoryQuantity"
                                value={formData.inventoryQuantity}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                            <input
                                type="date"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <input
                                type="text"
                                name="supplierName"
                                value={formData.supplierName}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                disabled={!isEditing}
                                rows="3"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        {!isEditing ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Edit
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    {loading ? 'Saving...' : 'Save changes'}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DrugDetail;
