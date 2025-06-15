import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const AddPrescription = ({ selectedAbnormality, onClose }) => {
    const [medicine, setMedicine] = useState("");
    const [dosage, setDosage] = useState("");
    const [instructions, setInstructions] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:9000/api/doctor/prescription", {
                abnormalityId: selectedAbnormality._id,
                medicine,
                dosage,
                instructions,
            });
            toast.success("Lưu đơn thuốc thành công!");
            setMedicine("");
            setDosage("");
            setInstructions("");
            onClose();
        } catch (err) {
            toast.error("Lưu đơn thuốc thất bại!");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
                    onClick={onClose}
                    title="Close"
                >
                    &times;
                </button>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Tên thuốc</label>
                        <input
                            type="text"
                            className="border rounded px-3 py-2 w-full"
                            value={medicine}
                            onChange={(e) => setMedicine(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Liều lượng</label>
                        <input
                            type="text"
                            className="border rounded px-3 py-2 w-full"
                            value={dosage}
                            onChange={(e) => setDosage(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Hướng dẫn dùng</label>
                        <textarea
                            className="border rounded px-3 py-2 w-full"
                            rows={3}
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold"
                        >
                            Lưu đơn thuốc
                        </button>
                        <button
                            type="button"
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded font-semibold"
                            onClick={onClose}
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPrescription;