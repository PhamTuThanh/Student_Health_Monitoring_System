import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import AddPrescription from "../../components/AddPrescription";

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
    // console.log("submit called")
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
    <div className="w-full max-w-6xl m-5">
      {/* Header: Thông tin học sinh + Nút Thêm */}
      <div className="flex items-center justify-between mb-4 w-full">
        <div>
          <div className="font-bold text-lg">Student: {student?.name}</div>
          <div className="text-sm text-gray-500">
            Class: {student?.cohort} &nbsp;|&nbsp; Student ID: {student?.studentId}
          </div>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold"
          onClick={() => setShowForm(true)}
        >
          + Add
        </button>
      </div>
      {/* Box diễn biến bất thường full width */}
      <div className="bg-white rounded-xl shadow p-10 min-h-[350px] w-full flex flex-col items-center justify-center">
        <div className="font-semibold mb-4 w-full text-left text-lg">Abnormality</div>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setShowForm(false)}
                title="Close"
              >
                &times;
              </button>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Doctor Name</label>
                  <input
                    type="text"
                    className="border rounded px-3 py-2 w-full"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    className="border rounded px-3 py-2 w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Symptoms</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SYMPTOMS.map((group) => (
                      <div key={group.group}>
                        <div className="font-medium text-sm mb-1">{group.group}:</div>
                        {group.options.map((sym) => (
                          <label key={sym} className="inline-flex items-center mr-3 mb-1">
                            <input
                              type="checkbox"
                              className="mr-1"
                              checked={selectedSymptoms.includes(sym)}
                              onChange={() => handleSymptomChange(sym)}
                            />
                            {sym}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Temporary treatment</label>
                  <textarea
                    className="border rounded px-3 py-2 w-full"
                    rows={3}
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold"

                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded font-semibold"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {!showForm && (loading ? (
          <div>Loading...</div>
        ) : abnormalities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 w-full">
            <img src="/empty-data.svg" alt="empty" className="w-20 h-20 opacity-60 mb-2" />
            <div className="text-gray-400 text-lg">No data</div>
          </div>
        ) : (
          <div className="w-full">
            {/* Show list of abnormality if same student Id */}

            <div className="w-full flex flex-col gap-6">
              {abnormalities
                .filter(a => a.studentId === student.studentId || a.student === id)
                .map((abnormality, idx) => (
                  <div
                    key={abnormality._id}
                    className="bg-gray-50 rounded-xl shadow border border-gray-200 p-6 flex flex-col md:flex-row md:items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-base mb-1 text-blue-700">
                        Lần nhập #{idx + 1}
                      </div>
                      <div className="mb-1">
                        <span className="font-medium">Doctor:</span>{" "}
                        <span className="text-gray-800">{abnormality.doctorName}</span>
                      </div>
                      <div className="mb-1">
                        <span className="font-medium">Date:</span>{" "}
                        <span className="text-gray-800">
                          {abnormality.date
                            ? new Date(abnormality.date).toLocaleDateString("vi-VN")
                            : ""}
                        </span>
                      </div>
                      <div className="mb-1">
                        <span className="font-medium">Symptom:</span>{" "}
                        <span className="flex flex-wrap gap-2 mt-1">
                          {abnormality.symptoms && abnormality.symptoms.length > 0
                            ? abnormality.symptoms.map((sym, i) => (
                              <span
                                key={i}
                                className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold"
                              >
                                {sym}
                              </span>
                            ))
                            : <span className="text-gray-400">No symptoms</span>}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Temporary treatment:</span>{" "}
                        <span className="text-gray-800">{abnormality.temporaryTreatment}</span>

                      </div>
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded font-semibold mt-2"
                        onClick={() => {
                          setSelectedAbnormality(abnormality);
                          setShowPrescriptionForm(true);
                        }}
                      >
                        Add prescription
                      </button>
                    </div>
                  </div>
                ))}

            </div>
          </div>
        ))}
        {showPrescriptionForm && selectedAbnormality && (
          <AddPrescription
            selectedAbnormality={selectedAbnormality}
            onClose={() => setShowPrescriptionForm(false)}
          />
        )}
      </div>
    </div>
  );

}
