import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  Image,
  Animated,
  RefreshControl,
} from 'react-native';
import { assets } from '../../assets/images/assets.js';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getInfoUser, getPhysicalData, getAbnormality, getHealthScores, getExamSessions, compareHealthData } from '../services/api/api';
import { useNavigation } from '@react-navigation/native';

// Import components
import ProfileCard from '../../components/home/ProfileCard';
import HealthMetricsGrid from '../../components/home/HealthMetricsGrid';
import ExamSessionSelector from '../../components/home/ExamSessionSelector';
import ComparisonView from '../../components/home/ComparisonView';
import OldDataBanner from '../../components/home/OldDataBanner';
import WelcomeCard from '../../components/home/WelcomeCard';

const { width } = Dimensions.get('window'); 

interface StudentData {
  name: string;
  studentId: string;
  cohort: string;
  major: string;
  email: string;
  phone: string;
  address: any;
  dob: string;
  gender: string;
  image?: string;
}

interface HealthMetrics {
  height: number;
  weight: number;
  bmi: string;
  heartRate: number;
  followDate: string;
  examSessionId?: {
    _id: string;
    examSessionName: string;
    examSessionAcademicYear: string;
    examSessionDate: string;
  };
}

interface ExamSession {
  _id: string;
  examSessionName: string;
  examSessionAcademicYear: string;
  examSessionDate: string;
}

interface ComparisonData {
  session1: {
    _id: string;
    name: string;
    academicYear: string;
    date: string;
    height: number;
    weight: number;
    bmi: string;
    systolic: number;
    diastolic: number;
    heartRate: number;
    danhGiaBMI: string;
    danhGiaTTH: string;
    [key: string]: any;
  };
  session2: {
    _id: string;
    name: string;
    academicYear: string;
    date: string;
    height: number;
    weight: number;
    bmi: string;
    systolic: number;
    diastolic: number;
    heartRate: number;
    danhGiaBMI: string;
    danhGiaTTH: string;
    [key: string]: any;
  };
  differences: {
    height: number;
    weight: number;
    bmi: string;
    systolic: number;
    diastolic: number;
    heartRate: number;
    [key: string]: any;
  };
}

interface HealthScores {
  physicalFitness: number;
  cardiovascular: number;
  respiratory: number;
  mental: number;
  overall: number;
}

interface AbnormalityRecord {
  _id: string;
  studentId: string;
  studentName: string;
  doctorName: string;
  date: string;
  symptoms: string[];
  temporaryTreatment: string;
}

const StudentHealthDashboard: React.FC = React.memo(() => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<string>('overview'); 
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [abnormalityHistory, setAbnormalityHistory] = useState<AbnormalityRecord[]>([]);
  const [healthScores, setHealthScores] = useState<HealthScores>({
    physicalFitness: 0,
    cardiovascular: 0,
    respiratory: 0,
    mental: 0,
    overall: 0
  });
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  
  // New states for handling old data
  const [hasAnyHealthData, setHasAnyHealthData] = useState(false);
  const [latestAvailableHealthData, setLatestAvailableHealthData] = useState<HealthMetrics | null>(null);
  const [isShowingOldData, setIsShowingOldData] = useState(false);

  // Animation refs
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading) {
      // Spinner rotation animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );

      // Text pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      spinAnimation.start();
      pulseAnimation.start();

      return () => {
        spinAnimation.stop();
        pulseAnimation.stop();
      };
    }
  }, [loading]);

  const fetchAll = useCallback(async (isRefresh = false, examSessionId: string | null = null, isSessionChange = false) => {
    try {
      // Set appropriate loading state
      if (isSessionChange) {
        setSessionLoading(true);
      }

      const user = await getInfoUser();
      
      if (!user?.userData) {
        throw new Error('User data not found');
      }
      
      setStudentData(user.userData);
      
      if (!user.userData.studentId) {
        throw new Error('Student ID not found');
      }

      // Get exam sessions
      try {
        const sessions = await getExamSessions(user.userData.studentId);
        if (sessions?.success && sessions?.data) {
          setExamSessions(sessions.data);
          
          // Set default to latest session if none selected
          if (!selectedSession && sessions.data.length > 0) {
            const latestSessionId = sessions.data[sessions.data.length - 1]._id;
            setSelectedSession(latestSessionId);
            examSessionId = latestSessionId;
          } else if (selectedSession) {
            examSessionId = selectedSession;
          }
        }
      } catch (sessionError) {
        console.warn('Failed to fetch exam sessions:', sessionError);
        setExamSessions([]);
      }

      try {
        // First, try to get data for the selected session
        const physical = await getPhysicalData(user.userData.studentId, examSessionId || undefined);
        
        let latestPhysical = null;
        let currentSessionHasData = false;
        
        if (physical?.success && physical?.data) {
          if (Array.isArray(physical.data) && physical.data.length > 0) {
            // get the latest record with all information
            const validRecords = physical.data.filter((record: any) => 
              record && 
              record.height && 
              record.weight && 
              record.bmi
            );
            if (validRecords.length > 0) {
              latestPhysical = validRecords[validRecords.length - 1];
              currentSessionHasData = true;
            }
          }
        }

        // If no data for current session, try to get data from any session
        if (!currentSessionHasData) {
          try {
            const allPhysical = await getPhysicalData(user.userData.studentId); // No session filter
            
            if (allPhysical?.success && allPhysical?.data) {
              if (Array.isArray(allPhysical.data) && allPhysical.data.length > 0) {
                const allValidRecords = allPhysical.data.filter((record: any) => 
                  record && 
                  record.height && 
                  record.weight && 
                  record.bmi
                );
                
                if (allValidRecords.length > 0) {
                  // Use the most recent data available
                  latestPhysical = allValidRecords[allValidRecords.length - 1];
                  setHasAnyHealthData(true);
                  setLatestAvailableHealthData(latestPhysical);
                  setIsShowingOldData(true);
                } else {
                  setHasAnyHealthData(false);
                  setIsShowingOldData(false);
                }
              } else {
                setHasAnyHealthData(false);
                setIsShowingOldData(false);
              }
            } else {
              setHasAnyHealthData(false);
              setIsShowingOldData(false);
            }
          } catch (allDataError) {
            console.warn('Failed to fetch all physical data:', allDataError);
            setHasAnyHealthData(false);
            setIsShowingOldData(false);
          }
        } else {
          setHasAnyHealthData(true);
          setIsShowingOldData(false);
        }
        
        setHealthMetrics(latestPhysical);
       
      } catch (physicalError) {
        console.warn('Failed to fetch physical data:', physicalError);
        setHealthMetrics(null);
        setHasAnyHealthData(false);
        setIsShowingOldData(false);
      }

      try {
        const abnormal = await getAbnormality(user.userData.studentId);
        
        setAbnormalityHistory(Array.isArray(abnormal?.data) ? abnormal.data : []);
        
        console.log('AbnormalityHistory set to:', Array.isArray(abnormal?.data) ? abnormal.data : []);
      } catch (abnormalError) {
        console.warn('Failed to fetch abnormal data:', abnormalError);
        setAbnormalityHistory([]);
      }

      try {
        const scores = await getHealthScores(user.userData.studentId);
        
        if (scores?.success && scores?.data) {
          setHealthScores(scores.data);
        }
      } catch (scoresError) {
        console.warn('Failed to fetch health scores:', scoresError);
      }

    } catch (err) {
      console.error('Error in fetchAll:', err);
      Alert.alert(
        'Error', 
        (err as Error).message || 'Could not load data. Please try again later.',
        [
          { text: 'Try again', onPress: () => fetchAll() },
          { text: 'Close', style: 'cancel' }
        ]
      );
    } finally {
      if (!isRefresh && !isSessionChange) {
        setLoading(false);
      }
      if (isSessionChange) {
        setSessionLoading(false);
      }
      setRefreshing(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchAll();
  }, []);

  // Fetch data when selected session changes
  useEffect(() => {
    if (selectedSession && studentData?.studentId) {
      fetchAll(false, selectedSession, true);
    }
  }, [selectedSession, studentData?.studentId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll(true, selectedSession || null);
  }, [fetchAll, selectedSession]);

  // Function to handle comparison between two exam sessions
  const handleCompareData = async () => {
    // Basic validation
    if (!studentData?.studentId) {
      Alert.alert('Error', 'Student information not found. Please try again.');
      return;
    }

    if (examSessions.length < 2) {
      Alert.alert(
        'Comparison not available', 
        'You need at least 2 exam sessions to compare data.\n\nPlease complete more health checkups to enable comparison feature.'
      );
      return;
    }

    try {
      // Array is sorted from oldest to newest
      // examSessions[0] = oldest, examSessions[length-1] = newest
      const latestSession = examSessions[examSessions.length - 1]; // Newest (last element)
      const previousSession = examSessions[examSessions.length - 2]; // Previous (second to last)
      
      // Validate sessions
      if (!latestSession?._id || !previousSession?._id) {
        Alert.alert('Error', 'Invalid exam session data. Please try again.');
        return;
      }

      console.log('Comparing sessions:', {
        previous: previousSession.examSessionAcademicYear,
        latest: latestSession.examSessionAcademicYear
      });
      
      // Call API with old session first, then new session
      // This ensures session1 = old data, session2 = new data
      const comparison = await compareHealthData(
        studentData.studentId,
        previousSession._id, // Old session first
        latestSession._id    // New session second
      );

      console.log('Comparison API response:', comparison);

      // Validate API response
      if (!comparison) {
        Alert.alert('Error', 'No response from server. Please check your connection and try again.');
        return;
      }

      if (!comparison.success) {
        const errorMessage = comparison.message || 'Unknown error occurred';
        Alert.alert('Comparison Failed', errorMessage);
        return;
      }

      if (!comparison.data) {
        Alert.alert(
          'No Data Available', 
          'No health data found for one or both exam sessions.\n\nPlease ensure you have completed health checkups for both sessions.'
        );
        return;
      }

      // Validate comparison data structure
      const { session1, session2, differences } = comparison.data;
      
      if (!session1 || !session2) {
        Alert.alert(
          'Incomplete Data', 
          'Health data is missing for one of the exam sessions.\n\nComparison requires complete data from both sessions.'
        );
        return;
      }

      // Check if sessions have required health metrics
      const requiredFields = ['height', 'weight', 'bmi', 'systolic', 'diastolic', 'heartRate'];
      const session1Missing = requiredFields.filter(field => !session1[field] && session1[field] !== 0);
      const session2Missing = requiredFields.filter(field => !session2[field] && session2[field] !== 0);

      if (session1Missing.length > 0 || session2Missing.length > 0) {
        let message = 'Some health metrics are missing:\n\n';
        if (session1Missing.length > 0) {
          message += `${session1.academicYear}: ${session1Missing.join(', ')}\n`;
        }
        if (session2Missing.length > 0) {
          message += `${session2.academicYear}: ${session2Missing.join(', ')}\n`;
        }
        message += '\nPlease complete all health measurements to enable full comparison.';
        
        Alert.alert('Incomplete Health Data', message);
        return;
      }

      // Success - show comparison
      setComparisonData(comparison.data);
      setShowComparison(true);
      
    } catch (error) {
      console.error('Error comparing data:', error);
      
      let errorMessage = 'Failed to compare health data. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Health data not found for comparison.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const getBMIStatus = (bmi: string) => {
    const bmiNum = parseFloat(bmi);
  
    if (isNaN(bmiNum)) {
      return { status: 'Invalid BMI', color: '#808080' }; 
    }
  
    if (bmiNum < 18.5) {
      return { status: 'Underweight', color: '#3B82F6' }; 
    } else if (18.5 <= bmiNum && bmiNum < 23) { 
      return { status: 'Normal', color: '#10B981' }; 
    } else if (23 <= bmiNum && bmiNum < 25) { 
      return { status: 'Overweight (Pre-obese)', color: '#F59E0B' }; 
    } else if (25 <= bmiNum && bmiNum < 30) { 
      return { status: 'Obese Class I', color: '#EF4444' }; 
    } else { 
      return { status: 'Obese Class II', color: '#CC0000' }; 
    }
  };
  const getHealthScoreStatus = (score: number) => {
    if (score >= 90) return 'High';
    if (75 <= score && score < 90) return 'Medium';
    if (60 <= score && score < 75) return 'Low';
    return 'Low';
  };  

  const getHealthScoreColor = (score: number): string => {

    if (score >= 90 && score <= 100) return '#10B981'; 
    if (75 <= score && score < 90) return '#3B82F6'; 
    if (60 <= score && score < 75) return '#F59E0B'; 
    if (score < 60) return '#EF4444'; 
    return '#EF4444'; 
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'High': return { bg: '#FEE2E2', text: '#991B1B' }; 
      case 'Medium': return { bg: '#FEF3C7', text: '#92400E' }; 
      case 'Low': return { bg: '#D1FAE5', text: '#065F46' }; 
      default: return { bg: '#F3F4F6', text: '#374151' }; 
    }
  };

  const handleContactHealthCenter = () => {
    Alert.alert(
      'Contact a doctor',
      'You will be redirected to the message page to chat with a doctor and receive health advice.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Go to messages', 
          onPress: () => navigation.navigate('messages' as never)
        }
      ]
    );
  };

  // Memoized computed values for better performance
  const memoizedBMIStatus = useMemo(() => {
    if (!healthMetrics?.bmi) return { status: 'No Data', color: '#808080' };
    return getBMIStatus(healthMetrics.bmi);
  }, [healthMetrics?.bmi]);

  const memoizedHealthScoreColor = useMemo(() => {
    return getHealthScoreColor(healthMetrics?.heartRate || 0);
  }, [healthMetrics?.heartRate]);

  const memoizedHealthScoreStatus = useMemo(() => {
    return getHealthScoreStatus(healthMetrics?.heartRate || 0);
  }, [healthMetrics?.heartRate]);

  // Memoized validation checks
  const hasValidHealthMetrics = useMemo(() => {
    return healthMetrics && 
      healthMetrics.height && 
      healthMetrics.weight && 
      healthMetrics.bmi;
  }, [healthMetrics]);

  // Memoized component sections
  const MemoizedHealthMetricCard = React.memo(({ 
    icon, title, value, subtitle, color 
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value: string;
    subtitle: string;
    color: string;
  }) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  ));

  const MemoizedProgressBar = React.memo(({ value }: { value: number }) => (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${value}%`,
              backgroundColor: getHealthScoreColor(value)
            }
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color: getHealthScoreColor(value) }]}>
        {value}%
      </Text>
    </View>
  ));

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.View 
            style={[
              styles.spinner, 
              { transform: [{ rotate: spin }] }
            ]} 
          />
          <Animated.Text 
            style={[
              styles.loadingText, 
              { opacity: pulseValue }
            ]}
          >
            Loading data...
          </Animated.Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!studentData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Unable to load student data</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show welcome card only if student has NO health data at all
  if (!hasAnyHealthData) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#EFF6FF', '#FFFFFF', '#F0FDF4']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoContainer}>
                <Image source={assets.logo_utc2} style={{width: 40, height: 40}} />
              </View>
              
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>My Health Dashboard</Text>
                <Text style={styles.headerSubtitle}>UTC2 Health Management System</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsButton}>
                <Ionicons name="settings-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#60A5FA']}
                tintColor="#60A5FA"
              />
            }
          >
            <ProfileCard studentData={studentData} />
            <WelcomeCard 
              studentData={studentData} 
              onContactHealthCenter={handleContactHealthCenter} 
            />
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#EFF6FF', '#FFFFFF', '#F0FDF4']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Image source={assets.logo_utc2} style={{width: 40, height: 40}} />
            </View>
            
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>My Health Dashboard</Text>
              <Text style={styles.headerSubtitle}>UTC2 Health Management System</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={20} color="#6B7280" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#60A5FA']}
              tintColor="#60A5FA"
            />
          }
        >
          {/* Old Data Warning Banner */}
          <OldDataBanner 
            isShowingOldData={isShowingOldData}
            latestAvailableHealthData={latestAvailableHealthData}
            onScheduleCheckup={handleContactHealthCenter}
          />

          {/* Student Profile Card */}
          <ProfileCard studentData={studentData} />

          {/* Exam Session Selector */}
          <ExamSessionSelector 
            examSessions={examSessions}
            selectedSession={selectedSession}
            onSessionSelect={setSelectedSession}
            onCompare={handleCompareData}
          />

          {/* Comparison View */}
          <ComparisonView 
            showComparison={showComparison}
            comparisonData={comparisonData}
            onClose={() => setShowComparison(false)}
          />

          {/* Abnormality Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                <Text style={styles.cardTitle}>Recent Abnormalities</Text>
              </View>
            </View>
            {abnormalityHistory.length === 0 ? (
              <Text style={{ color: '#6B7280', textAlign: 'center', marginVertical: 12 }}>No abnormality records found.</Text>
            ) : (
              abnormalityHistory.slice(-1).map((record) => (
                <View key={record._id} style={{ marginBottom: 12 }}>
                  <Text style={{ fontWeight: 'bold', color: '#EF4444', marginBottom: 4 }}>
                    {new Date(record.date).toLocaleDateString()} • Dr. {record.doctorName}
                  </Text>
                  <Text style={{ color: '#374151', marginBottom: 2 }}>
                    <Text style={{ fontWeight: '600' }}>Symptoms: </Text>
                    {record.symptoms.join(', ')}
                  </Text>
                  <Text style={{ color: '#374151' }}>
                    <Text style={{ fontWeight: '600' }}>Treatment: </Text>
                    {record.temporaryTreatment}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Health Metrics */}
          {healthMetrics && <HealthMetricsGrid healthMetrics={healthMetrics} />}

          {/* Health Scores */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="pulse-outline" size={20} color="#374151" />
                <Text style={styles.cardTitle}>Health Scores</Text>
              </View>
              <Text style={[styles.overallScore, { color: getHealthScoreColor(healthScores.overall) }]}>
                {healthScores.overall}%
              </Text>
            </View>
            <View style={styles.healthScoresContainer}>
              {Object.entries(healthScores)
                .filter(([key]) => key !== 'overall')
                .map(([key, value]) => (
                  <View key={key} style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${value as number}%`,
                              backgroundColor: getHealthScoreColor(value as number)
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressText, { color: getHealthScoreColor(value as number) }]}>
                        {value as number}%
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          </View>

          {/* Regular Checkup Reminder */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="calendar-outline" size={20} color="#374151" />
                <Text style={styles.cardTitle}>Health Checkup Reminder</Text>
              </View>
            </View>
            <View style={styles.reminderContainer}>
              <View style={styles.reminderIcon}>
                <Ionicons name="medical" size={32} color="#3B82F6" />
              </View>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>Regular Health Checkup</Text>
                <Text style={styles.reminderText}>
                  It's recommended to have a health checkup every 6 months to maintain optimal health.
                </Text>
                <Text style={styles.reminderSchedule}>
                  📅 Suggested schedule: Every 6 months
                </Text>
                <Text style={styles.reminderSchedule}>
                  📍 Location: UTC2 Health Center
                </Text>
                <Text style={styles.reminderSchedule}>
                  ⏰ Office hours: Monday - Friday, 8:00 - 17:00
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.reminderButton} onPress={handleContactHealthCenter}>
              <Ionicons name="chatbubble-outline" size={16} color="white" />
              <Text style={styles.reminderButtonText}>Contact to more information</Text>
            </TouchableOpacity>
          </View>

          {/* Medical History */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="document-text-outline" size={20} color="#374151" />
                <Text style={styles.cardTitle}>Medical History</Text>
              </View>
             
            </View>
            <Text style={styles.lastCheckupText}>
              Last checkup: {healthMetrics?.followDate}
            </Text>
           
            <View style={styles.historyContainer}>
              {abnormalityHistory.map((record) => (
                <View key={record._id} style={styles.historyRecord}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyLeft}>
                      <View style={styles.historyIcon}>
                        <Ionicons name="medical" size={20} color="#3B82F6" />
                      </View>
                      <View>
                        <Text style={styles.historyTitle}>Medical Examination</Text>
                        <Text style={styles.historySubtitle}>{record.date} • {record.doctorName}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.historyContent}>
                    <View style={styles.symptomsContainer}>
                      <Text style={styles.historyLabel}>Symptoms: </Text>
                      <View style={styles.symptomsWrapper}>
                        {record.symptoms.map((symptom, idx) => (
                          <View key={idx} style={styles.symptomTag}>
                            <Text style={styles.symptomText}>{symptom}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.treatmentContainer}>
                      <Text style={styles.historyLabel}>Treatment: </Text>
                      <Text style={styles.treatmentText}>{record.temporaryTreatment}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
      
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: 30,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 50,
  },
  spinner: {
    width: 64,
    height: 64,
    borderWidth: 4,
    borderColor: '#93C5FD',
    borderTopColor: 'transparent',
    borderRadius: 32,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#2563EB',
    fontWeight: '600',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    // padding: 8,
    paddingRight: 20,

    marginRight: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 12,
  },
  classBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  classBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  studentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
    width: '45%', 
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '48%', 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right', 
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  overallScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  healthScoresContainer: {
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, 
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,  
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    width: 32,
    textAlign: 'right',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  appointmentsContainer: {
  },
  appointmentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
      marginBottom: 16, 
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appointmentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  appointmentDetails: {
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, 
  },
  appointmentDetailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  lastCheckupText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewHistoryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  historyContainer: {
  },
  historyRecord: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16, 
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  historySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  historyBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
  },
  historyContent: {
    marginLeft: 52, 
  },
  symptomsContainer: {
    marginBottom: 8,
  },
  historyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  symptomsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  symptomTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  symptomText: {
    fontSize: 10,
    color: '#1D4ED8',
  },
  treatmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  treatmentText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1, 
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  reminderText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  reminderSchedule: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reminderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Exam Session Selector Styles
  sessionScrollView: {
    marginTop: 16,
  },
  sessionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSessionCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  sessionYear: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedSessionText: {
    color: '#1D4ED8',
  },
  sessionName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  selectedSessionSubText: {
    color: '#3B82F6',
  },
  sessionDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compareButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Comparison Styles
  comparisonContainer: {
    marginTop: 16,
  },
  comparisonHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  comparisonSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  comparisonMetrics: {
  },
  comparisonRow: {
    marginBottom: 16,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonValueWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  valueLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
    fontWeight: '500',
  },
  oldValue: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  newValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Old Data Banner Styles
  oldDataBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  oldDataBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  oldDataTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  oldDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  oldDataSubtitle: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  oldDataAction: {
    alignItems: 'flex-end',
  },
  contactHealthCenterButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  contactHealthCenterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StudentHealthDashboard;