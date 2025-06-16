import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions, // Not explicitly used but kept for context if needed
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getInfoUser, getPhysicalData, getAbnormalData } from '../services/api/api';

const { width } = Dimensions.get('window'); // Kept, but not directly used in styles below

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

interface Appointment {
  id: number;
  date: string;
  time: string;
  type: string;
  doctor: string;
  location: string;
}

const StudentHealthDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview'); // This state is not used in the current render logic, but kept for future use
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [abnormalityHistory, setAbnormalityHistory] = useState<AbnormalityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const user = await getInfoUser();
        setStudentData(user.userData);

        const physical = await getPhysicalData(user.userData.studentId);
        const latestPhysical = Array.isArray(physical.data) && physical.data.length > 0
          ? physical.data[physical.data.length - 1]
          : null;
        setHealthMetrics(latestPhysical);

        const abnormal = await getAbnormalData(user.userData.studentId);
        setAbnormalityHistory(Array.isArray(abnormal.data) ? abnormal.data : []);
      } catch (err) {
        Alert.alert('Error', 'Failed to load data');
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const healthScores: HealthScores = {
    physicalFitness: 85,
    cardiovascular: 78,
    respiratory: 92,
    mental: 88,
    overall: 86
  };

  const upcomingAppointments: Appointment[] = [
    {
      id: 1,
      date: '2024-07-15',
      time: '09:00',
      type: 'Annual Checkup',
      doctor: 'Dr. Thanh',
      location: 'UTC2 Health Center'
    },
    {
      id: 2,
      date: '2024-07-22',
      time: '14:30',
      type: 'Follow-up',
      doctor: 'Dr. Minh',
      location: 'UTC2 Health Center'
    }
  ];

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

  const handleExportReport = () => {
    Alert.alert('Export Report', 'Report export functionality would be implemented here');
  };

  const handleViewFullHistory = () => {
    Alert.alert('View History', 'Full medical history would be displayed here');
  };

  const renderHealthMetricCard = (
    icon: keyof typeof Ionicons.glyphMap, // Use keyof typeof to ensure valid icon names
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
            color={trend.direction === 'up' ? '#10B981' : '#EF4444'} // Green for up, Red for down
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!studentData || !healthMetrics) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>No data available</Text>
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
            <LinearGradient
              colors={['#3B82F6', '#10B981']}
              style={styles.logoContainer}
            >
              <Ionicons name="medical" size={20} color="white" />
            </LinearGradient>
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
            <TouchableOpacity style={styles.exportButton} onPress={handleExportReport}>
              <Ionicons name="download-outline" size={16} color="white" />
              <Text style={styles.exportButtonText}>Export Report</Text>
            </TouchableOpacity>
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
              'heart-outline', // Valid Ionicons name
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
            {/* Removed "space: 16" and replaced with marginVertical where needed */}
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

          {/* Upcoming Appointments */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="calendar-outline" size={20} color="#374151" />
                <Text style={styles.cardTitle}>Upcoming Appointments</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {/* Removed "space: 16" and replaced with marginBottom where needed */}
            <View style={styles.appointmentsContainer}>
              {upcomingAppointments.map((appointment) => (
                <View key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentType}>{appointment.type}</Text>
                    <Text style={styles.appointmentDate}>{appointment.date}</Text>
                  </View>
                  {/* Removed "space: 4" and replaced with marginBottom where needed */}
                  <View style={styles.appointmentDetails}>
                    <View style={styles.appointmentDetail}>
                      <Ionicons name="time-outline" size={12} color="#6B7280" />
                      <Text style={styles.appointmentDetailText}>{appointment.time}</Text>
                    </View>
                    <View style={styles.appointmentDetail}>
                      <Ionicons name="person-outline" size={12} color="#6B7280" />
                      <Text style={styles.appointmentDetailText}>{appointment.doctor}</Text>
                    </View>
                    <View style={styles.appointmentDetail}>
                      <Ionicons name="location-outline" size={12} color="#6B7280" />
                      <Text style={styles.appointmentDetailText}>{appointment.location}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Medical History */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="document-text-outline" size={20} color="#374151" />
                <Text style={styles.cardTitle}>Medical History</Text>
              </View>
              <TouchableOpacity style={styles.viewHistoryButton} onPress={handleViewFullHistory}>
                <Ionicons name="eye-outline" size={16} color="white" />
                <Text style={styles.viewHistoryButtonText}>View History</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.lastCheckupText}>
              Last checkup: {healthMetrics?.followDate}
            </Text>
            {/* Removed "space: 16" and replaced with marginBottom where needed */}
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
    padding: 8,
    marginRight: 8,
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
    // Removed 'space: 16' - handled by marginRight and marginBottom in detailRow
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
    width: '45%', // To allow two items per row approximately
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
    width: '48%', // For two cards per row
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
    textAlign: 'right', // Aligns the title to the right within its flex container
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
    // color: '#10B981', // Color now depends on trend direction
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
    // Removed 'space: 16'
    // Margins are now handled by marginBottom in scoreRow
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // Added marginBottom for spacing
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
    // Removed 'space: 16'
    // Margins are now handled by marginBottom in appointmentCard
  },
  appointmentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16, // Added marginBottom for spacing
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
    // Removed 'space: 4'
    // Margins are now handled by marginBottom in appointmentDetail
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // Added marginBottom for spacing
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
    // Removed 'space: 16'
    // Margins are now handled by marginBottom in historyRecord
  },
  historyRecord: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16, // Added marginBottom for spacing
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
    marginLeft: 52, // Indent to align with the text in historyLeft
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
    flex: 1, // Allow text to wrap within the available space
  },
});

export default StudentHealthDashboard;