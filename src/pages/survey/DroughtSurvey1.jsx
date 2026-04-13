import Survey from "./Survey";

const SURVEY_ID = 4; // Unique identifier for the drought survey in the backend

const questions = [
  {
    name: "A. Primary Role",
    label: "What is your primary role?",
    type: { "CheckboxGroup": ["County Extension","Statewide Extension", "Researcher", "Teaching", "Other"] },
    rules: [{ required: true, message: "Please select your primary role" }],
    divider: "before"
  },
  {
    name: "B. Primary Role Description",
    label: "Please describe your role:",
    type: { "TextArea": {} },
    //rules: [{ required: true, message: "Please describe your primary role" }],
    conditions: { "A. Primary Role": "Other" }
  },
  {
    name: "C. Primary Role Regions",
    label: "What county(s)/region(s) do you serve?",
    type: { "TextArea": {} },
  },
  {
    name: "D. Stakeholder Level of Concern",
    label: "How concerned are your stakeholders about managing drought?",
    type: { "RadioGroup": ["Not concerned", "Moderately concerned", "Highly concerned", "Extremely concerned"] },
    rules: [{ required: true, message: "Please select an option" }],
    divider: "before"
  },
  {
    name: "E. Drought Challenges",
    label: "What drought-related challenges are your stakeholders currently experiencing? (Select all that apply)",
    type: { "CheckboxGroup": ["Reduced irrigation water allocations", "Groundwater declines", "Increased pumping costs", "Crop yield reductions", "Crop quality impacts", "Changes in planting decisions", "Switching to lower water-use crops", "Irrigation scheduling challenges", "Soil moisture deficits"] },
    rules: [{ required: true, message: "Please select at least one drought-related challenge" }],
    divider: "before"
  },
  {
    name: "F. Additional Drought-related Challenges",
    label: "Please describe any other drought-related challenges:",
    type: { "TextArea": {} },
  },
  {
    name: 'G. Prioritize Drought Information Needs',
    label: 'Please prioritize the following areas of drought-related information for your stakeholders:',
    type: {
      'Ranking Group':
        ["Short term (1-14 days), site-specific forecasts of anticipated drought severity / water availability",
          "Long term (3-6 months), site-specific forecasts of anticipated drought severity / water availability",
          "Prior year(s) crop water availability/use",
          "Potential water savings from switching to lower water use crops",
          "Information / trial results about water-saving irrigation technologies",
          "Information about financial assistance resources, crop insurance, and similar programs"]
    },
    divider: "before"
  },
  {
    name: "H. Reporting Scales",
    label: "What scale of information is useful to your stakeholders? (Check all that apply)",
    type: { "CheckboxGroup": ["Field/Farm-scale", "Watershed-scale (HUC8, HUC12)", "County-scale", "Statewide"] },
    rules: [{ required: true, message: "Please select at least one reporting scale" }],
    divider: "before"
  },
  {
    name: "I. Water Budget Meetings",
    label: "Are you actively participating in county-level water budgeting meetings?",
    type: { "RadioGroup": ["Frequently", "Sometimes", "Did not get the invitation", "Not sure if these meetings are happening", "I am not interested in these meetings"] },
    divider: "before"
  },
  {
    name: "J. Additional Drought Information Needs",
    label: "What additional drought-related information would benefit your stakeholders?",
    type: { "TextArea": {} },
    divider: "before"
  },
  {
    name: "K. Information Delivery Preferences",
    label: "Rate the importance of the following forms of information delivery",
    type: { "RankingGroup": ["Online interactive tools", "Online informational items (e.g., factsheets)", "Paper-based informational items (e.g., factsheets)", "Field Days/Workshops/On-Farm demonstrations"] },
    divider: "before"
  },
  {
    name: "L. Additional Outreach Strategies",
    label: "What other outreach and engagement strategies should we be pursuing?",
    type: { "TextArea": {} },
    divider: "before"
  },
  {
    name: "M. Email",
    label: ("Optional: If you are interested in helping develop drought decision tools and Extension resources, " 
            + "or would like to be contacted about the results of this survey, please feel free to share your email "
            + "address below or send an email to <a href=\"mailto:ag-water@oreonstate.edu\">ag-water@oreonstate.edu</a>"),
    type: { "TextArea": {} },
    rules: [{ type: "email", message: "Please enter a valid email address" }],
    divider: "before"
  }
];

const description = "Thank you for filling out this online survey. Your responses will help guide development of drought decision tools and Extension resources being developed in response to stakeholder and legislative interest in mitigating drought impacts in the agricultural community in Oregon. All responses are anonymous, and no personally identifiable information will be collected. Thank you for your attention to this matter.";

export default function DroughtSurvey() {
  return (
    <Survey
      surveyID={SURVEY_ID}
      title="Drought Survey"
      description={description}
      questions={questions}
      finishMessage="Thank you for completing the drought survey!"
    />
)}

DroughtSurvey.propTypes = {
};