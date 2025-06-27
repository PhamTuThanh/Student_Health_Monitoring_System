export function normalizeCohort(cohort) {
    if (!cohort) return "";
    // Convert to string first to handle numbers or other types
    const cohortStr = cohort.toString();
    return cohortStr.charAt(0).toUpperCase() + cohortStr.slice(1).toLowerCase();
  }