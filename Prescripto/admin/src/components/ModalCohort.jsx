export const calculateCurrentCohort = () => {
    const currentYear = new Date().getFullYear()
    return currentYear - 1963
  }

  // Function to generate 7 cohorts (current cohort ±3)
  export const generateCohortOptions = () => {
    const currentCohort = calculateCurrentCohort()
    const cohorts = []
    
    for (let i = -3; i <= 3; i++) {
      const cohortNumber = currentCohort + i
      cohorts.push(cohortNumber)
    }
    
    // Sort in descending order (newest first)
    return cohorts.sort((a, b) => b - a)
  }