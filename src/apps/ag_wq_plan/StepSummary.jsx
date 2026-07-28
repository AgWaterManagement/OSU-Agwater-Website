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
  userType,
  userID,
  latitude,
  longitude,
  agWqMArea,
  region,
  regionalSpecialist,
  regionalSpecialistEmail,
  regionalSpecialistPhone,
  adminRulesLink,
  areaPlanLink,
  siteName,
  site,
  sitePhotos,
  selectedCommodities,
  selectedConcerns,
  selectedQuestions,
  selectedGoals,
  goalData,
  selectedPractices,
  concernQuestions,
  areaRules
}) => (
  <Report
    userType={userType}
    userID={userID}
    latitude={latitude}
    longitude={longitude}
    agWqMArea={agWqMArea}
    region={region}
    regionalSpecialist={regionalSpecialist}
    regionalSpecialistEmail={regionalSpecialistEmail}
    regionalSpecialistPhone={regionalSpecialistPhone}
    adminRulesLink={adminRulesLink}
    areaPlanLink={areaPlanLink}
    siteName={siteName}
    site={site}
    sitePhotos={sitePhotos}
    selectedCommodities={selectedCommodities}
    selectedConcerns={selectedConcerns}
    selectedQuestions={selectedQuestions}
    selectedGoals={selectedGoals}
    goalData={goalData}
    selectedPractices={selectedPractices}
    concernQuestions={concernQuestions}
    areaRules={areaRules}
  />
);



StepSummary.propTypes = {
  userType: PropTypes.string,
  latitude: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  longitude: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  agWqMArea: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  region: PropTypes.string,
  regionalSpecialist: PropTypes.string,
  regionalSpecialistEmail: PropTypes.string,
  regionalSpecialistPhone: PropTypes.string,
  adminRulesLink: PropTypes.string,
  areaPlanLink: PropTypes.string,
  siteName: PropTypes.string,
  site: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    photos: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        url: PropTypes.string,
        description: PropTypes.string,
      })
    ),
  }),
  selectedCommodities: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  selectedConcerns: PropTypes.arrayOf(PropTypes.string).isRequired,

  selectedQuestions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
  selectedGoals: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,

  goalData: PropTypes.arrayOf(
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

  concernQuestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      concern: PropTypes.string.isRequired,
      question: PropTypes.string.isRequired,
    })
  ).isRequired,

  selectedPractices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      helps: PropTypes.arrayOf(PropTypes.string).isRequired,
      ecosystem_benefits: PropTypes.string,
      benefits: PropTypes.string,
      links: PropTypes.arrayOf(
        PropTypes.shape({
          url: PropTypes.string.isRequired,
          label: PropTypes.string,
        }),
      ),
    }),
  ).isRequired,
};

export default StepSummary;
