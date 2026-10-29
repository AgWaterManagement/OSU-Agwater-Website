import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { Button, Checkbox, Divider, Typography } from 'antd';
import ValidationError from './ValidationError';

const { Title, Paragraph } = Typography;

// Step 2: Select land conditions and concerns
// Props:
//   - concernData: Array of concern records fetched by AgWqPlan
//   - selectedConcerns: Array of selected concerns
//   - setSelectedConcerns: Function to update selected concerns
//   - selectedQuestions: Array of selected question IDs
//   - setSelectedQuestions: Function to update selected questions
const StepConditions = ({
  userName,
  currentPlan,
  setCurrentPlan,
  concernsData,
  concernQuestionsData,
  setError,
  savePlan,
  isDirty,
}) => {
  const concernOptions = useMemo(
    () =>
      (Array.isArray(concernsData) ? concernsData : [])
        .map((concern) => {
          if (typeof concern === 'string') {
            return { label: concern, value: concern };
          }

          const value = concern.concern;
          const label = concern.concern;

          return { label, value };
        })
        .filter((option) => option.value != null),
    [concernsData],
  );

  if (currentPlan && currentPlan.report_data && currentPlan.report_data.selected_concerns && currentPlan.report_data.selected_questions) {
    if (currentPlan.report_data.selected_concerns.length === 0 || currentPlan.report_data.selected_questions.length === 0) {
      setError('error');
    }
  }

  if (currentPlan && currentPlan.report_data && currentPlan.report_data.selected_concerns && currentPlan.report_data.selected_questions) {
    if (currentPlan.report_data.selected_concerns.length > 0 && currentPlan.report_data.selected_questions.length > 0) {
      setError('finish');
    }
  }

  // Filter questions based on selected concerns
  const filteredQuestions = useMemo(
    () =>
      concernQuestionsData.filter((q) =>
        currentPlan.report_data.selected_concerns.length ? currentPlan.report_data.selected_concerns.includes(q.concern) : true,
      ),
    [currentPlan, concernQuestionsData],
  );


  return (
    <>
      <Title level={4}>Select conditions or concerns on the land</Title>
      <Paragraph>
        Select any conditions or concerns that apply to the land you are planning for. These will be used to filter the available questions and to recommend relevant practices.
      </Paragraph>
      {/* Concern  checkboxes to filter available questions */}
      <Checkbox.Group
        options={concernOptions}
        value={currentPlan.report_data.selected_concerns}
        onChange={(vals) => {
          const updatedPlan = {
            ...currentPlan,
            report_data: {
              ...currentPlan.report_data,
              selected_concerns: vals,
            },
          };
          isDirty.current = true;
          setCurrentPlan(updatedPlan);
        }}
      />

      {currentPlan.report_data.selected_concerns.length === 0 && (
        <Paragraph style={{ marginTop: 16 }}>
          <ValidationError message="Please select at least one concern to proceed." />
        </Paragraph>
      )}

      <Divider />
      {currentPlan.report_data.selected_concerns.length > 0 && (
        <>

          <Title level={4}>Questions</Title>
          <Paragraph>
            Select any questions below that apply to the selected conditions or concerns.
          </Paragraph>

          {currentPlan.report_data.selected_questions.length === 0 && (
            <Paragraph style={{ marginTop: 16 }}>
              <ValidationError message="Please select at least one question to proceed." />
            </Paragraph>
          )}

          {/* Detailed questions matching selected concerns */}
          <Checkbox.Group
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            value={currentPlan.report_data.selected_questions}
            onChange={(vals) => {
              const updatedPlan = {
                ...currentPlan,
                report_data: {
                  ...currentPlan.report_data,
                  selected_questions: vals,
                },
              };
              setCurrentPlan(updatedPlan);
            }}
          >
            {filteredQuestions.map((q) => (
              <Checkbox key={q.id} value={q.id}>
                {q.question} <span style={{ color: '#999' }}>({q.concern})</span>
              </Checkbox>
            ))}
          </Checkbox.Group>
          
          <Divider />
          <Button type="primary" style={{ marginBottom: 16, marginLeft: 16 }}
                  onClick={() => { savePlan(); }}
                  disabled={(currentPlan === null || userName === null || userName === 'Guest' 
                            || ( currentPlan?.report_data?.selected_concerns.length === 0 )
                            || ( currentPlan?.report_data?.selected_questions.length === 0 )
                            || isDirty.current === false)}
                >
                  Save Plan Updates
                </Button>
                
        </>
      )}
    </>
  );
};

StepConditions.propTypes = {
  currentPlan: PropTypes.shape({
    report_data: PropTypes.shape({
      selected_concerns: PropTypes.arrayOf(PropTypes.string).isRequired,
      selected_questions: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      ).isRequired,
    }).isRequired,
  }).isRequired,
  concernsData: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        concern: PropTypes.string,
        question: PropTypes.string,
        concern_id: PropTypes.number,
  })).isRequired,
  concernQuestionsData: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        concern: PropTypes.string,
      })).isRequired,
};

export default StepConditions;
