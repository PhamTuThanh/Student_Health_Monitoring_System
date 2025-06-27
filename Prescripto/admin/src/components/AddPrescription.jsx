import React, { useState, useEffect } from 'react';
import { X, Pill, Clock, FileText, Calendar, User, AlertCircle, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useNavbarControl } from '../hooks/useNavbarControl';
import { toast } from 'react-toastify';

const AddPrescription = ({ selectedAbnormality, onClose }) => {
    const { hideNavbar, showNavbar } = useNavbarControl(false);
    
    // Main prescription info
    const [doctorName, setDoctorName] = useState("");
    const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");
    
    // Drug stock state
    const [drugStock, setDrugStock] = useState([]);

    // Medicine list
    const [medicines, setMedicines] = useState([
        {
            id: 1,
            drugId: "",
            quantity: "",
            dosage: "",
            frequency: "",
            duration: "",
            instructions: "",
            beforeAfterMeal: "after" // before, after, with
        }
    ]);

    useEffect(() => {
        const fetchDrugStock = async () => {
            try {
                const response = await axios.get('http://localhost:9000/api/doctor/get-drug-stock');
                if (response.data.success) {
                    setDrugStock(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching drug stock:", error);
            }
        };
        fetchDrugStock();
    }, []);

    const handleClose = () => {
        showNavbar();
        onClose();
    };

    const addMedicine = () => {
        const newId = medicines.length > 0 ? Math.max(...medicines.map(m => m.id)) + 1 : 1;
        setMedicines([...medicines, {
            id: newId,
            drugId: "",
            quantity: "",
            dosage: "",
            frequency: "",
            duration: "",
            instructions: "",
            beforeAfterMeal: "after"
        }]);
    };

    const removeMedicine = (id) => {
        if (medicines.length > 1) {
            setMedicines(medicines.filter(m => m.id !== id));
        }
    };

    const handleMedicineChange = (id, selectedDrugId) => {
        setMedicines(medicines.map(m =>
            m.id === id ? { ...m, drugId: selectedDrugId } : m
        ));
    };

    const updateMedicine = (id, field, value) => {
        setMedicines(medicines.map(m => 
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const prescriptionData = {
            abnormalityId: selectedAbnormality._id,
            studentId: selectedAbnormality.studentId,
            doctorName,
            prescriptionDate,
            diagnosis,
            medicines: medicines.map(m => ({
                drugId: m.drugId,
                quantity: m.quantity,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration,
                instructions: m.instructions,
                beforeAfterMeal: m.beforeAfterMeal
            })).filter(m => m.drugId),
            notes
        };

        if (prescriptionData.medicines.length === 0) {
            alert("Please add at least one medicine.");
            return;
        }

        try {
            // Note: A new backend endpoint is required to handle this submission.
            const response = await axios.post("http://localhost:9000/api/doctor/add-prescription", prescriptionData);
            if (response.data.success) {
                alert("Prescription saved successfully!");
                showNavbar();
                onClose();
            } else {
                alert(`Error: ${response.data.message}`);
            }
        } catch (error) {
            toast.error(error.response.data.message);
        }
    };

    const frequencyOptions = [
        { value: "1x/day", label: "1 lần/ngày" },
        { value: "2x/day", label: "2 lần/ngày" },
        { value: "3x/day", label: "3 lần/ngày" },
        { value: "4x/day", label: "4 lần/ngày" },
        { value: "as-needed", label: "Khi cần thiết" }
    ];

    const durationOptions = [
        { value: "3-days", label: "3 ngày" },
        { value: "5-days", label: "5 ngày" },
        { value: "7-days", label: "1 tuần" },
        { value: "10-days", label: "10 ngày" },
        { value: "14-days", label: "2 tuần" },
        { value: "30-days", label: "1 tháng" }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white bg-opacity-20 p-2 rounded-full">
                                <Pill className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Medical Prescription</h3>
                                <p className="text-green-100 text-sm">
                                    For: {selectedAbnormality?.studentName || "Patient"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white hover:text-green-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
                    <div onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information */}
                        <div className="bg-gray-50 rounded-2xl p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2 text-gray-600" />
                                Basic Information
                            </h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Doctor Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                        value={doctorName}
                                        onChange={(e) => setDoctorName(e.target.value)}
                                        placeholder="Enter doctor's name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Prescription Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                        value={prescriptionDate}
                                        onChange={(e) => setPrescriptionDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mt-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Diagnosis
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    placeholder="Enter diagnosis or condition"
                                />
                            </div>
                        </div>

                        {/* Medicines */}
                        <div className="bg-blue-50 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Pill className="w-5 h-5 mr-2 text-blue-600" />
                                    Prescribed Medicines
                                </h4>
                                <button
                                    type="button"
                                    onClick={addMedicine}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center space-x-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Medicine</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {medicines.map((medicine, index) => (
                                    <div key={medicine.id} className="bg-white rounded-xl p-6 border border-blue-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h5 className="font-semibold text-gray-800">
                                                Medicine #{index + 1}
                                            </h5>
                                            {medicines.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedicine(medicine.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Medicine Name *
                                                </label>
                                                <select
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                    value={medicine.drugId}
                                                    onChange={(e) => handleMedicineChange(medicine.id, e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select medicine</option>
                                                    {drugStock.map(drug => (
                                                        <option key={drug._id} value={drug._id}>
                                                            {`${drug.drugName} (${drug.drugCode}) - Stock: ${drug.inventoryQuantity}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Quantity *
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                    value={medicine.quantity}
                                                    min={0}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Nếu nhập số âm thì chuyển thành 0
                                                        if (Number(value) < 0) {
                                                            updateMedicine(medicine.id, 'quantity', 0);
                                                        } else {
                                                            updateMedicine(medicine.id, 'quantity', value);
                                                        }
                                                    }}
                                                    placeholder="e.g., 1 tablet, 5ml"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Dosage *
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                    value={medicine.dosage}
                                                    onChange={(e) => updateMedicine(medicine.id, 'dosage', e.target.value)}
                                                    placeholder="e.g., 1 tablet, 5ml"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Frequency *
                                                </label>
                                                <select
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                    value={medicine.frequency}
                                                    onChange={(e) => updateMedicine(medicine.id, 'frequency', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select frequency</option>
                                                    {frequencyOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Duration
                                                </label>
                                                <select
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                    value={medicine.duration}
                                                    onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                                                >
                                                    <option value="">Select duration</option>
                                                    {durationOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Before/After Meal
                                                </label>
                                                <select
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                    value={medicine.beforeAfterMeal}
                                                    onChange={(e) => updateMedicine(medicine.id, 'beforeAfterMeal', e.target.value)}
                                                >
                                                    <option value="before">Trước ăn</option>
                                                    <option value="after">Sau ăn</option>
                                                    <option value="with">Cùng lúc ăn</option>
                                                    <option value="anytime">Bất kỳ lúc nào</option>
                                                </select>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Special Instructions
                                                </label>
                                                <textarea
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                                                    rows={2}
                                                    value={medicine.instructions}
                                                    onChange={(e) => updateMedicine(medicine.id, 'instructions', e.target.value)}
                                                    placeholder="Additional instructions for this medicine..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="bg-amber-50 rounded-2xl p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-amber-600" />
                                Additional Notes & Warnings
                            </h4>
                            <textarea
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none"
                                rows={4}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional instructions, warnings, or follow-up notes..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-8 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center space-x-2"
                            >
                                <Pill className="w-5 h-5" />
                                <span>Save Prescription</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPrescription;