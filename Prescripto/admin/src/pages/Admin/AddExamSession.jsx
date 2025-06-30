import React, { useContext, useState } from "react";
import axios from "axios";
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-toastify";

const AddExamSession = () => {
  const [form, setForm] = useState({
    examSessionName: "",
    examSessionDate: "",
    examSessionAcademicYear: "",
    examSessionDescription: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const { aToken } = useContext(AdminContext);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      // Gọi API backend
      const res = await axios.post(`${backendUrl}/api/admin/add-exam-session`, form, {
        headers: {
          aToken
        }
      });
      setMessage(res.data.message || "Create exam session successfully!");
      toast.success(res.data.message || "Create exam session successfully!");
    setForm({ examSessionName: "", examSessionDate: "", examSessionAcademicYear: "", examSessionDescription: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "An error occurred!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 h-[calc(100vh-80px)] overflow-y-auto ml-10 w-[1000px]">
      <h2 className="text-2xl font-bold mb-6 text-center">Add exam session</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Exam session name</label>
          <input
            type="text"
            name="examSessionName"
            value={form.examSessionName}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Example: Health check-up at the beginning of the year"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Exam date</label>
          <input
            type="date"
            name="examSessionDate"
            value={form.examSessionDate}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Academic year</label>
          <input
            type="text"
            name="examSessionAcademicYear"
            value={form.examSessionAcademicYear}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Example: 2024-2025"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Description (optional)</label>
          <textarea
            name="examSessionDescription"
            value={form.examSessionDescription}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Additional notes about the exam session"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create exam session"}
        </button>
      </form>
      {message && (
        <div className="mt-4 text-center text-green-600 font-semibold">{message}</div>
      )}
    </div>
  );
};

export default AddExamSession;