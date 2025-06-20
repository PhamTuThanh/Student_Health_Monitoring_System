import React, { useEffect, useState } from "react";
import { User, Calendar, Stethoscope, Plus, X, Save, FileText, Pill } from "lucide-react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";

const SYMPTOMS = [
  { group: "Consciousness", options: ["Daze", "Pass out", "Loss of consciousness", "Awake"] },
  { group: "Respiratory", options: ["Difficulty breathing", "Fast breathing", "Slow breathing"] },
  { group: "Heart", options: ["Fast heartbeat", "Slow heartbeat", "High blood pressure", "Low blood pressure"] },
  { group: "Nervous system", options: ["Seizure", "Dizzy", "Stutter", "Paralysis"] },
  { group: "Gastrointestinal", options: ["Nausea", "Abdominal pain", "Vomiting", "Other"] },
  { group: "Temperature", options: ["Fever", "Chills", "Other"] },
  { group: "Other", options: ["Trauma", "Bleeding", "Pain", "Other"] },
];

export default function AbnormalityDetail() {
  // Mock data for demonstration - replace with your actual router and API logic
  const { id } = useParams();
  const location = useLocation();
  const [student, setStudent] = useState(location.state?.student || null);
  const [abnormalities, setAbnormalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [selectedAbnormality, setSelectedAbnormality] = useState(null);


  // Form state
  const [doctorName, setDoctorName] = useState("");
  const [date, setDate] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [treatment, setTreatment] = useState("");

  useEffect(() => {
    if (!student) {
      axios.get(`http://localhost:9000/api/doctor/students/${id}`).then(res => {
        setStudent(res.data.student);
      });
    }
    axios.get(`http://localhost:9000/api/doctor/abnormality?studentId=${id}`).then(res => {
      setAbnormalities(res.data.data || []);
      setLoading(false);
    });
  }, [id, showForm]);
    

  const handleSymptomChange = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:9000/api/doctor/abnormality", {
      student: id,
      studentId: student.studentId,
      studentName: student.name,
      doctorName,
      date,
      symptoms: selectedSymptoms,
      temporaryTreatment: treatment,
    });
    setShowForm(false);
    // Reset form
    setDoctorName("");
    setDate("");
    setSelectedSymptoms([]);
    setTreatment("");
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
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-3"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Record</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
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
                      <button
                        onClick={() => {
                          setSelectedAbnormality(abnormality);
                          setShowPrescriptionForm(true);
                        }}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2"
                      >
                        <Pill className="w-4 h-4" />
                        <span>Add Prescription</span>
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
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
                      </div>

                      <div className="space-y-4">
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
                            <span className="font-semibold text-gray-700">Treatment</span>
                          </div>
                          <p className="text-gray-900 leading-relaxed">
                            {abnormality.temporaryTreatment || "No treatment specified"}
                          </p>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Medical Record</h2>
                  <button
                    onClick={() => setShowForm(false)}
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
                          {group.options.map((sym) => (
                            <label key={sym} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                checked={selectedSymptoms.includes(sym)}
                                onChange={() => handleSymptomChange(sym)}
                              />
                              <span className="text-sm text-gray-700">{sym}</span>
                            </label>
                          ))}
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
                    onClick={() => setShowForm(false)}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Prescription</h3>
              <p className="text-gray-600 mb-4">Prescription form would be implemented here</p>
              <button
                onClick={() => setShowPrescriptionForm(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}