import React, { useContext, useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import { toast } from 'react-toastify'
import { DoctorContext } from '../context/DoctorContext'
import { useAppContext } from '../context/AppContext'
import { User, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Login = () => {
  const [state, setState] = useState('Admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const { setAToken, backendUrl } = useContext(AdminContext)
  const { setDToken } = useContext(DoctorContext)
  const { fetchUserData } = useAppContext()

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    
    try {
      if (state === 'Admin') {
        const { data } = await axios.post(backendUrl + '/api/admin/login', { email, password })
        if (data.success) {
          setAToken(true)
          toast.success('Admin login successful!')
          navigate('/admin-dashboard')
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(backendUrl + '/api/doctor/login', { email, password })
        if (data.success) {
          setDToken(true)
          // Fetch userData after login for socket connection
          setTimeout(() => {
            fetchUserData()
          }, 1000)
          toast.success('Doctor login successful!')
          navigate('/doctor-dashboard')
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error(error.message)
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-40 animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-pink-200 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute bottom-40 right-10 w-12 h-12 bg-indigo-200 rounded-full opacity-60 animate-bounce"></div>
      </div>

      <div className="w-full max-w-md transform transition-all duration-500 hover:scale-105">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {state} Login
            </h1>
            <p className="text-gray-500 mt-2">Welcome back! Please sign in to continue.</p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6 transition-all duration-300">
            <button
              type="button"
              onClick={() => setState('Admin')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                state === 'Admin'
                  ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setState('Doctor')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                state === 'Doctor'
                  ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Doctor
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6" onSubmit={onSubmitHandler}>
            {/* Email Field */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              onClick={onSubmitHandler}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          {/* Role Switch */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {state === 'Admin' ? 'Need doctor access?' : 'Need admin access?'}
              <button
                type="button"
                onClick={() => setState(state === 'Admin' ? 'Doctor' : 'Admin')}
                className="ml-2 text-blue-600 hover:text-purple-600 font-medium transition-colors duration-300 hover:underline"
              >
                Switch to {state === 'Admin' ? 'Doctor' : 'Admin'} Login
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Secure login powered by advanced encryption
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login