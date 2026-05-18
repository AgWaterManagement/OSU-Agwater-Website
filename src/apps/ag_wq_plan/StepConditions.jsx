import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { Checkbox, Divider, Typography } from 'antd';

const { Title, Paragraph } = Typography;

// Step 2: Select land conditions and concerns
// Props:
//   - concernData: Array of concern records fetched by AgWqPlan
//   - selectedConcerns: Array of selected concerns
//   - setSelectedConcerns: Function to update selected concerns
//   - filteredQuestions: Array of questions filtered by selected concerns
//   - selectedQuestions: Array of selected question IDs
//   - setSelectedQuestions: Function to update selected questions
const StepConditions = ({
  concernData,
  selectedConcerns,
  setSelectedConcerns,
  filteredQuestions,
  selectedQuestions,
  setSelectedQuestions,
}) => {
  const concernOptions = useMemo(
    () =>
      (Array.isArray(concernData) ? concernData : [])
        .map((concern) => {
          if (typeof concern === 'string') {
            return { label: concern, value: concern };
          }

          const value = concern.concern;
          const label = concern.concern;

          return { label, value };
        })
        .filter((option) => option.value != null),
    [concernData],
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
        value={selectedConcerns}
        onChange={(vals) => setSelectedConcerns(vals)}
      />
      <Divider />
      <Title level={4}>Questions</Title>
      <Paragraph>
        Select any questions below that apply to the selected conditions or concerns.
      </Paragraph>
      {/* Detailed questions matching selected concerns */}
      <Checkbox.Group
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        value={selectedQuestions}
        onChange={(vals) => setSelectedQuestions(vals)}
      >
        {filteredQuestions.map((q) => (
          <Checkbox key={q.id} value={q.id}>
            {q.question} <span style={{ color: '#999' }}>({q.concern})</span>
          </Checkbox>
        ))}
      </Checkbox.Group>
    </>
  );
};

StepConditions.propTypes = {
  concernData: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string,
        name: PropTypes.string,
        text: PropTypes.string,
        concern: PropTypes.string,
      }),
    ]),
  ).isRequired,
  selectedConcerns: PropTypes.arrayOf(PropTypes.string).isRequired,
  setSelectedConcerns: PropTypes.func.isRequired,
  filteredQuestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      question: PropTypes.string.isRequired,
      concern: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedQuestions: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  setSelectedQuestions: PropTypes.func.isRequired,
};

export default StepConditions;
