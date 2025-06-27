import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { assets } from '../../assets/images/assets.js';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getInfoUser, getPhysicalData, getAbnormality, getHealthScores } from '../services/api/api';
import { useNavigation } from '@react-navigation/native';

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

const StudentHealthDashboard: React.FC = () => {
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
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    let isMounted = true; 
    
    const fetchAll = async () => {
      try {
        const user = await getInfoUser();
        if (!isMounted) return;
        
        if (!user?.userData) {
          throw new Error('User data not found');
        }
        
        setStudentData(user.userData);
        
        if (!user.userData.studentId) {
          throw new Error('Student ID not found');
        }
  
        try {
          const physical = await getPhysicalData(user.userData.studentId);
          if (!isMounted) return;
          
          
          let latestPhysical = null;
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
              }
            }
          }
          
          setHealthMetrics(latestPhysical);
         
        } catch (physicalError) {
          console.warn('Failed to fetch physical data:', physicalError);
          setHealthMetrics(null);
        }
  
        try {
          const abnormal = await getAbnormality(user.userData.studentId);
          if (!isMounted) return;
          
        
          
          setAbnormalityHistory(Array.isArray(abnormal?.data) ? abnormal.data : []);
          
          console.log('AbnormalityHistory set to:', Array.isArray(abnormal?.data) ? abnormal.data : []);
        } catch (abnormalError) {
          console.warn('Failed to fetch abnormal data:', abnormalError);
          setAbnormalityHistory([]);
        }
  
        try {
          const scores = await getHealthScores(user.userData.studentId);
          if (!isMounted) return;
          
          if (scores?.success && scores?.data) {
            setHealthScores(scores.data);
          }
        } catch (scoresError) {
          console.warn('Failed to fetch health scores:', scoresError);
        }
  
      } catch (err) {
        if (!isMounted) return;
        
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
        if (isMounted) {
          setLoading(false);
        }
      }
    };
  
    fetchAll();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const getBMIStatus = (bmi: string) => {
    const bmiNum = parseFloat(bmi);
    if (bmiNum < 18.5) return { status: 'Underweight', color: '#3B82F6' };
    if (bmiNum < 25) return { status: 'Normal', color: '#10B981' };
    if (bmiNum < 30) return { status: 'Overweight', color: '#F59E0B' };
    return { status: 'Obese', color: '#EF4444' };
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 75) return '#3B82F6'; // Blue
    if (score >= 60) return '#F59E0B'; // Yellow/Orange
    return '#EF4444'; // Red
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'High': return { bg: '#FEE2E2', text: '#991B1B' }; // Red
      case 'Medium': return { bg: '#FEF3C7', text: '#92400E' }; // Orange
      case 'Low': return { bg: '#D1FAE5', text: '#065F46' }; // Green
      default: return { bg: '#F3F4F6', text: '#374151' }; // Grey
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

  const renderHealthMetricCard = (
    icon: keyof typeof Ionicons.glyphMap, 
    title: string,
    value: string,
    subtitle: string,
    color: string,
    trend?: { direction: 'up' | 'down'; text: string }
  ) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {trend ? (
        <View style={styles.trendContainer}>
          <Ionicons
            name={trend.direction === 'up' ? 'trending-up' : 'trending-down'}
            size={12}
            color={trend.direction === 'up' ? '#10B981' : '#EF4444'} 
          />
          <Text style={styles.trendText}>{trend.text}</Text>
        </View>
      ) : (
        <Text style={styles.metricSubtitle}>{subtitle}</Text>
      )}
    </View>
  );

  const renderProgressBar = (value: number) => (
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
  );

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Cải thiện logic kiểm tra healthMetrics
  const hasValidHealthMetrics = healthMetrics && 
    healthMetrics.height && 
    healthMetrics.weight && 
    healthMetrics.bmi;

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

  if (!hasValidHealthMetrics) {
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

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Welcome Card for New Student */}
            <View style={styles.welcomeCard}>
              <LinearGradient
                colors={['#60A5FA', '#10B981']}
                style={styles.welcomeGradient}
              >
                <View style={styles.welcomeHeader}>
                  <Ionicons name="medical-outline" size={48} color="white" />
                  <Text style={styles.welcomeTitle}>Welcome to UTC2!</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Hello {studentData.name}, we haven't found any health data for you.
                  </Text>
                </View>
              </LinearGradient>
              
              <View style={styles.welcomeContent}>
                <Text style={styles.welcomeMessage}>
                  To start tracking your health, you need to perform your first health check at UTC2 Health Center.
                </Text>
                
                <View style={styles.instructionSteps}>
                  <View style={styles.stepItem}>
                    <View style={styles.stepIcon}>
                      <Text style={styles.stepNumber}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Register for a health check</Text>
                      <Text style={styles.stepDescription}>Contact the Health Center to schedule an appointment</Text>
                    </View>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={styles.stepIcon}>
                      <Text style={styles.stepNumber}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Perform a health check</Text>
                      <Text style={styles.stepDescription}>Measure height, weight, blood pressure and other indicators</Text>
                    </View>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={styles.stepIcon}>
                      <Text style={styles.stepNumber}>3</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Track results</Text>
                      <Text style={styles.stepDescription}>Data will be updated and displayed here</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.contactButton} onPress={handleContactHealthCenter}>
                  <Ionicons name="chatbubble-outline" size={20} color="white" />
                  <Text style={styles.contactButtonText}>Chat with a doctor</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Student Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <LinearGradient
                  colors={['#60A5FA', '#10B981']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{studentData?.name?.charAt(0)}</Text>
                </LinearGradient>
                <View style={styles.profileInfo}>
                  <View style={styles.nameContainer}>
                    <Text style={styles.studentName}>{studentData?.name}</Text>
                    <View style={styles.classBadge}>
                      <Text style={styles.classBadgeText}>{studentData?.cohort}</Text>
                    </View>
                  </View>
                  <View style={styles.studentDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="book-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>ID: {studentData?.studentId}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>Major: {studentData?.major}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>DOB: {studentData?.dob}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{studentData?.phone}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Info Cards */}
            <View style={styles.infoCardsContainer}>
              <View style={styles.infoCard}>
                <Ionicons name="shield-checkmark-outline" size={32} color="#10B981" />
                <Text style={styles.infoCardTitle}>Protect your health</Text>
                <Text style={styles.infoCardDescription}>
                  Regular monitoring helps detect health issues early
                </Text>
              </View>
              
              <View style={styles.infoCard}>
                <Ionicons name="analytics-outline" size={32} color="#3B82F6" />
                <Text style={styles.infoCardTitle}>Track Progress</Text>
                <Text style={styles.infoCardDescription}>
                  Monitor your health trends and improvements over time
                </Text>
              </View>
            </View>

            {/* Contact Info */}
            <View style={styles.contactInfoCard}>
              <View style={styles.contactHeader}>
                <Ionicons name="medical" size={24} color="#EF4444" />
                <Text style={styles.contactTitle}>Contact Information</Text>
              </View>
              <View style={styles.contactDetails}>
                <View style={styles.contactRow}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text style={styles.contactText}>UTC2 Health Department</Text>
                </View>
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={16} color="#6B7280" />
                  <Text style={styles.contactText}>(028).3736.0564</Text>
                </View>
                <View style={styles.contactRow}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.contactText}>Monday - Friday: 7:00 - 17:30</Text>
                </View>
              </View>
            </View>

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

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Student Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <LinearGradient
                colors={['#60A5FA', '#10B981']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{studentData?.name?.charAt(0)}</Text>
              </LinearGradient>
              <View style={styles.profileInfo}>
                <View style={styles.nameContainer}>
                  <Text style={styles.studentName}>{studentData?.name}</Text>
                  <View style={styles.classBadge}>
                    <Text style={styles.classBadgeText}>{studentData?.cohort}</Text>
                  </View>
                </View>
                <View style={styles.studentDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="book-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>ID: {studentData?.studentId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>Major: {studentData?.major}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>DOB: {studentData?.dob}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{studentData?.phone}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

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
          <View style={styles.metricsGrid}>
            {renderHealthMetricCard(
              'resize-outline', // Valid Ionicons name
              'Height',
              `${healthMetrics?.height} cm`,
              'Normal range',
              '#3B82F6'
            )}
            {renderHealthMetricCard(
              'fitness-outline', // Valid Ionicons name
              'Weight',
              `${healthMetrics?.weight} kg`,
              'Normal range',
              '#10B981',
              { direction: 'down', text: '-2kg from last month' }
            )}
            {renderHealthMetricCard(
              'bar-chart-outline', // Valid Ionicons name
              'BMI',
              `${healthMetrics?.bmi}`,
              getBMIStatus(healthMetrics?.bmi || '0').status,
              getBMIStatus(healthMetrics?.bmi || '0').color
            )}
            {renderHealthMetricCard(
              'heart-outline', 
              'Heart Rate',
              `${healthMetrics?.heartRate} bpm`,
              'Normal',
              '#EF4444'
            )}
          </View>

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
                    {renderProgressBar(value as number)}
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
              <Text style={styles.reminderButtonText}>Contact for Appointment</Text>
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
};

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
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  welcomeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  welcomeHeader: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  welcomeContent: {
    padding: 24,
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionSteps: {
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoCardDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  contactInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  contactDetails: {
    marginLeft: 32,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
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
});

export default StudentHealthDashboard;