import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { getAbnormality, getInfoUser, getPrescription } from '../services/api/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AbnormalityItem {
  _id: string;
  student: string;
  studentId: string;
  studentName: string;
  doctorName: string;
  date: string;
  symptoms: string[];
  temporaryTreatment: string;
  __v: number;
}

interface Medicine {
  drugId: {
    _id: string;
    drugName: string;
    drugCode: string;
    drugUnit: string;
  };
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  quantity: number;
}

interface PrescriptionItem {
  _id: string;
  abnormalityId: string;
  studentId: string;
  doctorName: string;
  prescriptionDate: string;
  diagnosis: string;
  medicines: Medicine[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const Abnormality = () => {
  const [abnormalities, setAbnormalities] = useState<AbnormalityItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AbnormalityItem | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionItem | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'abnormality' | 'prescription'>('abnormality');
  
  const userInfo = useSelector((state: any) => state.auth.userInfo);

  // Fetch user info để lấy studentId
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const user = await getInfoUser();
        console.log('User info response:', user);
        if (user?.userData?.studentId) {
          setStudentId(user.userData.studentId);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        Alert.alert('Error', 'Cannot get student info');
      }
    };

    fetchUserInfo();
  }, []);
  const fetchAbnormalities = async () => {
    if (!studentId) {
      Alert.alert('Error', 'Cannot find student info');
      setLoading(false);
      return;
    }

    try {
      const [abnormalityResponse, prescriptionResponse] = await Promise.all([
        getAbnormality(studentId),
        getPrescription(studentId)
      ]);
      
      console.log('Abnormality API response:', abnormalityResponse);
      console.log('Prescription API response:', prescriptionResponse);
      
      if (abnormalityResponse && abnormalityResponse.success && abnormalityResponse.data) {
        setAbnormalities(abnormalityResponse.data);
      } else {
        setAbnormalities([]);
      }

      if (prescriptionResponse && prescriptionResponse.success && prescriptionResponse.data) {
        setPrescriptions(prescriptionResponse.data);
      } else {
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'An error occurred while loading data');
      setAbnormalities([]);
      setPrescriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchAbnormalities();
    }
  }, [studentId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAbnormalities();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderAbnormalityItem = (item: AbnormalityItem) => (
    <TouchableOpacity
      key={item._id}
      style={styles.abnormalityCard}
      onPress={() => setSelectedItem(selectedItem?._id === item._id ? null : item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.severityDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.abnormalityType}>
            Abnormality Report
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons
            name={selectedItem?._id === item._id ? "chevron-up" : "chevron-down"}
            size={20}
            color="#6b7280"
          />
        </View>
      </View>

      <Text style={styles.dateText}>{formatDate(item.date)}</Text>
      
      <View style={styles.studentInfo}>
        <Text style={styles.studentText}>Student: {item.studentName}</Text>
        <Text style={styles.doctorText}>Doctor: {item.doctorName}</Text>
      </View>

      {selectedItem?._id === item._id && (
        <View style={styles.expandedContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Symptoms:</Text>
            {item.symptoms.map((symptom, index) => (
              <Text key={index} style={styles.symptomItem}>• {symptom}</Text>
            ))}
          </View>
          
          {item.temporaryTreatment && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Temporary Treatment:</Text>
              <Text style={styles.sectionContent}>{item.temporaryTreatment}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMedicine = (medicine: Medicine, index: number) => (
    <View key={index} style={styles.medicineItem}>
      <View style={styles.medicineHeader}>
        <Text style={styles.medicineName}>
          {medicine.drugId?.drugName || 'Unknown Medicine'}
        </Text>
        <Text style={styles.medicineCode}>
          ({medicine.drugId?.drugCode || 'N/A'})
        </Text>
      </View>
      
      <View style={styles.medicineDetails}>
        <View style={styles.medicineDetailRow}>
          <Text style={styles.detailLabel}>Dosage:</Text>
          <Text style={styles.detailValue}>{medicine.dosage}</Text>
        </View>
        <View style={styles.medicineDetailRow}>
          <Text style={styles.detailLabel}>Frequency:</Text>
          <Text style={styles.detailValue}>{medicine.frequency}</Text>
        </View>
        <View style={styles.medicineDetailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{medicine.duration}</Text>
        </View>
        <View style={styles.medicineDetailRow}>
          <Text style={styles.detailLabel}>Quantity:</Text>
          <Text style={styles.detailValue}>
            {medicine.quantity} {medicine.drugId?.drugUnit || 'units'}
          </Text>
        </View>
        {medicine.notes && (
          <View style={styles.medicineDetailRow}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <Text style={styles.detailValue}>{medicine.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderPrescriptionItem = (item: PrescriptionItem) => (
    <TouchableOpacity
      key={item._id}
      style={styles.prescriptionCard}
      onPress={() => setSelectedPrescription(selectedPrescription?._id === item._id ? null : item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.prescriptionIcon}>
            <Ionicons name="medical" size={20} color="#3b82f6" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.prescriptionTitle}>Medical Prescription</Text>
            <Text style={styles.doctorName}>Dr. {item.doctorName}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Ionicons
            name={selectedPrescription?._id === item._id ? "chevron-up" : "chevron-down"}
            size={20}
            color="#6b7280"
          />
        </View>
      </View>

      <Text style={styles.dateText}>{formatDate(item.prescriptionDate)}</Text>
      
      <View style={styles.diagnosisContainer}>
        <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
        <Text style={styles.diagnosisText}>{item.diagnosis}</Text>
      </View>

      {selectedPrescription?._id === item._id && (
        <View style={styles.expandedContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medicines ({item.medicines.length}):</Text>
            {item.medicines.map((medicine, index) => renderMedicine(medicine, index))}
          </View>
          
          {item.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Notes:</Text>
              <Text style={styles.sectionContent}>{item.notes}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="medical" size={24} color="#ef4444" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Health Records</Text>
          <Text style={styles.subtitle}>
            Medical abnormalities and prescriptions
          </Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'abnormality' && styles.activeTab]}
          onPress={() => setActiveTab('abnormality')}
        >
          <Ionicons 
            name="warning" 
            size={20} 
            color={activeTab === 'abnormality' ? '#ef4444' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'abnormality' && styles.activeTabText
          ]}>
            Abnormalities ({abnormalities.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'prescription' && styles.activeTab]}
          onPress={() => setActiveTab('prescription')}
        >
          <Ionicons 
            name="medical" 
            size={20} 
            color={activeTab === 'prescription' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'prescription' && styles.activeTabText
          ]}>
            Prescriptions ({prescriptions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'abnormality' ? (
          abnormalities.length > 0 ? (
            <View style={styles.contentContainer}>
              {abnormalities.map(renderAbnormalityItem)}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              <Text style={styles.emptyTitle}>Great!</Text>
              <Text style={styles.emptyText}>
                Currently no abnormalities detected
              </Text>
            </View>
          )
        ) : (
          prescriptions.length > 0 ? (
            <View style={styles.contentContainer}>
              {prescriptions.map(renderPrescriptionItem)}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="medical-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Prescriptions</Text>
              <Text style={styles.emptyText}>
                You don't have any prescriptions yet
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  abnormalityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  abnormalityType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  studentInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  studentText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  doctorText: {
    fontSize: 13,
    color: '#374151',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  symptomItem: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  medicineItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  medicineCode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  medicineDetails: {
    marginTop: 8,
  },
  medicineDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
  },
  prescriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prescriptionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  prescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    color: '#6b7280',
  },
  diagnosisContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  diagnosisLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  diagnosisText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#3b82f6',
  },
});

export default Abnormality;
