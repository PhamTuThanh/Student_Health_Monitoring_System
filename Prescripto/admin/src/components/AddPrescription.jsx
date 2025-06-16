// import React, { useState } from 'react';
// import { toast } from 'react-toastify';
// import axios from 'axios';

// const AddPrescription = ({ selectedAbnormality, onClose }) => {
//     const [medicine, setMedicine] = useState("");
//     const [dosage, setDosage] = useState("");
//     const [instructions, setInstructions] = useState("");

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             await axios.post("http://localhost:9000/api/doctor/prescription", {
//                 abnormalityId: selectedAbnormality._id,
//                 medicine,
//                 dosage, //nghĩa là liều lượng
//                 instructions,
//             });
//             toast.success("Lưu đơn thuốc thành công!");
//             setMedicine("");
//             setDosage("");
//             setInstructions("");
//             onClose();
//         } catch (err) {
//             toast.error("Lưu đơn thuốc thất bại!");
//         }
//     };

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
//             <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
//                 <button
//                     className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
//                     onClick={onClose}
//                     title="Close"
//                 >
//                     &times;
//                 </button>
//                 <form onSubmit={handleSubmit}>
//                     <div className="mb-4">
//                         <label className="block font-semibold mb-1">Tên thuốc</label>
//                         <input
//                             type="text"
//                             className="border rounded px-3 py-2 w-full"
//                             value={medicine}
//                             onChange={(e) => setMedicine(e.target.value)}
//                             required
//                         />
//                     </div>
//                     <div className="mb-4">
//                         <label className="block font-semibold mb-1">Liều lượng</label>
//                         <input
//                             type="text"
//                             className="border rounded px-3 py-2 w-full"
//                             value={dosage}
//                             onChange={(e) => setDosage(e.target.value)}
//                             required
//                         />
//                     </div>
//                     <div className="mb-4">
//                         <label className="block font-semibold mb-1">Hướng dẫn dùng</label>
//                         <textarea
//                             className="border rounded px-3 py-2 w-full"
//                             rows={3} 
//                             value={instructions}
//                             onChange={(e) => setInstructions(e.target.value)}
//                             required
//                         />
//                     </div>
//                     <div className="flex gap-3 justify-end">
//                         <button
//                             type="submit"
//                             className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold"
//                         >
//                             Lưu đơn thuốc
//                         </button>
//                         <button
//                             type="button"
//                             className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded font-semibold"
//                             onClick={onClose}
//                         >
//                             Hủy
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default AddPrescription;
import React, { useState } from 'react';
import { X, Pill, Clock, FileText, Calendar, User, AlertCircle, Plus, Trash2 } from 'lucide-react';

const AddPrescription = ({ selectedAbnormality, onClose }) => {
    // Main prescription info
    const [doctorName, setDoctorName] = useState("");
    const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");
    
    // Medicine list
    const [medicines, setMedicines] = useState([
        {
            id: 1,
            name: "",
            dosage: "",
            frequency: "",
            duration: "",
            instructions: "",
            beforeAfterMeal: "after" // before, after, with
        }
    ]);

    const addMedicine = () => {
        const newId = Math.max(...medicines.map(m => m.id)) + 1;
        setMedicines([...medicines, {
            id: newId,
            name: "",
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

    const updateMedicine = (id, field, value) => {
        setMedicines(medicines.map(m => 
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Mock API call
        const prescriptionData = {
            abnormalityId: selectedAbnormality._id,
            doctorName,
            prescriptionDate,
            diagnosis,
            medicines: medicines.filter(m => m.name.trim() !== ""),
            notes
        };
        
        console.log("Prescription data:", prescriptionData);
        
        // Mock success
        setTimeout(() => {
            alert("Prescription saved successfully!");
            onClose();
        }, 500);
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
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black bg-opacity-50 p-4">
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
                            onClick={onClose}
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
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                    value={medicine.name}
                                                    onChange={(e) => updateMedicine(medicine.id, 'name', e.target.value)}
                                                    placeholder="e.g., Paracetamol 500mg"
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
                                onClick={onClose}
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