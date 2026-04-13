import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { Checkbox, Typography } from 'antd';

const { Paragraph } = Typography;

// Step 3: Select desired goals and benefits from implementing practices
// Props:
//   - selectedGoals: Array of selected goal strings
//   - setSelectedGoals: Function to update selected goals
//   - goalData: Array of goal records fetched by AgWqPlan
const StepGoals = ({ selectedGoals, setSelectedGoals, goalData }) => {
  const goalOptions = useMemo(
    () =>
      (Array.isArray(goalData) ? goalData : []).map((goal) => {
        if (typeof goal === 'string') {
          return { label: goal, value: goal };
        }

        const value = goal.value ?? goal.id ?? goal.name ?? goal.text ?? goal.label;
        const label = goal.label ?? goal.name ?? goal.text ?? goal.goal ?? value;

        return { label, value };
      }).filter((option) => option.value != null),
    [goalData],
  );

  return (
    <>
      <Paragraph>
        Select any goals or benefits you would like to see from implementing practices.
      </Paragraph>
      {/* Checkbox group for water quality goals */}

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
  selectedGoals: PropTypes.arrayOf(PropTypes.string).isRequired,
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
};

export default StepGoals;
