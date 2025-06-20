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
      setMessage(res.data.message || "Tạo lần khám thành công!");
      toast.success(res.data.message || "Tạo lần khám thành công!");
    setForm({ examSessionName: "", examSessionDate: "", examSessionAcademicYear: "", examSessionDescription: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded shadow ml-10 h-[calc(100vh-4rem)] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Tạo lần khám mới</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Tên đợt khám</label>
          <input
            type="text"
            name="examSessionName"
            value={form.examSessionName}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Ví dụ: Khám sức khỏe đầu năm"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Ngày khám</label>
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
          <label className="block font-semibold mb-1">Năm học</label>
          <input
            type="text"
            name="examSessionAcademicYear"
            value={form.examSessionAcademicYear}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Ví dụ: 2024-2025"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Mô tả (tuỳ chọn)</label>
          <textarea
            name="examSessionDescription"
            value={form.examSessionDescription}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Ghi chú thêm về đợt khám"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Đang tạo..." : "Tạo lần khám"}
        </button>
      </form>
      {message && (
        <div className="mt-4 text-center text-green-600 font-semibold">{message}</div>
      )}
    </div>
  );
};

export default AddExamSession;