import Report from './Report';

import PropTypes from 'prop-types';

// Step 5: Final summary and review of selected plan
// Creates a printable/exportable summary of the water quality practices plan
// Props:
//   - userType: Selected user type (Landowner, SWCD/TA, etc.)
//   - region: Selected region (optional)
//   - commodity: Selected commodity/operation type (optional)
//   - selectedConcerns: Array of selected concerns from StepConditions
//   - selectedQuestions: Array of selected question IDs
//   - selectedGoals: Array of selected goal strings
//   - goalData: Array of fetched goal records from /agwqplan/goals
//   - selectedPractices: Array of selected Practice objects
//   - concernQuestions: Array of fetched concern question objects from /agwqplan/concernQuestions
const StepSummary = ({
  currentPlan,
  //setCurrentPlan,
  userRole,
  userName,
  goalsData,
  concernQuestionsData,
  areaRulesData,
  practicesData,
  savePlan,
  isDirty, 
}) => (
  <>
    <Report
      currentPlan={currentPlan}
      userRole={userRole}
      userName={userName}
      goalsData={goalsData}
      concernQuestionsData={concernQuestionsData}
      areaRulesData={areaRulesData}
      practicesData={practicesData}
      savePlan={savePlan}
      isDirty={isDirty}
    />

  </>

);



StepSummary.propTypes = {
  userRole: PropTypes.string,
  userName: PropTypes.string,
  
  goalsData: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string,
        name: PropTypes.string,
        text: PropTypes.string,
        goal: PropTypes.string,
      }),
    ]),
  ).isRequired,

  concernQuestionsData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      concern: PropTypes.string.isRequired,
      question: PropTypes.string.isRequired,
    })
  ).isRequired,

  currentPlan: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    report_data: PropTypes.shape({
      selected_concerns: PropTypes.arrayOf(PropTypes.string).isRequired,
      selected_questions: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      ).isRequired,
    }).isRequired,
  }),
  areaRules: PropTypes.array,
  setCurrentPlan: PropTypes.func.isRequired,
  savePlan: PropTypes.func.isRequired,
  isDirty: PropTypes.shape({
    current: PropTypes.bool,
  }).isRequired,
};

export default StepSummary;
