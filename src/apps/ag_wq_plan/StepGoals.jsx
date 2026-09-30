import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { Button, Checkbox, Divider, Typography } from 'antd';

import ValidationError from './ValidationError';

const { Paragraph } = Typography;

// Step 3: Select desired goals and benefits from implementing practices
// Props:
//   - selectedGoals: Array of selected goal strings
//   - setSelectedGoals: Function to update selected goals
//   - goalData: Array of goal records fetched by AgWqPlan
const StepGoals = ({
  currentPlan, 
  setCurrentPlan,
  goalData, 
  setError,
  savePlan,
  isDirty,
 }) => {
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

  if ( currentPlan?.report_data?.selected_goals?.length === 0) {
    setError('error');
  }
  if (currentPlan?.report_data?.selected_goals?.length > 0) {
    setError('finish');
  }


  return (
    <>
      <Paragraph>
        Select any goals or benefits you would like to see from implementing practices.
      </Paragraph>
      {/* Checkbox group for water quality goals */}

      {currentPlan?.report_data?.selected_goals?.length === 0 && (
        <ValidationError message="Please select at least one goal to help us recommend the most relevant practices for your operation." />
      )}

      <Checkbox.Group
        options={goalOptions}
        value={currentPlan?.report_data?.selected_goals}
        style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}
        onChange={(vals) => {
          const updatedPlan = {
            ...currentPlan,
            report_data: {
              ...currentPlan.report_data,
              selected_goals: vals,
            },
          };
          isDirty.current = true;
          setCurrentPlan(updatedPlan);
        }}
      />
      <Paragraph style={{ marginTop: 16 }}>
        These goals will be used to prioritize practices that provide the most relevant benefits to your operation.
      </Paragraph>

      <Divider />
      <Button type="primary" style={{ marginBottom: 16, marginLeft: 16 }}
              onClick={() => { savePlan(); }}
              disabled={(currentPlan === null 
                        || ( currentPlan?.report_data?.selected_goals.length === 0 )
                        || isDirty.current === false)}
            >
              Save Plan Updates
            </Button>
    </>
  );
};

StepGoals.propTypes = {
  currentPlan: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    report_data: PropTypes.shape({
      selected_goals: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    }),
  }).isRequired,
  setCurrentPlan: PropTypes.func.isRequired,
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
  savePlan: PropTypes.func.isRequired,
  isDirty: PropTypes.shape({
    current: PropTypes.bool,
  }).isRequired,
};

export default StepGoals;
