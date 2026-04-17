import { Form, Radio, Input, Typography, Divider, Button, Grid, Checkbox } from "antd";
import PropTypes from "prop-types";
import { useState } from "react";
import { secrets } from "../../secrets";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

function matchesConditionValue(currentValue, expectedValue) {
  const expectedValues = Array.isArray(expectedValue) ? expectedValue : [expectedValue];

  if (Array.isArray(currentValue)) {
    return expectedValues.every((value) => currentValue.includes(value));
  }

  return expectedValues.every((value) => currentValue === value);
}

function areQuestionConditionsMet(question, formValues) {
  const conditions = question.condition || question.conditions;

  if (!conditions) {
    return true;
  }

  //return Object.entries(conditions).every(([questionName, expectedValue]) =>
  return Object.entries(conditions).some(([questionName, expectedValue]) =>
    matchesConditionValue(formValues?.[questionName], expectedValue)
  );
}


export default function Survey({ surveyID, title, description, questions, finishMessage }) {
  const [form] = Form.useForm();
  const [step, setStep] = useState(1);
  const formValues = Form.useWatch([], form) || {};

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const SURVEY_ENDPOINT = "https://agwater.org:5556/survey/data";
  const SURVEY_SESSION_KEY = "agwater_survey_user_id";

  function getOrCreateSessionId() {
    if (typeof window === "undefined") return "unknown-session";

    const existingSessionId = window.localStorage.getItem(SURVEY_SESSION_KEY);
    if (existingSessionId) return existingSessionId;

    const newSessionId = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    window.localStorage.setItem(SURVEY_SESSION_KEY, newSessionId);
    return newSessionId;
  }

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

  const priorityScale = [
    { label: "Low Priority", value: 0 },
    { label: "Medium Priority", value: 1 },
    { label: "High Priority", value: 2 },
    { label: "Very High Priority", value: 3 }
  ];

  const priorityGroupProps = isMobile ? {} : { optionType: "button", buttonStyle: "solid" };

  const formContainerStyle = {
    maxWidth: 800,
    margin: "0 auto",
    padding: isMobile ? "0 16px 24px" : "0 8px 24px"
  };

  const getLabel = (question, index) => {
    const label = question.label || "";
    const hasHtmlTags = /<[^>]+>/.test(label);  

    return (
      <Text id={`q${index}-label`} style={{ display: "block", marginBottom: 12, color: "yellow", fontSize: "large" }}>
        {hasHtmlTags ? (
          <span dangerouslySetInnerHTML={{ __html: label }} />
        ) : (
          <span>{label}</span>
        )}
      </Text>
    );
  };

  const handleFinish = async (values) => {
    console.log("Survey submitted:", values);

    const data = Object.entries(values).map(([question, response]) => ({
      question,
      response: response ?? ""
    }));

    const payload = {
      survey_id: surveyID,
      session_id: getOrCreateSessionId(),
      data
    };

    try {
      const response = await fetch(SURVEY_ENDPOINT, {
        method: "POST",
        headers: {
          "X-API-Key": secrets.survey_api_key,
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
  };

  return (<>

    {step === 0 && (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <Title level={2} style={{ marginBottom: 16 }}>{title}</Title>
        <Text style={{ fontSize: 18, marginBottom: 32, display: "block" }}>{description}</Text>
        <Button type="primary" size="large" onClick={() => setStep(1)}>Start Survey</Button>
      </div>
    )}

    {step === 1 && (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        scrollToFirstError
        requiredMark
        style={formContainerStyle}
        aria-labelledby="drought-survey-title"
        aria-describedby="drought-survey-description"
      >
        <Title id="survey-title" level={3} style={{ marginBottom: 8 }}>
          {title}
        </Title>

        <Text id="survey-description" style={{ display: "block", marginBottom: 20 }}>
          {description}
        </Text>

        {questions.map((question, index) => {
          if (!areQuestionConditionsMet(question, formValues)) {
            return null;
          }

          const conditionalFormItemProps = question.condition || question.conditions ? { preserve: false } : {};

          switch (Object.keys(question.type)[0]) {  // switch on first dictionary key value to determine question type
            case "RadioGroup":
              return (
                <>
                  {question.divider && (question.divider === "before") && <Divider key={`q${index}-dividerAbove`} />}

                  {getLabel(question, index)}

                  <Form.Item
                    key={index}
                    name={question.name}
                    rules={question.rules}
                    {...conditionalFormItemProps}
                  >
                    <Radio.Group style={{ marginTop: 8,  }}>
                      {question.type.RadioGroup.map((option) => (
                        <Radio key={option} style={stackedRadioStyle} value={option}>{option}</Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                  {question.divider && (question.divider === "after") && <Divider key={`divider-${index}`} />}
                </>
              );

            case "CheckboxGroup":
              return (<>
                {question.divider && (question.divider === "before") && <Divider key={`q${index}-dividerAbove`} />}

                {getLabel(question, index)}

                <Form.Item
                  id={`question-${index}-label`}
                  key={index}
                  name={question.name}
                  {...conditionalFormItemProps}
                  rules={[
                    {
                      validator: (_, value) =>
                        Array.isArray(value) && value.length > 0
                          ? Promise.resolve()
                          : Promise.reject(new Error("Please select at least one primary role"))
                    }
                  ]}
                >
                  <Checkbox.Group aria-labelledby={`question-${index}-label`}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {question.type.CheckboxGroup.map((option) => (
                      <Checkbox key={option} style={stackedCheckboxStyle} value={option}>{option}</Checkbox>
                    ))}
                  </Checkbox.Group>
                </Form.Item>
                {question.divider && (question.divider === "after") && <Divider key={`q${index}-dividerBelow`} />}
              </>
              );

            case "TextArea":
              return (<>
                {question.divider && (question.divider === "before") && <Divider key={`q${index}-dividerAbove`} />}
                {getLabel(question, index)}

                <Form.Item
                  key={index}
                  name={question.name}
                  rules={question.rules}
                  {...conditionalFormItemProps}
                >
                  <TextArea rows={3} placeholder="Your answer..." maxLength={500} showCount />
                </Form.Item>
                {question.divider && (question.divider === "after") && <Divider key={`q${index}-dividerBelow`} />}
              </>
              );

            case "Ranking Group":
              return (<>
                {question.divider && (question.divider === "before") && <Divider key={`q${index}-dividerAbove`} />}
                {getLabel(question, index)}

                {question.type["Ranking Group"].map((item, itemIndex) => (
                  <Form.Item
                    key={itemIndex}
                    label={item}
                    name={[question.name, item]}
                    rules={question.rules}
                    {...conditionalFormItemProps}
                  >
                    <Radio.Group
                      aria-labelledby={`q${index}-label`}
                      options={priorityScale}
                      style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
                      {...priorityGroupProps}
                    />
                  </Form.Item>
                ))}
                {question.divider && (question.divider === "after") && <Divider key={`q${index}-dividerBelow`} />}
              </>);

            default:
              return null;
          }
        })
        }

        <Divider />
        <Button type="primary" htmlType="submit" size="large" block={isMobile}>
          Submit Survey
        </Button>

      </Form>

    )}

    {step === 2 && (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <Title level={2} style={{ marginBottom: 16 }}>Thank you for completing the survey!</Title>
        <Text style={{ fontSize: 18, marginBottom: 32, display: "block" }}>{finishMessage || "Your input is greatly appreciated!"}</Text>
        <Button type="primary" size="large" onClick={() => { window.location.href = "https://agwater.org"; }}>Back to Home</Button>
      </div>
    )}
  </>
  )
}

Survey.propTypes = {
  surveyID: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  questions: PropTypes.arrayOf(PropTypes.object).isRequired,
  finishMessage: PropTypes.string,
};