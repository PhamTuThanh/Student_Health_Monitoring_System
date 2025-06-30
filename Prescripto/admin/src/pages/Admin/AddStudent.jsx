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

  // Function to validate and convert date format
  const validateAndConvertDate = (dateString) => {
    if (!dateString) return null;
    
    // Remove any extra spaces
    const cleanDate = dateString.trim();
    
    // Check for DD/MM/YYYY format
    const ddmmyyyyPattern = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/;
    const ddmmyyyyMatch = cleanDate.match(ddmmyyyyPattern);
    
    // Check for MM/DD/YYYY format
    const mmddyyyyPattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(\d{4})$/;
    const mmddyyyyMatch = cleanDate.match(mmddyyyyPattern);
    
    let day, month, year;
    
    if (ddmmyyyyMatch) {
      // DD/MM/YYYY format
      day = parseInt(ddmmyyyyMatch[1]);
      month = parseInt(ddmmyyyyMatch[2]);
      year = parseInt(ddmmyyyyMatch[3]);
    } else if (mmddyyyyMatch) {
      // MM/DD/YYYY format
      month = parseInt(mmddyyyyMatch[1]);
      day = parseInt(mmddyyyyMatch[2]);
      year = parseInt(mmddyyyyMatch[3]);
    } else {
      throw new Error('Invalid date format. Please use DD/MM/YYYY or MM/DD/YYYY');
    }
    
    // Validate the date
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      throw new Error('Invalid date. Please check the day, month, and year values.');
    }
    
    // Return in YYYY-MM-DD format for backend
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      if (!studentImg) {
        return toast.error('Image Not Selected')
      }

      // Validate and convert date of birth
      let convertedDob;
      try {
        convertedDob = validateAndConvertDate(dob);
        if (!convertedDob) {
          return toast.error('Please enter a valid date of birth');
        }
      } catch (dateError) {
        return toast.error(dateError.message);
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
      formData.append('dob', convertedDob)
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
    <form onSubmit={onSubmitHandler} className="max-w-7xl mx-auto p-6 space-y-6 h-[calc(100vh-80px)] overflow-y-auto ml-10 w-[1000px]">
      <div className="flex items-center justify-between p-5 ">
        <h1 className="text-2xl font-bold text-gray-800">Add Student</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded shadow font-medium transition border-spacing-10"
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
              <input 
                onChange={(e) => setDob(e.target.value)} 
                value={dob} 
                className="border rounded px-3 py-2" 
                type="text" 
                placeholder="DD/MM/YYYY or MM/DD/YYYY" 
                pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\d{4}$|^(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])/\d{4}$"
                title="Please enter date in DD/MM/YYYY or MM/DD/YYYY format"
                required 
              />
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