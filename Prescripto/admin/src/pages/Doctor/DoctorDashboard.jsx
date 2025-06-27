import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'

const DoctorDashboard = () => {
  const { dToken, dashData, setDashData, getDashData, backendUrl } = useContext(DoctorContext)
  const { currency } = useContext(AppContext)
  const [newsData, setNewsData] = useState([])
  const [examSessions, setExamSessions] = useState([])
  const [abnormalityData, setAbnormalityData] = useState([])
  const [drugStockData, setDrugStockData] = useState([])
  const [physicalFitnessStats, setPhysicalFitnessStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch news data
  const getNewsData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/admin/get-news')
      if (data.success) {
        setNewsData(data.news)
      }
    } catch (error) {
      console.log('Error fetching news:', error)
    }
  }

  // Fetch exam sessions data
  const getExamSessions = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/doctor/list-exam-sessions')
      if (data.success) {
        setExamSessions(data.data)
      }
    } catch (error) {
      console.log('Error fetching exam sessions:', error)
    }
  }

  // Fetch abnormality data
  const getAbnormalityData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/doctor/abnormality')
      if (data.success) {
        setAbnormalityData(data.data)
      }
    } catch (error) {
      console.log('Error fetching abnormality data:', error)
    }
  }

  // Fetch drug stock data
  const getDrugStockData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/doctor/get-drug-stock')
      if (data.success) {
        setDrugStockData(data.data)
      }
    } catch (error) {
      console.log('Error fetching drug stock data:', error)
    }
  }

  // Fetch physical fitness stats
  const getPhysicalFitnessStats = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/doctor/physical-fitness-status')
      if (data.success) {
        setPhysicalFitnessStats(data)
      }
    } catch (error) {
      console.log('Error fetching physical fitness stats:', error)
    }
  }

  useEffect(() => {
    if (dToken) {
      const fetchData = async () => {
        setLoading(true)
        await Promise.all([
          getDashData(),
          getNewsData(),
          getExamSessions(),
          getAbnormalityData(),
          getDrugStockData(),
          getPhysicalFitnessStats()
        ])
        setLoading(false)
      }
      fetchData()
    }
  }, [dToken])

  // Format date for Vietnamese display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get recent news for activity
  const getRecentActivity = () => {
    if (!newsData || newsData.length === 0) return []
    
    return newsData.slice(0, 3).map(news => ({
      message: `Tin tức mới: ${news.title}`,
      time: formatDate(news.date),
      type: 'news',
      category: news.category
    }))
  }

  // Get upcoming events from exam sessions
  const getUpcomingEvents = () => {
    if (!examSessions) return []
    
    const upcoming = examSessions
      .filter(session => new Date(session.examSessionDate) > new Date())
      .sort((a, b) => new Date(a.examSessionDate) - new Date(b.examSessionDate))
      .slice(0, 3)
    
    return upcoming.map(session => ({
      name: session.examSessionName,
      date: formatDate(session.examSessionDate),
      type: 'exam'
    }))
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-white bg-opacity-70">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-lg text-blue-600 font-semibold animate-pulse">Loading...</div>
      </div>
    );
  }

  return dashData && (
    <>
      <style>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .scrollbar-indicator {
          position: relative;
        }
        .scrollbar-indicator::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 2px;
          height: 20px;
          background: linear-gradient(180deg, #e2e8f0, transparent);
          pointer-events: none;
        }
      `}</style>
      <div className='w-full max-w-6xl m-5 h-[80vh] overflow-y-scroll'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
        <div className='flex items-center'>
          <div className='w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4'>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className='text-2xl font-semibold text-gray-900'>Doctor Dashboard</h1>
            <p className='text-gray-600'>Welcome back to the medical management system</p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <div className='flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all'>
          <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className='text-xl font-semibold text-gray-800'>{abnormalityData?.length || 0}</p>
            <p className='text-gray-500 text-sm'>Abnormalities</p>
          </div>
        </div>

        <div className='flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all'>
          <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <p className='text-xl font-semibold text-gray-800'>{drugStockData?.length || 0}</p>
            <p className='text-gray-500 text-sm'>Drug Types</p>
          </div>
        </div>

        <div className='flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all'>
          <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className='text-xl font-semibold text-gray-800'>{physicalFitnessStats?.daTDSK || 0}</p>
            <p className='text-gray-500 text-sm'>Physical Fitness Test</p>
          </div>
        </div>

        <div className='flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all'>
          <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center'>
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className='text-xl font-semibold text-gray-800'>{examSessions?.length || 0}</p>
            <p className='text-gray-500 text-sm'>Exam Sessions</p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
            <div className='flex items-center gap-3'>
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className='font-semibold text-gray-900'>Recent Abnormalities</p>
            </div>
            {abnormalityData && abnormalityData.length > 5 && (
              <div className='flex items-center gap-2 text-gray-500'>
                <span className='text-xs'>Scroll to see more</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </div>

          <div 
            className='max-h-[300px] md:max-h-[350px] overflow-y-scroll border-t border-gray-100 scrollbar-custom transition-all duration-200' 
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9'
            }}
          >
            {abnormalityData && abnormalityData.length > 0 ? (
              abnormalityData.map((item, index) => (
                <div className='flex items-start px-6 py-4 hover:bg-gray-50 border-b border-gray-100' key={index}>
                  <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                    </svg>
                  </div>
                  <div className='flex-1 ml-3'>
                    <div className='flex items-center justify-between'>
                      <p className='text-gray-900 font-medium'>{item.studentId}</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.severity === 'High' ? 'bg-red-100 text-red-800' :
                        item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.severity || 'Normal'}
                      </span>
                    </div>
                    <p className='text-gray-600 text-sm mt-1'>{item.abnormalityType}</p>
                    <p className='text-gray-500 text-xs mt-1'>{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className='p-6 text-center text-gray-500'>
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No abnormalities found</p>
              </div>
            )}
          </div>
          </div>

          <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
            <div className='px-4 py-3 border-b border-gray-200'>
              <h3 className='font-semibold text-gray-900'>Upcoming Events</h3>
            </div>
            <div className='p-4 space-y-3 max-h-64 overflow-y-auto'>
              {getUpcomingEvents().length > 0 ? (
                getUpcomingEvents().map((event, index) => (
                  <div key={index} className='border-l-4 border-blue-500 pl-3'>
                    <p className='text-sm font-medium text-gray-900'>{event.name}</p>
                    <p className='text-xs text-gray-500'>{event.date}</p>
                  </div>
                ))
              ) : (
                <div className='text-center py-6'>
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9v6a2 2 0 002 2h4a2 2 0 002-2v-6M8 7v10a2 2 0 002 2h4a2 2 0 002-2V7M8 7H6a2 2 0 00-2 2v2a2 2 0 002 2h2m8-6h2a2 2 0 012 2v2a2 2 0 01-2 2h-2" />
                  </svg>
                  <p className='text-sm text-gray-500'>No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar with Stats and Info */}
        <div className='space-y-6'>
          {/* Drug Stock Status */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
            <div className='px-4 py-3 border-b border-gray-200'>
              <h3 className='font-semibold text-gray-900'>Drug Stock Warning</h3>
            </div>
            <div className='p-4 space-y-3 max-h-64 overflow-y-auto'>
              {drugStockData && drugStockData.length > 0 ? (
                (() => {
                  // Lọc thuốc cần cảnh báo (số lượng ít hoặc gần hết hạn)
                  const getWarningDrugs = () => {
                    const now = new Date()
                    const warningDrugs = drugStockData.filter(drug => {
                      const isLowStock = drug.quantity < 20
                      const isExpiringSoon = drug.expiryDate && 
                        new Date(drug.expiryDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
                      return isLowStock || isExpiringSoon
                    })
                    
                    // Sắp xếp theo mức độ ưu tiên
                    return warningDrugs.sort((a, b) => {
                      const aUrgent = a.quantity < 5 || (a.expiryDate && new Date(a.expiryDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
                      const bUrgent = b.quantity < 5 || (b.expiryDate && new Date(b.expiryDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
                      
                      if (aUrgent && !bUrgent) return -1
                      if (!aUrgent && bUrgent) return 1
                      return a.quantity - b.quantity
                    })
                  }
                  
                  const warningDrugs = getWarningDrugs()
                  
                  if (warningDrugs.length === 0) {
                    return (
                      <div className='text-center py-4'>
                        <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className='text-sm text-green-600 font-medium'>Drug stock is stable</p>
                        <p className='text-xs text-gray-500'>No drugs need warning</p>
                      </div>
                    )
                  }
                  
                  return warningDrugs.slice(0, 6).map((drug, index) => {
                    const now = new Date()
                    const expiryDate = drug.expiryDate ? new Date(drug.expiryDate) : null
                    const isExpiringSoon = expiryDate && expiryDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                    const isExpiredOrCritical = expiryDate && expiryDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                    const isLowStock = drug.quantity < 20
                    const isCriticalStock = drug.quantity < 5
                    
                    let warningType = ''
                    let warningColor = ''
                    let warningIcon = ''
                    
                    if (isExpiredOrCritical || isCriticalStock) {
                      warningType = isExpiredOrCritical ? 'EXPIRED' : 'NEED SUPPLY'
                      warningColor = 'bg-red-100 border-red-200 text-red-800'
                      warningIcon = 'text-red-600'
                    } else if (isExpiringSoon || isLowStock) {
                      warningType = isExpiringSoon ? 'NEAR EXPIRED' : 'LOW STOCK'
                      warningColor = 'bg-yellow-100 border-yellow-200 text-yellow-800'
                      warningIcon = 'text-yellow-600'
                    }
                    
                    return (
                      <div key={index} className={`p-3 rounded-lg border ${warningColor}`}>
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex-1'>
                            <p className='text-sm font-medium text-gray-900'>{drug.drugName}</p>
                            <p className='text-xs text-gray-600'>{drug.manufacturer}</p>
                          </div>
                          <svg className={`w-5 h-5 ${warningIcon} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        
                        <div className='flex items-center justify-between text-xs'>
                          <span className={`px-2 py-1 rounded-full font-medium ${
                            isCriticalStock || isExpiredOrCritical ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {warningType}
                          </span>
                          <div className='text-right'>
                            <p className={`font-semibold ${
                              drug.quantity < 5 ? 'text-red-600' :
                              drug.quantity < 10 ? 'text-orange-600' :
                              'text-yellow-600'
                            }`}>
                              {drug.quantity} left
                            </p>
                            {expiryDate && (
                              <p className='text-gray-500'>
                                EXP: {expiryDate.toLocaleDateString('vi-VN')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()
              ) : (
                <p className='text-sm text-gray-500'>No drug stock data</p>
              )}
            </div>
          </div>

          {/* Physical Fitness Summary */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
            <div className='px-4 py-3 border-b border-gray-200'>
              <h3 className='font-semibold text-gray-900'>Health Statistics</h3>
            </div>
            <div className='p-4 space-y-3'>
              {physicalFitnessStats ? (
                <>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Total students:</span>
                    <span className='font-semibold text-gray-900'>{physicalFitnessStats.total}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Physical Fitness Test:</span>
                    <span className='font-semibold text-green-600'>{physicalFitnessStats.daTDSK}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Male:</span>
                    <span className='font-semibold text-blue-600'>{physicalFitnessStats.male}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Female:</span>
                    <span className='font-semibold text-pink-600'>{physicalFitnessStats.female}</span>
                  </div>
                  {/* {physicalFitnessStats.bmiStats && Object.keys(physicalFitnessStats.bmiStats).length > 0 && (
                    <div className='mt-4 pt-3 border-t border-gray-200'>
                      <p className='text-xs font-medium text-gray-700 mb-2'>BMI Classification:</p>
                      {Object.entries(physicalFitnessStats.bmiStats).map(([category, count]) => (
                        <div key={category} className='flex justify-between items-center text-xs'>
                          <span className='text-gray-600'>{category}:</span>
                          <span className='font-medium'>{count}</span>
                        </div>
                      ))}
                    </div>
                  )} */}
                </>
              ) : (
                <p className='text-sm text-gray-500'>No health statistics data</p>
              )}
            </div>
          </div>


        </div>
      </div>
      </div>
    </>
  )
}

export default DoctorDashboard
