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
  Modal,
  Pressable,
  StatusBar,
  Animated,
} from 'react-native';
import { useSelector } from 'react-redux';
import { getAbnormality, getInfoUser, getPrescription } from '../services/api/api';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

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
  _id: string;
  drugId: {
    _id: string;
    drugName: string;
    drugCode: string;
  };
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  beforeAfterMeal?: string;
  notes?: string;
  quantity?: number;
  drugName?: string;
  drugCode?: string;
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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrescriptionData, setSelectedPrescriptionData] = useState<PrescriptionItem | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [modalAnimation] = useState(new Animated.Value(0));
  
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

  const findRelatedPrescription = (abnormalityId: string) => {
    return prescriptions.find(prescription => prescription.abnormalityId === abnormalityId);
  };

  const handleViewPrescription = (abnormalityId: string) => {
    const prescription = findRelatedPrescription(abnormalityId);
    console.log('=== PRESCRIPTION DEBUG ===');
    console.log('Abnormality ID:', abnormalityId);
    console.log('Found prescription:', prescription);
    if (prescription) {
      console.log('Prescription medicines:', prescription.medicines);
      prescription.medicines.forEach((medicine, index) => {
        console.log(`Medicine ${index}:`, {
          drugId: medicine.drugId,
          drugName: medicine.drugName,
          dosage: medicine.dosage,
          frequency: medicine.frequency,
          duration: medicine.duration,
          quantity: medicine.quantity
        });
      });
      setSelectedPrescriptionData(prescription);
      setModalVisible(true);
      
      // Animate modal in
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      console.log('No prescription found for abnormality:', abnormalityId);
    }
  };

  const closeModal = () => {
    // Animate modal out
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedPrescriptionData(null);
    });
  };

  const renderMedicine = (medicine: Medicine, index: number) => {
    console.log(`Medicine ${index}:`, JSON.stringify(medicine, null, 2));
    console.log(`DrugId:`, medicine.drugId);
    console.log(`Instructions:`, medicine.instructions);
    console.log(`Before/After Meal:`, medicine.beforeAfterMeal);
    
    // Safe access to drugId - handle both string and object cases
    const getDrugName = () => {
      if (typeof medicine.drugId === 'object' && medicine.drugId?.drugName) {
        return medicine.drugId.drugName;
      }
      if (medicine.drugName) {
        return medicine.drugName;
      }
      return 'Unknown Medicine';
    };

    const getDrugCode = () => {
      if (typeof medicine.drugId === 'object' && medicine.drugId?.drugCode) {
        return medicine.drugId.drugCode;
      }
      if (medicine.drugCode) {
        return medicine.drugCode;
      }
      if (typeof medicine.drugId === 'string') {
        return `ID: ${medicine.drugId}`;
      }
      if (typeof medicine.drugId === 'object' && medicine.drugId?._id) {
        return `ID: ${medicine.drugId._id}`;
      }
      return 'No Code';
    };
    
    return (
      <View key={index} style={styles.medicineCard}>
        <View style={styles.medicineHeader}>
          <View style={styles.pillIcon}>
            <Ionicons name="medical" size={18} color="#4F46E5" />
          </View>
          <View style={styles.medicineInfo}>
            <Text style={styles.medicineName}>
              {getDrugName()}
            </Text>
            <Text style={styles.medicineCode}>
              {getDrugCode()}
            </Text>
          </View>
        </View>
        
        <View style={styles.medicineDetails}>
          <View style={styles.medicineDetailRow}>
            <View style={styles.medicineDetailItem}>
              <Text style={styles.medicineLabel}>Dosage</Text>
              <Text style={styles.medicineValue}>{medicine.dosage || 'N/A'}</Text>
            </View>
            <View style={styles.medicineDetailItem}>
              <Text style={styles.medicineLabel}>Frequency</Text>
              <Text style={styles.medicineValue}>{medicine.frequency || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.medicineDetailRow}>
            <View style={styles.medicineDetailItem}>
              <Text style={styles.medicineLabel}>Duration</Text>
              <Text style={styles.medicineValue}>{medicine.duration || 'N/A'}</Text>
            </View>
            {medicine.quantity && (
              <View style={styles.medicineDetailItem}>
                <Text style={styles.medicineLabel}>Quantity</Text>
                <Text style={styles.medicineValue}>{medicine.quantity} pills</Text>
              </View>
            )}
          </View>
          
          {medicine.beforeAfterMeal && (
            <View style={styles.medicineTimingContainer}>
              <Ionicons 
                name={medicine.beforeAfterMeal === 'before' ? 'time-outline' : 'restaurant-outline'} 
                size={14} 
                color="#6366F1" 
              />
              <Text style={styles.medicineTimingText}>
                {medicine.beforeAfterMeal === 'before' ? 'Take before meal' : 'Take after meal'}
              </Text>
            </View>
          )}
        </View>
        
        {(medicine.instructions || medicine.notes) && (
          <View style={styles.medicineNotes}>
            <Text style={styles.medicineNotesLabel}>
              <Ionicons name="information-circle-outline" size={14} color="#6B7280" /> Notes
            </Text>
            <Text style={styles.notesText}>
              {medicine.instructions || medicine.notes}
            </Text>
          </View>
        )}
      </View>
    );
  };

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
        <Text style={styles.sectionLabel}>
            <Ionicons name="medical-outline" size={16} color="#4F46E5" /> Diagnosis
        </Text>
        <View style={styles.diagnosisBox}>
          <Text style={styles.diagnosisText}>{prescription.diagnosis}</Text>
        </View>
      </View>

      <View style={styles.medicinesContainer}>
        <Text style={styles.sectionLabel}>
          <Ionicons name="bandage-outline" size={16} color="#4F46E5" /> Medicines ({prescription.medicines.length})
        </Text>
        {prescription.medicines.map((medicine, index) => renderMedicine(medicine, index))}
      </View>

      {prescription.notes && (
        <View style={styles.doctorNotesContainer}>
          <Text style={styles.sectionLabel}>
            <Ionicons name="clipboard-outline" size={16} color="#4F46E5" /> Doctor's Notes
          </Text>
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
          activeOpacity={0.8}
          style={styles.cardTouchable}
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
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.patientDetails}>
                  <Text style={styles.patientName}>{item.studentName}</Text>
                    <Text style={styles.doctorInfo}>BS. {item.doctorName}</Text>
                </View>
              </View>
              
              <View style={styles.cardActions}>
                {relatedPrescription && (
                  <View style={styles.prescriptionIndicator}>
                    <Ionicons name="medical" size={14} color="#4F46E5" />
                  </View>
                )}
                <View style={styles.expandButton}>
                  <Ionicons
                    name={selectedItem?._id === item._id ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#6B7280"
                  />
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {selectedItem?._id === item._id && (
          <View style={styles.expandedSection}>
            <View style={styles.symptomsSection}>
              <Text style={styles.sectionLabel}>
                <Ionicons name="pulse-outline" size={16} color="#EF4444" /> Symptoms
              </Text>
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
                <Text style={styles.sectionLabel}>
                  <Ionicons name="heart-outline" size={16} color="#10B981" /> Initial Treatment
                </Text>
                <View style={styles.treatmentBox}>
                  <Text style={styles.treatmentText}>{item.temporaryTreatment}</Text>
                </View>
              </View>
            )}  

            {relatedPrescription && (
              <TouchableOpacity
                style={styles.prescriptionButton}
                onPress={() => handleViewPrescription(item._id)}
                activeOpacity={0.9}
              >
                <View style={styles.prescriptionButtonContent}>
                  <Ionicons name="medical" size={18} color="#FFFFFF" />
                  <Text style={styles.prescriptionButtonText}>View Prescription</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderPrescriptionModal = () => (
    <Modal
      animationType="none"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.5)" barStyle="light-content" />
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={closeModal} />
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  scale: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: modalAnimation,
            },
          ]}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIcon}>
                  <Ionicons name="medical" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.modalTitle}>Prescription Details</Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedPrescriptionData && (
              <ScrollView 
                style={styles.modalScrollView} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                {renderPrescriptionSection(selectedPrescriptionData)}
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading health records...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Health Records</Text>
          <Text style={styles.headerSubtitle}>
            {abnormalities.length} health alerts
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="fitness" size={24} color="#EF4444" />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {abnormalities.length > 0 ? (
          abnormalities.map(renderAbnormalityItem)
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="shield-checkmark" size={40} color="#10B981" />
            </View>
              <Text style={styles.emptyTitle}>All is well!</Text>
            <Text style={styles.emptyMessage}>
              There are no health alerts at the moment. Please maintain a healthy lifestyle!
            </Text>
          </View>
        )}
      </ScrollView>

      {renderPrescriptionModal()}
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
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  modernCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardTouchable: {
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  cardDate: {
    fontSize: 11,
    color: '#94A3B8',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  doctorInfo: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prescriptionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButton: {
    padding: 4,
  },
  expandedSection: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  symptomsSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomChip: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  symptomText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  treatmentSection: {
    gap: 8,
  },
  treatmentBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  treatmentText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  prescriptionButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  prescriptionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  prescriptionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  prescriptionSection: {
    gap: 16,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  rxBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rxText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  prescriptionDate: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  diagnosisContainer: {
    gap: 8,
  },
  diagnosisBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  diagnosisText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  medicinesContainer: {
    gap: 12,
  },
  medicineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  medicineCode: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  medicineDetails: {
    gap: 8,
  },
  medicineDetailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  medicineDetailItem: {
    flex: 1,
  },
  medicineLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
    },
    medicineValue: {
      fontSize: 13,
      color: '#1E293B',
      fontWeight: '600',
    },
    medicineTimingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    medicineTimingText: {
      fontSize: 11,
      color: '#6366F1',
      fontWeight: '600',
    },
    medicineNotes: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
    },
    medicineNotesLabel: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '600',
      marginBottom: 4,
    },
    notesText: {
      fontSize: 12,
      color: '#64748B',
      lineHeight: 16,
      fontStyle: 'italic',
    },
    doctorNotesContainer: {
      gap: 8,
    },
    notesBox: {
      backgroundColor: '#FEF7FF',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#E9D5FF',
    },
    doctorNotesText: {
      fontSize: 13,
      color: '#7C3AED',
      lineHeight: 18,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: '#F8FAFC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingCard: {
      backgroundColor: '#FFFFFF',
      padding: 32,
      borderRadius: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: '#64748B',
      fontWeight: '500',
      textAlign: 'center',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 64,
      paddingHorizontal: 32,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#ECFDF5',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#1E293B',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyMessage: {
      fontSize: 15,
      color: '#64748B',
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 280,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalContainer: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: height * 0.9,
      minHeight: height * 0.6,
    },
    modalContent: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    modalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#EEF2FF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1E293B',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F8FAFC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalScrollView: {
      flex: 1,
    },
    modalScrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
  });
  export default Abnormality;