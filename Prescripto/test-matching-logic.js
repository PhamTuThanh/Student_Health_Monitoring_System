// Test script for examSessionId matching logic
console.log('🧪 Testing examSessionId Matching Logic');

// Sample data from debug
const examSessionFromDropdown = "68624929ad3470cfa69c4846";
const physicalFitnessRecord = {
  examSessionId: "68624929ad3470cfa69c4846",
  studentId: "5941110102"
};

// Current matching logic (what's in the code)
const currentMatch = () => {
  let fExamSessionId = physicalFitnessRecord.examSessionId;
  if (typeof fExamSessionId === 'object' && fExamSessionId !== null) {
    fExamSessionId = fExamSessionId._id || fExamSessionId.$oid || String(fExamSessionId);
  }
  return String(fExamSessionId).trim() === String(examSessionFromDropdown).trim();
};

// Test different scenarios
console.log('📋 Test Results:');
console.log('Current logic result:', currentMatch());
console.log('String comparison:', physicalFitnessRecord.examSessionId === examSessionFromDropdown);
console.log('Types:', typeof physicalFitnessRecord.examSessionId, 'vs', typeof examSessionFromDropdown);

// Test with ObjectId format
const physicalFitnessWithObjectId = {
  examSessionId: { _id: "68624929ad3470cfa69c4846" },
  studentId: "5941110102"
};

const testWithObjectId = () => {
  let fExamSessionId = physicalFitnessWithObjectId.examSessionId;
  if (typeof fExamSessionId === 'object' && fExamSessionId !== null) {
    fExamSessionId = fExamSessionId._id || fExamSessionId.$oid || String(fExamSessionId);
  }
  return String(fExamSessionId).trim() === String(examSessionFromDropdown).trim();
};

console.log('ObjectId test result:', testWithObjectId());

// Robust matching function
const robustMatch = (fitnessExamSessionId, selectedExamSessionId) => {
  // Normalize both IDs
  const normalizeId = (id) => {
    if (!id) return "";
    if (typeof id === 'object' && id !== null) {
      return String(id._id || id.$oid || id).trim();
    }
    return String(id).trim();
  };
  
  const normalized1 = normalizeId(fitnessExamSessionId);
  const normalized2 = normalizeId(selectedExamSessionId);
  
  console.log('🔍 Comparing:', normalized1, 'vs', normalized2);
  return normalized1 === normalized2;
};

console.log('🎯 Robust match result:', robustMatch(physicalFitnessRecord.examSessionId, examSessionFromDropdown));
console.log('🎯 Robust match with ObjectId:', robustMatch(physicalFitnessWithObjectId.examSessionId, examSessionFromDropdown)); 