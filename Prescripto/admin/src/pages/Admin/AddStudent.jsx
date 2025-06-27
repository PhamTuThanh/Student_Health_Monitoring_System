import React, { useContext, useState, useRef } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import ImportExcelModal from '../../components/ImportExcelModal'

function AddStudent() {

  const [studentImg, setStudentImg] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cohort, setCohort] = useState('Select Cohort')
  const [studentId, setStudentId] = useState('')
  const [about, setAbout] = useState('')
  const [major, setMajor] = useState('Select Major')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')

  const { backendUrl, aToken } = useContext(AdminContext)
  const fileInputRef = useRef(null)
  const [showModal, setShowModal] = useState(false)

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      if (!studentImg) {
        return toast.error('Image Not Selected')
      }
      const formData = new FormData()

      formData.append('image', studentImg)
      formData.append('name', name)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('cohort', cohort)
      formData.append('studentId', studentId)
      formData.append('about', about)
      formData.append('major', major)
      formData.append('dob', dob)
      formData.append('gender', gender)
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))

      //console log formdata
      formData.forEach((value, key) => {
        console.log(`${key} : ${value}`);
      })
      const { data } = await axios.post(backendUrl + '/api/admin/add-student', formData)
      if (data.success) {
        toast.success(data.message)
        setStudentImg(false)
        setName('')
        setEmail('')
        setPassword('')
        setCohort('')
        setStudentId('')
        setAbout('')
        setMajor('')
        setDob('')
        setGender('')
        setAddress1('')
        setAddress2('')

      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      console.log(error)
    }
  }
  // const handleImportExcel = async () => {
  //   const file = fileInputRef.current.files[0];
  //   if (!file) return alert('Chọn file excel!');
  //   const formData = new FormData();
  //   formData.append('file', file);
 
  //   try {
  //     const aToken = localStorage.getItem('aToken')
  //     const res = await axios.post(backendUrl + '/api/admin/import-students-excel', formData, {
  //       headers: { 'Content-Type': 'multipart/form-data', aToken: aToken }
  //     });
  //     alert(res.data.message);
  //   } catch (err) {
  //     alert('Lỗi import: ' + (err.response?.data?.message || err.message));
  //   }
  // };
  return (
    <form onSubmit={onSubmitHandler} className='m-5 w-full ml-10 max-h-[80vh] overflow-y-scroll'>
      <div className="flex items-center justify-between ">
        <h1 className="text-2xl font-bold text-gray-800">Add Student</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded shadow font-medium transition"
          onClick={() => setShowModal(true)}
        >
          Import Excel
        </button>
        <ImportExcelModal
          open={showModal}
          onClose={() => setShowModal(false)}
          templateUrl="/path/to/students_import.xlsx"
          type="students"
        />
      </div>


      <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl '>
        <div className='flex items-center gap-4 mb-8 text-gray-500'>
          <label htmlFor="doc-img">
            <img className='w-16 bg-gray-100 rounded-full cursor-pointer' src={studentImg ? URL.createObjectURL(studentImg) : assets.upload_area} alt="" />
          </label>
          <input onChange={(e) => setStudentImg(e.target.files[0])} type="file" id="doc-img" hidden />
          <p>Upload student <br /> picture</p>
        </div>

        <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>
          <div className='w-full lg:flex-1 flex flex-col gap-4'>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Student Name</p>
              <input onChange={(e) => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type="text" placeholder='Name' required />
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Student Email</p>
              <input onChange={(e) => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2' type="email" placeholder='Your email' required />
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Student Password</p>
              <input onChange={(e) => setPassword(e.target.value)} value={password} className='border rounded px-3 py-2' type="password" placeholder='Password' required />
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Cohort</p>
              <select onChange={(e) => setCohort(e.target.value)} value={cohort} className='border rounded px-3 py-2' name="" id="">
                <option value="Select Cohort">-- Select Cohort --</option>
                <option value="Cohort 65">Cohort 65</option>
                <option value="Cohort 64">Cohort 64</option>
                <option value="Cohort 63">Cohort 63</option>
                <option value="Cohort 62">Cohort 62</option>
                <option value="Cohort 61">Cohort 61</option>
                <option value="Cohort 60">Cohort 60</option>
                <option value="Cohort 59">Cohort 59</option>
              </select>
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Student ID</p>
              <input onChange={(e) => setStudentId(e.target.value)} value={studentId} className='border rounded px-3 py-2' type="number" placeholder='Your studentID' required />
            </div>

          </div>

          <div className='w-full lg:flex-1 flex flex-col gap-4'>
            <div className='flex-1 flex flex-col gap-1'>
              <p>Major</p>
              <select onChange={(e) => setMajor(e.target.value)} value={major} className='border rounded px-3 py-2' name="" id="">
                <option value="Select Major">-- Select Major --</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Transport Operation">Transport Operation</option>
                <option value="Architecture">Architecture </option>
                <option value="Accounting">Accounting </option>
                <option value="Logistic">Logistic</option>
                <option value="Automotive">Automotive </option>
              </select>
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Date Of Birth</p>
              <input onChange={(e) => setDob(e.target.value)} value={dob} className="border rounded px-3 py-2" type="date" required />
            </div>
            <div className='flex-1 flex flex-col gap-1'>
              <p>Gender</p>
              <select onChange={(e) => setGender(e.target.value)} value={gender} className='border rounded px-3 py-2' name="" id="">
                <option value="Select Gender">-- Select Gender --</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Address</p>
              <input onChange={(e) => setAddress1(e.target.value)} value={address1} className='border rounded px-3 py-2' type="text" placeholder='Permanent Address' required />
              <input onChange={(e) => setAddress2(e.target.value)} value={address2} className='border rounded px-3 py-2' type="text" placeholder='Place of Origin' required />
            </div>

          </div>
        </div>

        <div>
          <p className='mt-4 mb-2'>Note About Student</p>
          <textarea onChange={(e) => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' placeholder='Write about student' rows={5} required />
        </div>
        <button type='submit' className='bg-slate-500 px-10 py-3 mt-4 text-white rounded-full hover:bg-black cursor-pointer'>Add Student</button>
      </div>
    </form>
  )
}
export default AddStudent