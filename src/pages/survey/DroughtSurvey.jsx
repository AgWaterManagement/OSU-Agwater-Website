import { Form, Radio, Input, Typography, Divider, Button, Grid, Checkbox } from "antd";
import PropTypes from "prop-types";
import { useState } from "react";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const SURVEY_ENDPOINT = "https://agwater.org:5556/survey/data";
const SURVEY_ID = 3; // Unique identifier for the drought survey in the backend
const DROUGHT_SURVEY_SESSION_KEY = "drought_survey_user_id";

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "unknown-session";

  const existingSessionId = window.localStorage.getItem(DROUGHT_SURVEY_SESSION_KEY);
  if (existingSessionId) return existingSessionId;

  const newSessionId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(DROUGHT_SURVEY_SESSION_KEY, newSessionId);
  return newSessionId;
}

export default function DroughtSurvey({ onSubmit }) {
  const [form] = Form.useForm();
  const [primaryRole, setPrimaryRole] = useState([]);
  const [, setDroughtChallenges] = useState([]);
  const [step, setStep] = useState(0);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const priorityScale = [
    { label: "Low Priority", value: 0 },
    { label: "Medium Priority", value: 1 },
    { label: "High Priority", value: 2 },
    { label: "Very High Priority", value: 3 }
  ];

  const stackedRadioStyle = {
    display: "block",
    minHeight: 44,
    lineHeight: 1.4,
    marginBottom: 1,
    marginInlineEnd: 0,
    whiteSpace: "normal"
  };

  const stackedCheckboxStyle = {
    display: "flex",
    alignItems: "center",
    minHeight: 32,
    lineHeight: "20px",
    marginInlineEnd: 0
  };

  const priorityGroupProps = isMobile
    ? {}
    : {
        optionType: "button",
        buttonStyle: "solid"
      };

  const formContainerStyle = {
    maxWidth: 800,
    margin: "0 auto",
    padding: isMobile ? "0 16px 24px" : "0 8px 24px"
  };

  const handleFinish = async (values) => {
    console.log("Survey submitted:", values);

    const data = Object.entries(values).map(([question, response]) => ({
      question,
      response: response ?? ""
    }));

    const payload = {
      survey_id: SURVEY_ID,
      session_id: getOrCreateSessionId(),
      data
    };

    try {
      const response = await fetch(SURVEY_ENDPOINT, {
        method: "POST",
        headers: {
          "X-API-Key": "survey-web-app",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error("Error submitting drought survey data");
      } else {
        console.log("Drought survey data submitted successfully");
        setStep(2);
      }

    } catch (error) {
      console.error("Error submitting drought survey data:", error);
    }

    if (onSubmit) onSubmit(values);
  };

  return ( 
    <>
    { step === 0 && (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <Title level={2} style={{ marginBottom: 16 }}>Extension Drought Information Needs Survey</Title>
        <Text style={{ fontSize: 18, marginBottom: 32, display: "block" }}>
          We invite you to participate in a survey to help us understand the drought information needs of the stakeholders you serve.
          Your input will guide the development of drought decision tools and information resources being developed
          in response to stakeholder and legislative interest in mitigating drought impacts in the agricultural community in Oregon.
          The survey should take about 10-15 minutes to complete.
        </Text>
        <Button type="primary" size="large" onClick={() => setStep(1)}>Start Survey</Button>
      </div>
    )}


    { step === 1 && (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      onValuesChange={(changedValues) => {
        if (changedValues["Q1. Primary Role"] !== undefined) {
          setPrimaryRole(changedValues["Q1. Primary Role"]);
        }

        if (changedValues["Q2. Drought Challenges"] !== undefined) {
          setDroughtChallenges(changedValues["Q2. Drought Challenges"]);
        }
      }}
      scrollToFirstError
      requiredMark
      style={formContainerStyle}
      aria-labelledby="drought-survey-title"
      aria-describedby="drought-survey-description"
    >
      <Title id="drought-survey-title" level={3} style={{ marginBottom: 8 }}>
        Drought Information Needs for Your Stakeholders
      </Title>

      <Text id="drought-survey-description" style={{ display: "block", marginBottom: 20 }}>
        Thanks you for filling out this online survey.  Your responses will help guide development of
        drought decision tools and information resources being developed in response to stakeholder and legislative interest in mitigating drought impacts in the agricultural community in Oregon.
        All responses are anonymous, and no personally identifiable information will be collected.   Thank you for your attention to this matter.
      </Text>

      <Form.Item
        label={<strong id="primary-role-label" style={{color:'yellow'}}>What is your primary role?</strong>}
        name="Q1. Primary Role"
        rules={[
          {
            validator: (_, value) =>
              Array.isArray(value) && value.length > 0
                ? Promise.resolve()
                : Promise.reject(new Error("Please select at least one primary role"))
          }
        ]}
      >
        <Checkbox.Group aria-labelledby="primary-role-label" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Checkbox style={stackedCheckboxStyle} value="County Extension">County Extension</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Statewide Extension">Statewide Extension</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Researcher">Researcher</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Teaching">Teaching</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Other">Other</Checkbox>
        </Checkbox.Group>
      </Form.Item>

      {primaryRole.includes("Other") && (
        <Form.Item
          label={<strong>If &apos;Other&apos; is selected, please describe your role:</strong>}
          name="Q2. Primary Role Description"
        >
          <TextArea rows={3} placeholder="Describe your primary role..." maxLength={500} showCount />
        </Form.Item>
      )}

      {/* Q3 */}
      <Form.Item
        label={<strong style={{ color: 'yellow' }}>What county(s)/region(s) do you serve?</strong>}
        name="Q2. Primary Role Regions"
      >
        <TextArea
          rows={3}
          placeholder="List the region(s) you serve (e.g., county, watershed, or statewide)."
          maxLength={500}
          showCount
        />
      </Form.Item>

      <Divider />

      {/* Q3 */}
      <Form.Item
        label={<span id="q3-label" style={{color:'yellow', fontSize:'large'}}><strong> How concerned are your stakeholders about managing drought?</strong></span>}
        name="Q3. Stakeholder Level of Concern"
        rules={[{ required: true, message: "Please select an option" }]}
      >
        <Radio.Group aria-labelledby="q3-label" style={{marginTop: 8}}>
          <Radio style={stackedRadioStyle} value="Not concerned">Not concerned</Radio>
          <Radio style={stackedRadioStyle} value="Moderately concerned">Moderately concerned</Radio>
          <Radio style={stackedRadioStyle} value="Highly concerned">Highly concerned</Radio>
          <Radio style={stackedRadioStyle} value="Extremely concerned">Extremely concerned</Radio>
        </Radio.Group>
      </Form.Item>

      <Divider />

      {/* Q4 */}
      <Text id="q4-heading" style={{ display: "block", marginBottom: 12, color:'yellow', fontSize:'large' }}>
        <strong>Please prioritize the following areas of drought-related information for your stakeholders:</strong>
      </Text>

      <Form.Item label="1. Short term (1-14 days), site-specific forecasts of anticipated drought severity / water availability" name={["Q4. Priorities", "Short Term Drought Forecasts"]}>
        <Radio.Group
          aria-labelledby="q4-heading"
          options={priorityScale}
          style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
          {...priorityGroupProps}
        />
      </Form.Item>

      <Form.Item label="2. Long term (3-6 months), site-specific forecasts of anticipated drought severity / water availability" name={["Q4. Priorities", "Long Term Drought Forecasts"]}>
        <Radio.Group
          aria-labelledby="q4-heading"
          options={priorityScale}
          style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
          {...priorityGroupProps}
        />
      </Form.Item>

      <Form.Item label="3. Prior year(s) crop water availability/use" name={["Q4. Priorities", "Prior Year Water Use"]}>
        <Radio.Group
          aria-labelledby="q4-heading"
          options={priorityScale}
          style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
          {...priorityGroupProps}
        />
      </Form.Item>

      <Form.Item label="4. Potential water savings from switching to lower water use crops" name={["Q4. Priorities", "Crop Switching for Water Savings"]}>
        <Radio.Group
          aria-labelledby="q4-heading"
          options={priorityScale}
          style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
          {...priorityGroupProps}
        />
      </Form.Item>

      <Form.Item label="5. Information / trial results about water-saving irrigation technologies" name={["Q4. Priorities", "Irrigation Technologies"]}>
        <Radio.Group
          aria-labelledby="q4-heading"
          options={priorityScale}
          style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
          {...priorityGroupProps}
        />
      </Form.Item>

      <Form.Item label="6. Information about financial assistance resources, crop insurance, and similar programs" name={["Q4. Priorities", "Financial Assistance Info"]}>
        <Radio.Group
          aria-labelledby="q4-heading"
          options={priorityScale}
          style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
          {...priorityGroupProps}
        />
      </Form.Item>

      <Divider />

      {/* Q5 */}
      <Form.Item
        label={<strong style={{color:'yellow', fontSize:'large'}}>What drought-related challenges are your stakeholders currently experiencing? (Select all that apply)</strong>}
        name="Q5. Challenges"
      >
        <Checkbox.Group style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Checkbox style={stackedCheckboxStyle} value="Reduced irrigation water allocations">Reduced irrigation water allocations</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Groundwater declines">Groundwater declines</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Increased pumping costs">Increased pumping costs</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Crop yield reductions">Crop yield reductions</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Crop quality impacts">Crop quality impacts</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Changes in planting decisions">Changes in planting decisions</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Switching to lower water-use crops">Switching to lower water-use crops</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Irrigation scheduling challenges">Irrigation scheduling challenges</Checkbox>
          <Checkbox style={stackedCheckboxStyle} value="Soil moisture deficits">Soil moisture deficits</Checkbox>
        </Checkbox.Group>
      </Form.Item>

      {/* Q6 */}
        <Form.Item
          label={<strong>Please describe any other drought-related challenges</strong>}
          name="Q6. Other Challenges"
        >
          <TextArea rows={3} placeholder="Describe other drought-related challenges..." maxLength={500} showCount />
        </Form.Item>

      <Divider />

      {/* Q7 */}
      <Form.Item
        label={<strong style={{color:'yellow', fontSize:'large'}}>What scale of information is useful to your stakeholders? (Check all that apply)</strong>}
        name="Q7. Reporting Scales"
      >
        <Checkbox.Group style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Checkbox value="Field/Farm-scale">Field/Farm-scale</Checkbox>
          <Checkbox value="Watershed-scale (HUC8, HUC12)">Watershed-scale (HUC8, HUC12)</Checkbox>
          <Checkbox value="County-scale">County-scale</Checkbox>
          <Checkbox value="Statewide">Statewide</Checkbox>
        </Checkbox.Group>
      </Form.Item>

      <Divider />

      {/* Q8 */}
      <Form.Item
        label={<strong id="q8-label" style={{color:'yellow', fontSize:'large'}}>Are you actively participating in county-level water budgeting meetings?</strong>}
        name="Q8. Water Budget Meetings"
      >
        <Radio.Group aria-labelledby="q8-label" style={{marginTop: 8}}>
          <Radio style={stackedRadioStyle} value="Frequently">Frequently</Radio>
          <Radio style={stackedRadioStyle} value="Sometimes">Sometimes</Radio>
          <Radio style={stackedRadioStyle} value="Did not get the invitation">Did not get the invitation</Radio>
          <Radio style={stackedRadioStyle} value="Not sure if these meetings are happening">Not sure if these meetings are happening</Radio>
          <Radio style={stackedRadioStyle} value="I am not interested in these meetings">I am not interested in these meetings</Radio>
        </Radio.Group>
      </Form.Item>

      <Divider />

      {/* Q9 */}
      <Form.Item
        label={<strong style={{color:'yellow', fontSize:'large'}}>What additional drought-related information would benefit your stakeholders?</strong>}
        name="Additional Drought Information"
      >
        <TextArea rows={4} showCount maxLength={1000} />
      </Form.Item>

      <Divider />

      {/* Q10 */}
      <Text id="q10-heading" strong style={{ display: "block", marginBottom: 8, color:'yellow', fontSize:'large' }}>
        Rate the importance of the following forms of information delivery
      </Text>

      <Form.Item label="Online interactive tools" name={["Q10. Information Delivery Types", "Online Tools"]}>
        <Radio.Group
          aria-labelledby="q10-heading"
          options={priorityScale}
          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
          {...priorityGroupProps}
        />
      </Form.Item>

      <Form.Item label="Online informational items (e.g., factsheets)" name={["Q10. Information Delivery Types", "Online Factsheets"]}>
        <Radio.Group
          aria-labelledby="q10-heading"
          options={priorityScale}
          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
          {...priorityGroupProps}
        />
      </Form.Item>

      <Form.Item label="Paper-based informational items (e.g., factsheets)" name={["Q10. Information Delivery Types", "Paper Factsheets"]}>
        <Radio.Group
          aria-labelledby="q10-heading"
          options={priorityScale}
          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
          {...priorityGroupProps}
        />
      </Form.Item>

      <Form.Item label="Field Days/Workshops/On-Farm demonstrations" name={["Q10. Information Delivery Types", "Field Days"]}>
        <Radio.Group
          aria-labelledby="q10-heading"
          options={priorityScale}
          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
          {...priorityGroupProps}
        />
      </Form.Item>

      <Divider />

      {/* Q11 */}
      <Form.Item
        label={<strong style={{color:'yellow', fontSize:'large'}}>What other outreach and engagement strategies should we be pursuing?</strong>}
        name="Q11. Additional Outreach Strategies"
        
      >
        <TextArea rows={4} showCount maxLength={1000} />
      </Form.Item>

      <Divider />

      {/* Q12 */}
      <Form.Item
        label={<span style={{color:'yellow' }}>Optional: If you are interested in helping develop drought
         decision tools and Extension resources, or would like to be contacted about the results of this survey,
         please feel free to share your email address below or send an email to <a style={{color:'lightblue'}} href="mailto:ag-water@oregonstate.edu">ag-water@oregonstate.edu</a>.</span>}
        name="Q12. Email"
        rules={[{ type: "email", message: "Please enter a valid email address" }]}
      >
        <Input placeholder="name@example.com" />
      </Form.Item>

      <Divider />

      <Button type="primary" htmlType="submit" size="large" block={isMobile}>
        Submit Survey
      </Button>
    </Form>
    )}

    { step === 2 && (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <Title level={2} style={{ marginBottom: 16 }}>Thank you for completing the survey!</Title>
        <Text style={{ fontSize: 18, marginBottom: 32, display: "block" }}>
          Your input is greatly appreciated and will help guide the development of drought decision tools and Extension resources to support the stakeholders you serve.
          </Text>
        <Button type="primary" size="large" onClick={() => { window.location.href = "https://agwater.org"; }}>Back to Home</Button>
      </div>
    )}
          
  </>
)}

DroughtSurvey.propTypes = {
  onSubmit: PropTypes.func
};