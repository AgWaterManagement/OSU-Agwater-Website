// Import React and Ant Design components for form building
import PropTypes from 'prop-types';
import { Form, Select, Typography } from 'antd';

// Extract Typography.Paragraph component for use in the form description
const { Paragraph } = Typography;

// Component for Step 1: Collect user type, region, and commodity information
// This component renders a form where users identify themselves and their operation location
// Props:
//   - userType: Current selected user type
//   - setUserType: Function to update user type
//   - region: Current selected region (optional)
//   - setRegion: Function to update region
//   - commodity: Current selected commodity/operation type (optional)
//   - setCommodity: Function to update commodity
const StepWhoWhere = ({
  userType,
  setUserType,
  region,
  setRegion,
  commodity,
  setCommodity,
}) => {
  return (
    <>
      {/* Instructions for the user */}
      <Paragraph>
        Select who you are and where the operation is located. This helps tailor practices
        and resources to your situation.
      </Paragraph>
      <Form layout="vertical">
        {/* Form field for selecting user type */}
        {/* Each user type has different perspectives and needs */}
        <Form.Item label="User type">
          <Select
            value={userType}
            onChange={setUserType}
            style={{width: '30em'}}
            options={[
              { label: 'Landowner', value: 'Landowner' },
              { label: 'SWCD / Technical Assistant', value: 'SWCD / TA' },
              { label: 'ODA – Compliance', value: 'ODA – Compliance' },
              { label: 'Board / TMDL', value: 'Board / TMDL' },
            ]}
          />
        </Form.Item>
        {/* Form field for selecting geographic region */}
        {/* Optional field to limit recommendations to specific regions */}
        <Form.Item label="Region">
          <Select
            value={region}
            onChange={(v) => setRegion(v)}
            allowClear
            placeholder="Select region"
            style={{width: '30em'}}
            options={[
              { label: 'All Oregon', value: 'All' },
              { label: 'Western Oregon', value: 'Western OR' },
              { label: 'Eastern Oregon', value: 'Eastern OR' },
            ]}
          />
        </Form.Item>
        {/* Form field for selecting commodity or operation type */}
        {/* Optional field to tailor recommendations to specific crop/livestock types */}
        <Form.Item label="Commodity / operation type">
          <Select
            value={commodity}
            onChange={(v) => setCommodity(v)}
            allowClear
            placeholder="e.g., pasture, row crops, orchards, livestock"
            style={{width: '30em'}}
            options={[
              { label: 'Pasture / Hay', value: 'Pasture' },
              { label: 'Row crops', value: 'Row crops' },
              { label: 'Orchards / Vineyards', value: 'Orchards' },
              { label: 'Livestock / Equine', value: 'Livestock' },
            ]}
          />
        </Form.Item>
      </Form>
    </>
  );
};

StepWhoWhere.propTypes = {
  userType: PropTypes.string.isRequired,
  setUserType: PropTypes.func.isRequired,
  region: PropTypes.string,
  setRegion: PropTypes.func.isRequired,
  commodity: PropTypes.string,
  setCommodity: PropTypes.func.isRequired,
};

// Export the component as default
export default StepWhoWhere;
