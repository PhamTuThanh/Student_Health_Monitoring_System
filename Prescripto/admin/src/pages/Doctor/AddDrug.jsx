import React, { useState, useRef, useContext } from 'react';
import axios from 'axios';
import { assets } from '../../assets/assets';
import { DoctorContext } from '../../context/DoctorContext';
import { toast } from 'react-toastify';
import ImportExcelModal from '../../components/ImportExcelModal';
import { Upload, Plus, FileSpreadsheet, Camera, Package, Calendar, User, FileText, Tag, Hash } from 'lucide-react';
import { useNavbarControl } from '../../hooks/useNavbarControl';

function AddDrug({ onClose, onSuccess }) {
    const { dToken, backendUrl } = useContext(DoctorContext)
    const { hideNavbar, showNavbar } = useNavbarControl(false);
    const [drugImage, setDrugImage] = useState(null);
    const [drugName, setDrugName] = useState('');
    const [drugCode, setDrugCode] = useState('');
    const [drugType, setDrugType] = useState('');
    const [drugUnit, setDrugUnit] = useState('');
    const [inventoryQuantity, setInventoryQuantity] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [notes, setNotes] = useState('');
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

     const drugTypes = [
        { value: 'Antibiotic', label: 'Antibiotic (Kháng sinh)' },
        { value: 'Analgesic', label: 'Analgesic (Giảm đau)' },
        { value: 'Antipyretic', label: 'Antipyretic (Hạ sốt)' },
        { value: 'Antiseptic', label: 'Antiseptic (Kháng khuẩn)' },
        { value: 'Supplement', label: 'Supplement (Bổ sung)' },
        { value: 'Vaccine', label: 'Vaccine (Vacxin)' },
        { value: 'Hormone', label: 'Hormone (Hooc môn)' },
        { value: 'Controlled drug', label: 'Controlled drug (Thuốc điều trị)' },
        { value: 'Other', label: 'Other (Khác)' }
    ];
    
    const onSubmitHandler = async (event) => {
        event.preventDefault()
        setLoading(true);
    try {
      if (!drugImage) {
        return toast.error('Image Not Selected')
      }
            const formData = new FormData();
            formData.append('drugImage', drugImage);
            formData.append('drugName', drugName);
            formData.append('drugCode', drugCode);
            formData.append('drugType', drugType);
            formData.append('drugUnit', drugUnit);
            formData.append('inventoryQuantity', inventoryQuantity);
            formData.append('expiryDate', expiryDate);
            formData.append('supplierName', supplierName);
            formData.append('notes', notes);   
            formData.forEach((value, key) => {
                console.log(`${key} : ${value}`);
            })
            const res = await axios.post(`${backendUrl}/api/doctor/add-drug`, formData)
            if (res.data.success) {
                toast.success(res.data.message);
                setDrugImage(false);
                setDrugName('');
                setDrugCode('');
                setDrugType('');
                setDrugUnit('');
                setInventoryQuantity('');
                setExpiryDate('');
                setSupplierName('');
                setNotes('');
                showNavbar();
                onSuccess?.();
            } else {
                toast.error(res.data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
            console.log(err);
        }
        setLoading(false);
    };

 return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            {/* <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Add New Drug</h1>
                    <p className="text-gray-600 mt-1">Add drug information to your inventory</p>
                </div>
            </div> */}

            <div
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
              style={{ maxHeight: "90vh", overflowY: "auto" }}
            >
              {/* Image Upload Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b">
                  <div className="flex items-center justify-between gap-6">
                      {/* Left: Ảnh và mô tả */}
                      <div className="flex items-center gap-4">
                          <div className="relative group">
                              <label htmlFor="drug-img" className="cursor-pointer">
                                  <div className="w-24 h-24 bg-white rounded-2xl shadow-md flex items-center justify-center overflow-hidden group-hover:shadow-lg transition">
                                      {drugImage ? (
                                          <img 
                                              className="w-full h-full object-cover" 
                                              src={URL.createObjectURL(drugImage)} 
                                              alt="Drug preview" 
                                          />
                                      ) : (
                                          <Camera className="w-8 h-8 text-gray-400" />
                                      )}
                                  </div>
                              </label>
                              <input 
                                  onChange={(e) => setDrugImage(e.target.files[0])} 
                                  type="file" 
                                  id="drug-img" 
                                  hidden 
                                  ref={fileInputRef} 
                                  accept="image/*" 
                              />
                          </div>
                          <div>
                              <h3 className="text-lg font-semibold text-gray-900">Drug Image</h3>
                              <p className="text-gray-600">Upload a clear image of the drug packaging</p>
                              <p className="text-sm text-gray-500 mt-1">Recommended: 1:1 aspect ratio, max 5MB</p>
                          </div>
                      </div>
                      {/* Right: Nút Import Excel và Save */}
                      <div className="flex flex-col gap-2 items-end">
                          <button
                              type="button"
                              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition shadow-lg"
                              onClick={() => {
                                  hideNavbar();
                                  setShowModal(true);
                              }}
                          >
                              <FileSpreadsheet className="w-5 h-5" />
                              Import Excel
                          </button>
                          {/* <button
                              type="submit"
                              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={loading}
                              form="add-drug-form"
                          >
                              {loading ? (
                                  <>
                                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      Saving...
                                  </>
                              ) : (
                                  <>
                                      <Plus className="w-5 h-5" />
                                      Save Drug
                                  </>
                              )}
                          </button> */}
                      </div>
                  </div>
              </div>

              {/* Form Fields */}
              <div
                className="p-8"
              >
                <form id="add-drug-form" onSubmit={onSubmitHandler}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Drug Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Tag className="w-4 h-4" />
                                Drug Name *
                            </label>
                            <input 
                                onChange={(e) => setDrugName(e.target.value)} 
                                value={drugName} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
                                type="text" 
                                placeholder="Enter drug name" 
                                required 
                            />
                        </div>

                        {/* Drug Code */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Drug Code *
                            </label>
                            <input 
                                onChange={(e) => setDrugCode(e.target.value)} 
                                value={drugCode} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
                                type="text" 
                                placeholder="Enter drug code" 
                                required 
                            />
                        </div>

                        {/* Drug Type */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Drug Type *
                            </label>
                            <select 
                                onChange={(e) => setDrugType(e.target.value)} 
                                value={drugType} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
                                required
                            >
                                <option value="">Select Drug Type</option>
                                {drugTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Drug Unit */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Drug Unit *
                            </label>
                            <input 
                                onChange={(e) => setDrugUnit(e.target.value)} 
                                value={drugUnit} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
                                type="text" 
                                placeholder="e.g. box, tablet, bottle" 
                                required 
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Inventory Quantity */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Inventory Quantity *
                            </label>
                            <input 
                                onChange={(e) => setInventoryQuantity(e.target.value)} 
                                value={inventoryQuantity} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
                                type="number" 
                                min="0" 
                                placeholder="Enter quantity" 
                                required 
                            />
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Expiry Date *
                            </label>
                            <input 
                                onChange={(e) => setExpiryDate(e.target.value)} 
                                value={expiryDate} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
                                type="date" 
                                required 
                            />
                        </div>

                        {/* Supplier Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4" />
                                Supplier Name
                            </label>
                            <input 
                                onChange={(e) => setSupplierName(e.target.value)} 
                                value={supplierName} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
                                type="text" 
                                placeholder="Enter supplier name" 
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4" />
                                Notes
                            </label>
                            <textarea 
                                onChange={(e) => setNotes(e.target.value)} 
                                value={notes} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none" 
                                placeholder="Additional notes about the drug" 
                                rows={4} 
                            />
                        </div>
                        <div className="flex justify-end space-x-4 pt-6">
                            <button
                                type="button"
                                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center space-x-2"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={loading}
                              form="add-drug-form"
                          >
                              {loading ? (
                                  <>
                                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      Saving...
                                  </>
                              ) : (
                                  <>
                                      Save Drug
                                  </>
                              )}
                          </button>
                      </div>
                        
                    </div>
                </div>
                </form>
              </div>
            </div>

            <ImportExcelModal
                open={showModal}
                onClose={() => {
                    showNavbar();
                    setShowModal(false);
                }}
                type="drugs"
            />
        </div>
    </div>
);
}

export default AddDrug;