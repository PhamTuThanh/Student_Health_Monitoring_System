import React, { useEffect, useState } from "react";
import { User, Calendar, Stethoscope, Plus, X, Save, FileText, Pill, Trash } from "lucide-react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import AddPrescription from "../../components/AddPrescription";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

const SYMPTOMS = [
  { group: "Consciousness", options: ["Daze", "Pass out", "Loss of consciousness", "Awake"] },
  { group: "Respiratory", options: ["Difficulty breathing", "Fast breathing", "Slow breathing"] },
  { group: "Heart", options: ["Fast heartbeat", "Slow heartbeat", "High blood pressure", "Low blood pressure"] },
  { group: "Nervous system", options: ["Seizure", "Dizzy", "Stutter", "Paralysis"] },
  { group: "Gastrointestinal", options: ["Nausea", "Abdominal pain", "Vomiting"] },
  { group: "Temperature", options: ["Fever", "Chills"] },
  { group: "Other", options: ["Other"] },
];

export default function AbnormalityDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { hideNavbar, showNavbar } = useAppContext();
  const [student, setStudent] = useState(location.state?.student || null);
  const [abnormalities, setAbnormalities] = useState([]);
  const [prescriptions, setPrescriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedAbnormality, setSelectedAbnormality] = useState(null);

  // Form state
  const [doctorName, setDoctorName] = useState("");
  const [date, setDate] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [treatment, setTreatment] = useState("");
  const [otherSymptoms, setOtherSymptoms] = useState({});

  // Fetch prescription data for each abnormality
  const fetchPrescriptions = async (abnormalityList) => {
    const prescriptionMap = {};
    for (const abnormality of abnormalityList) {
      try {
        const response = await axios.get(`http://localhost:9000/api/doctor/get-prescription/abnormality/${abnormality._id}`);
        if (response.data.success) {
          prescriptionMap[abnormality._id] = response.data.data;
        }
      } catch (error) {
        console.log("Error fetching prescription for abnormality", abnormality._id, error);
        prescriptionMap[abnormality._id] = [];
      }
    }
    setPrescriptions(prescriptionMap);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!student) {
        const studentRes = await axios.get(`http://localhost:9000/api/doctor/students/${id}`);
        setStudent(studentRes.data.student);
      }
      
      const abnormalityRes = await axios.get(`http://localhost:9000/api/doctor/abnormality?studentId=${id}`);
      const abnormalityData = abnormalityRes.data.data || [];
      setAbnormalities(abnormalityData);
      
      // Fetch prescriptions for all abnormalities
      await fetchPrescriptions(abnormalityData);
      
      setLoading(false);
    };
    
    loadData();
  }, [id, showForm, showPrescriptionForm]);

  const handleOpenForm = () => {
    hideNavbar();
    setShowForm(true);
  };

  const handleCloseForm = () => {
    showNavbar();
    setShowForm(false);
    // Reset form
    setDoctorName("");
    setDate("");
    setSelectedSymptoms([]);
    setTreatment("");
    setOtherSymptoms({});
  };
    

  const handleSymptomChange = (symptom, groupName) => {
    if (symptom === "Other") {
      const key = `${groupName}_Other`;
      if (selectedSymptoms.includes(key)) {
        // Remove Other and its custom text
        setSelectedSymptoms((prev) => prev.filter((s) => s !== key));
        setOtherSymptoms((prev) => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      } else {
        // Add Other
        setSelectedSymptoms((prev) => [...prev, key]);
        setOtherSymptoms((prev) => ({ ...prev, [key]: "" }));
      }
    } else {
      setSelectedSymptoms((prev) =>
        prev.includes(symptom)
          ? prev.filter((s) => s !== symptom)
          : [...prev, symptom]
      );
    }
  };
  
  const handleOtherSymptomTextChange = (key, value) => {
    setOtherSymptoms((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Process symptoms to include custom "Other" text
    const processedSymptoms = selectedSymptoms.map(symptom => {
      if (symptom.endsWith('_Other') && otherSymptoms[symptom]) {
        return `${symptom.replace('_Other', '')}: ${otherSymptoms[symptom]}`;
      }
      return symptom;
    });
    
    await axios.post("http://localhost:9000/api/doctor/abnormality", {
      student: id,
      studentId: student.studentId,
      studentName: student.name,
      doctorName,
      date,
      symptoms: processedSymptoms,
      temporaryTreatment: treatment,
    });
    handleCloseForm();
  };

  const handleOpenPrescriptionForm = (abnormality) => {
    hideNavbar();
    setSelectedAbnormality(abnormality);
    setShowPrescriptionForm(true);
  };

  const handleClosePrescriptionForm = () => {
    showNavbar();
    setShowPrescriptionForm(false);
  };

  const handleOpenPrescriptionModal = (abnormality) => {
    hideNavbar();
    setSelectedAbnormality(abnormality);
    setShowPrescriptionModal(true);
  };

  const handleClosePrescriptionModal = () => {
    showNavbar();
    setShowPrescriptionModal(false);
  };

  const handleDeleteAbnormality = async (abnormalityId) => {
    // Confirmation dialog
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this medical record?\n\nThis action will also delete all associated prescriptions and cannot be undone."
    );
    
    if (!isConfirmed) return;

    try {
      await axios.delete(`http://localhost:9000/api/doctor/abnormality/${abnormalityId}`);
      
      // Update local state
      setAbnormalities((prev) => prev.filter((a) => a._id !== abnormalityId));
      
      // Remove prescriptions from local state
      setPrescriptions((prev) => {
        const updated = { ...prev };
        delete updated[abnormalityId];
        return updated;
      });
      
      // Success message
      toast.success("Medical record deleted successfully!");
      
    } catch (error) {
      console.error("Error deleting abnormality:", error);
      toast.error("Failed to delete medical record. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 h-[calc(100vh-40px)] overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {student?.name || "Loading..."}
                </h1>
                <div className="flex items-center space-x-6 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Class: {student?.cohort}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="font-medium">ID: {student?.studentId}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleOpenForm}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-3"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Record</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-[54px]">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-xl">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Medical Abnormalities</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-blue-200 rounded-full animate-bounce"></div>
              </div>
            </div>
          ) : abnormalities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-gray-100 p-8 rounded-full mb-6">
                <FileText className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Records Found</h3>
              <p className="text-gray-500 text-center max-w-md">
                No medical abnormalities have been recorded for this student yet. Click "Add New Record" to create the first entry.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {abnormalities
                .filter(a => a.studentId === student?.studentId)
                .map((abnormality, idx) => (
                  <div
                    key={abnormality._id}
                    className="bg-gradient-to-r from-white to-blue-50 rounded-2xl border border-blue-200 p-8 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl font-bold">
                          #{idx + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Medical Record Entry
                          </h3>
                          <p className="text-gray-600">
                            {abnormality.date
                              ? new Date(abnormality.date).toLocaleDateString("vi-VN")
                              : "No date specified"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleOpenPrescriptionForm(abnormality)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2"
                        >
                          <Pill className="w-4 h-4" />
                          <span>Add Prescription</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteAbnormality(abnormality._id)}
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2"
                        >
                          <Trash className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Medical Information */}
                    <div className="space-y-6">
                      {/* <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold text-gray-700">Doctor</span>
                          </div>
                          <p className="text-gray-900 font-medium">{abnormality.doctorName}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold text-gray-700">Date</span>
                          </div>
                          <p className="text-gray-900 font-medium">
                            {abnormality.date
                              ? new Date(abnormality.date).toLocaleDateString("vi-VN")
                              : "Not specified"}
                          </p>
                        </div>
                      </div> */}

                      {/* Symptoms & Treatment */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <div className="flex items-center space-x-2 mb-3">
                            <Stethoscope className="w-4 h-4 text-red-500" />
                            <span className="font-semibold text-gray-700">Symptoms</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {abnormality.symptoms && abnormality.symptoms.length > 0
                              ? abnormality.symptoms.map((sym, i) => (
                                <span
                                  key={i}
                                  className="bg-gradient-to-r from-red-100 to-pink-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium border border-red-200"
                                >
                                  {sym}
                                </span>
                              ))
                              : <span className="text-gray-500 italic">No symptoms recorded</span>}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-gray-700">Temporary Treatment</span>
                          </div>
                          <p className="text-gray-900 leading-relaxed">
                            {abnormality.temporaryTreatment || "No treatment specified"}
                          </p>
                        </div>
                      </div>

                      {/* Prescriptions Section */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Pill className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-gray-800">Prescriptions</span>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {prescriptions[abnormality._id] && prescriptions[abnormality._id].length > 0 ? (
                              <>
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                  {prescriptions[abnormality._id].length} prescription{prescriptions[abnormality._id].length > 1 ? 's' : ''}
                                </span>
                                <button
                                  onClick={() => handleOpenPrescriptionModal(abnormality)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center space-x-2"
                                >
                                  <Pill className="w-4 h-4" />
                                  <span>View Prescriptions</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-gray-500 text-sm italic">No prescriptions yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Medical Record</h2>
                  <button
                    onClick={handleCloseForm}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      required
                      placeholder="Enter doctor's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Symptoms
                  </label>
                  <div className="grid md:grid-cols-2 gap-6">
                    {SYMPTOMS.map((group) => (
                      <div key={group.group} className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                          {group.group}
                        </h4>
                        <div className="space-y-2">
                          {group.options.map((sym) => {
                            const isOther = sym === "Other";
                            const otherKey = `${group.group}_Other`;
                            const isOtherSelected = isOther && selectedSymptoms.includes(otherKey);
                            const isRegularSelected = !isOther && selectedSymptoms.includes(sym);
                            
                            return (
                              <div key={sym}>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    checked={isOther ? isOtherSelected : isRegularSelected}
                                    onChange={() => handleSymptomChange(sym, group.group)}
                                  />
                                  <span className="text-sm text-gray-700">{sym}</span>
                                </label>
                                
                                {isOther && isOtherSelected && (
                                  <div className="mt-2 ml-7">
                                    <input
                                      type="text"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder={`Specify other ${group.group.toLowerCase()} symptom...`}
                                      value={otherSymptoms[otherKey] || ""}
                                      onChange={(e) => handleOtherSymptomTextChange(otherKey, e.target.value)}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Temporary Treatment
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={4}
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    placeholder="Describe the temporary treatment provided..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Record</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPrescriptionForm && selectedAbnormality && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <AddPrescription selectedAbnormality={selectedAbnormality} onClose={handleClosePrescriptionForm} />
          </div>
        )}

        {/* Prescription View Modal */}
        {showPrescriptionModal && selectedAbnormality && prescriptions[selectedAbnormality._id] && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-full">
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Medical Prescriptions</h3>
                      <p className="text-green-100 text-sm">
                        For: {selectedAbnormality?.studentName || "Patient"} - {selectedAbnormality.date ? new Date(selectedAbnormality.date).toLocaleDateString("vi-VN") : "No date"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClosePrescriptionModal}
                    className="text-white hover:text-green-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
                <div className="space-y-6">
                  {prescriptions[selectedAbnormality._id].map((prescription, prescIdx) => (
                    <div key={prescription._id} className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h4 className="text-xl font-bold text-gray-800 mb-2">
                            Prescription #{prescIdx + 1}
                          </h4>
                          <div className="flex items-center space-x-6 text-gray-600">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>Dr. {prescription.doctorName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {prescription.prescriptionDate
                                  ? new Date(prescription.prescriptionDate).toLocaleDateString("vi-VN")
                                  : "No date specified"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold">
                          Active
                        </span>
                      </div>

                      {prescription.diagnosis && (
                        <div className="mb-6 bg-white p-4 rounded-xl border border-green-200">
                          <h5 className="font-semibold text-gray-700 mb-2 flex items-center">
                            <Stethoscope className="w-4 h-4 mr-2" />
                            Diagnosis
                          </h5>
                          <p className="text-gray-800">{prescription.diagnosis}</p>
                        </div>
                      )}

                      <div className="bg-white p-6 rounded-xl border border-green-200">
                        <h5 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                          <Pill className="w-5 h-5 mr-2 text-green-600" />
                          Prescribed Medicines
                        </h5>
                        
                        <div className="space-y-4">
                          {prescription.medicines.map((medicine, medIdx) => (
                            <div key={medIdx} className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h6 className="text-lg font-bold text-gray-800">
                                    {medicine.drugId?.drugName || "Unknown Medicine"}
                                  </h6>
                                  {medicine.drugId?.drugCode && (
                                    <p className="text-gray-500 text-sm">Code: {medicine.drugId.drugCode}</p>
                                  )}
                                </div>
                                <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-bold">
                                  {medicine.quantity} {medicine.drugId?.drugUnit || "units"}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <span className="font-semibold text-gray-600 text-sm block mb-1">Dosage</span>
                                  <p className="text-gray-800 font-medium">{medicine.dosage}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <span className="font-semibold text-gray-600 text-sm block mb-1">Frequency</span>
                                  <p className="text-gray-800 font-medium">{medicine.frequency}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <span className="font-semibold text-gray-600 text-sm block mb-1">Duration</span>
                                  <p className="text-gray-800 font-medium">{medicine.duration || "As needed"}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <span className="font-semibold text-gray-600 text-sm block mb-1">Timing</span>
                                  <p className="text-gray-800 font-medium">
                                    {medicine.beforeAfterMeal === 'before' && 'Before meal'}
                                    {medicine.beforeAfterMeal === 'after' && 'After meal'}
                                    {medicine.beforeAfterMeal === 'with' && 'With meal'}
                                    {medicine.beforeAfterMeal === 'anytime' && 'Anytime'}
                                  </p>
                                </div>
                              </div>

                              {medicine.instructions && (
                                <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                  <span className="font-semibold text-yellow-700 text-sm block mb-2">Special Instructions:</span>
                                  <p className="text-yellow-800">{medicine.instructions}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {prescription.notes && (
                        <div className="mt-6 bg-amber-50 p-4 rounded-xl border border-amber-200">
                          <h5 className="font-semibold text-amber-700 mb-2 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Additional Notes & Warnings
                          </h5>
                          <p className="text-amber-800">{prescription.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex justify-end">
                  <button
                    onClick={handleClosePrescriptionModal}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}