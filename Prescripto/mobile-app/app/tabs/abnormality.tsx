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
  const [studentId, setStudentId] = useState<string | null>(null);
  
  const userInfo = useSelector((state: any) => state.auth.userInfo);

  // Fetch user info to get studentId
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

    console.log('=== FETCHING DATA ===');
    console.log('Using studentId:', studentId);

    try {
      const [abnormalityResponse, prescriptionResponse] = await Promise.all([
        getAbnormality(studentId),
        getPrescription(studentId)
      ]);
      
      console.log('Abnormality API response:', abnormalityResponse);
      console.log('Prescription API response:', prescriptionResponse);
      
      if (abnormalityResponse && abnormalityResponse.success && abnormalityResponse.data) {
        const isArray = Array.isArray(abnormalityResponse.data);
        console.log('Raw abnormality data:', abnormalityResponse.data);
        console.log('Is abnormality data array?', isArray);
        console.log('Original data length:', isArray ? abnormalityResponse.data.length : 'N/A (not array)');
        
        const abnormalityData = isArray 
          ? abnormalityResponse.data 
          : [abnormalityResponse.data];
        console.log(`Abnormality data type: ${isArray ? 'Array' : 'Object'}, count: ${abnormalityData.length}`);
        console.log('Final abnormality data to be set:', abnormalityData);
        console.log('Each abnormality item:', abnormalityData.map((item: AbnormalityItem, index: number) => ({
          index,
          id: item._id,
          studentName: item.studentName,
          doctorName: item.doctorName
        })));
        setAbnormalities(abnormalityData);
      } else {
        console.log('No abnormality data, setting empty array');
        setAbnormalities([]);
      }

      if (prescriptionResponse && prescriptionResponse.success && prescriptionResponse.data) {
        const isArray = Array.isArray(prescriptionResponse.data);
        console.log('Raw prescription data:', prescriptionResponse.data);
        console.log('Is prescription data array?', isArray);
        console.log('Original prescription data length:', isArray ? prescriptionResponse.data.length : 'N/A (not array)');
        
        const prescriptionData = isArray 
          ? prescriptionResponse.data 
          : [prescriptionResponse.data];
        console.log(`Prescription data type: ${isArray ? 'Array' : 'Object'}, count: ${prescriptionData.length}`);
        console.log('Final prescription data to be set:', prescriptionData);
        setPrescriptions(prescriptionData);
      } else {
        console.log('No prescription data, setting empty array');
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

  // Tìm prescription liên quan đến abnormality
  const findRelatedPrescription = (abnormalityId: string) => {
    return prescriptions.find(prescription => prescription.abnormalityId === abnormalityId);
  };

  const renderMedicine = (medicine: Medicine, index: number) => (
    <View key={index} style={styles.medicineCard}>
      <View style={styles.medicineHeader}>
        <View style={styles.pillIcon}>
          <Ionicons name="medical" size={16} color="#3B82F6" />
        </View>
        <View style={styles.medicineInfo}>
          <Text style={styles.medicineName}>
            {medicine.drugId?.drugName || 'Unknown Medicine'}
          </Text>
          <Text style={styles.medicineCode}>
            {medicine.drugId?.drugCode || 'N/A'}
          </Text>
        </View>
      </View>
      
      <View style={styles.medicineDetails}>
        <View style={styles.medicineRow}>
          <Text style={styles.medicineLabel}>Dosage:</Text>
          <Text style={styles.medicineValue}>{medicine.dosage}</Text>
        </View>
        <View style={styles.medicineRow}>
          <Text style={styles.medicineLabel}>Frequency:</Text>
          <Text style={styles.medicineValue}>{medicine.frequency}</Text>
        </View>
        <View style={styles.medicineRow}>
          <Text style={styles.medicineLabel}>Duration:</Text>
          <Text style={styles.medicineValue}>{medicine.duration}</Text>
        </View>
        <View style={styles.medicineRow}>
          <Text style={styles.medicineLabel}>Quantity:</Text>
          <Text style={styles.medicineValue}>
            {medicine.quantity} {medicine.drugId?.drugUnit || 'units'}
          </Text>
        </View>
      </View>
      
      {medicine.notes && (
        <View style={styles.medicineNotes}>
          <Text style={styles.notesText}>{medicine.notes}</Text>
        </View>
      )}
    </View>
  );

  const renderPrescriptionSection = (prescription: PrescriptionItem) => (
    <View style={styles.prescriptionSection}>
      <View style={styles.prescriptionHeader}>
        <View style={styles.rxBadge}>
          <Text style={styles.rxText}>Rx</Text>
        </View>
        <View style={styles.prescriptionInfo}>
          <Text style={styles.prescriptionTitle}>Prescription</Text>
          <Text style={styles.prescriptionDate}>
            {formatDate(prescription.prescriptionDate)}
          </Text>
        </View>
      </View>

      <View style={styles.diagnosisContainer}>
        <Text style={styles.sectionLabel}>Diagnosis</Text>
        <View style={styles.diagnosisBox}>
          <Text style={styles.diagnosisText}>{prescription.diagnosis}</Text>
        </View>
      </View>

      <View style={styles.medicinesContainer}>
        <Text style={styles.sectionLabel}>
          Medications ({prescription.medicines.length})
        </Text>
        {prescription.medicines.map((medicine, index) => renderMedicine(medicine, index))}
      </View>

      {prescription.notes && (
        <View style={styles.doctorNotesContainer}>
          <Text style={styles.sectionLabel}>Doctor's Notes</Text>
          <View style={styles.notesBox}>
            <Text style={styles.doctorNotesText}>{prescription.notes}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderAbnormalityItem = (item: AbnormalityItem) => {
    const relatedPrescription = findRelatedPrescription(item._id);
    
    return (
      <View key={item._id} style={styles.modernCard}>
        <TouchableOpacity
          onPress={() => setSelectedItem(selectedItem?._id === item._id ? null : item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <View style={styles.statusBadge}>
                <View style={styles.alertDot} />
                <Text style={styles.badgeText}>Health Alert</Text>
              </View>
              <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
            </View>
            
            <View style={styles.cardBody}>
              <View style={styles.patientInfo}>
                <View style={styles.avatarContainer}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
                <View style={styles.patientDetails}>
                  <Text style={styles.patientName}>{item.studentName}</Text>
                  <Text style={styles.doctorInfo}>Dr. {item.doctorName}</Text>
                </View>
              </View>
              
              <View style={styles.cardActions}>
                {relatedPrescription && (
                  <View style={styles.prescriptionIndicator}>
                    <Ionicons name="medical" size={16} color="#3B82F6" />
                  </View>
                )}
                <TouchableOpacity style={styles.expandButton}>
                  <Ionicons
                    name={selectedItem?._id === item._id ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {selectedItem?._id === item._id && (
          <View style={styles.expandedSection}>
            <View style={styles.symptomsSection}>
              <Text style={styles.sectionLabel}>Symptoms Reported</Text>
              <View style={styles.symptomsList}>
                {item.symptoms.map((symptom, index) => (
                  <View key={index} style={styles.symptomChip}>
                    <Text style={styles.symptomText}>{symptom}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            {item.temporaryTreatment && (
              <View style={styles.treatmentSection}>
                <Text style={styles.sectionLabel}>Immediate Care</Text>
                <View style={styles.treatmentBox}>
                  <Text style={styles.treatmentText}>{item.temporaryTreatment}</Text>
                </View>
              </View>
            )}

            {relatedPrescription && renderPrescriptionSection(relatedPrescription)}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading health records...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Health Records</Text>
          <Text style={styles.headerSubtitle}>
            {abnormalities.length} health alert{abnormalities.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="fitness" size={28} color="#EF4444" />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {abnormalities.length > 0 ? (
          abnormalities.map(renderAbnormalityItem)
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="shield-checkmark" size={48} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyMessage}>
              No health alerts at this time. Keep up the good work!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modernHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  modernCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  doctorInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prescriptionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButton: {
    padding: 8,
  },
  expandedSection: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    gap: 20,
  },
  symptomsSection: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  symptomText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  treatmentSection: {
    gap: 12,
  },
  treatmentBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  treatmentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  prescriptionSection: {
    gap: 16,
    marginTop: 4,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  rxBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rxText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  prescriptionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  diagnosisContainer: {
    gap: 8,
  },
  diagnosisBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  diagnosisText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  medicinesContainer: {
    gap: 12,
  },
  medicineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  medicineCode: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  medicineDetails: {
    gap: 8,
  },
  medicineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  medicineValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  medicineNotes: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  doctorNotesContainer: {
    gap: 8,
  },
  notesBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  doctorNotesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default Abnormality;