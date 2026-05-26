import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { Checkbox, Typography } from 'antd';

import ValidationError from './ValidationError';

const { Paragraph } = Typography;

// Step 3: Select desired goals and benefits from implementing practices
// Props:
//   - selectedGoals: Array of selected goal strings
//   - setSelectedGoals: Function to update selected goals
//   - goalData: Array of goal records fetched by AgWqPlan
const StepGoals = ({ selectedGoals, setSelectedGoals, goalData, setError }) => {
  const goalOptions = useMemo(
    () =>
      (Array.isArray(goalData) ? goalData : []).map((goal) => {
        if (typeof goal === 'string') {
          return { label: goal, value: goal };
        }

        const value = goal.id;
        const label = goal.goal;

        return { label, value };
      }).filter((option) => option.value != null),
    [goalData],
  );

  if ( selectedGoals.length === 0) {
    setError('error');
  }
  if (selectedGoals.length > 0) {
    setError('finish');
  }


  return (
    <>
      <Paragraph>
        Select any goals or benefits you would like to see from implementing practices.
      </Paragraph>
      {/* Checkbox group for water quality goals */}

      {selectedGoals.length === 0 && (
        <ValidationError message="Please select at least one goal to help us recommend the most relevant practices for your operation." />
      )}

      <Checkbox.Group
        options={goalOptions}
        value={selectedGoals}
        style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}
        onChange={(vals) => setSelectedGoals(vals)}
      />
      <Paragraph style={{ marginTop: 16 }}>
        These goals will be used to prioritize practices that provide the most relevant benefits to your operation.
      </Paragraph>
    </>
  );
};

StepGoals.propTypes = {
  selectedGoals: PropTypes.arrayOf(PropTypes.number).isRequired,
  setSelectedGoals: PropTypes.func.isRequired,
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
  setError: PropTypes.func.isRequired,
};

export default StepGoals;
