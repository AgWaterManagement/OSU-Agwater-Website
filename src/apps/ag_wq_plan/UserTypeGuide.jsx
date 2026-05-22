import { Alert, Select, Typography, Divider } from 'antd';
import PropTypes from 'prop-types';

const { Text } = Typography;

const userTypeGuides = {
  Landowner: {
    title: 'Landowner Guidance',
    description:
      'This tool helps you identify water quality practices suited to your land conditions and goals. You can filter practices by your region and operation type to get locally relevant recommendations.',
    tips: [
      'Select your region to see practices that work well in your area',
      'Identify conditions on your land that concern you',
      'Choose practices that align with your goals',
      'Review resources and technical assistance options',
      'Share your summary with a SWCD office for planning support',
    ],
  },
  'SWCD / TA': {
    title: 'SWCD / Technical Assistant View',
    description:
      'This tool helps you develop site-specific conservation plans with landowners. Use it to document land conditions, identify appropriate practices, and connect landowners with resources and incentive programs.',
    tips: [
      'Work with landowners to identify priority water quality concerns',
      'Cross-reference practices with available funding programs',
      'Consider regional water quality priorities and TMDL requirements',
      'Document selected practices in conservation plans',
      'Use the summary to generate reports for landowners and programs',
    ],
  },
  'ODA - Compliance': {
    title: 'ODA Compliance View',
    description:
      'This tool supports water quality compliance tracking and enforcement. Review practices and their compliance implications for agricultural operations.',
    tips: [
      'Practices are tagged with relevant compliance requirements',
      'Review compliance notes for each practice',
      'Track which practices address TMDL requirements',
      'Document compliance actions taken by operators',
      'Use summaries for compliance reporting',
    ],
  },
  'Board / TMDL': {
    title: 'Board/TMDL Coordinator View',
    description:
      'This tool helps coordinate water quality improvement efforts across regions and TMDLs. Filter practices by TMDL status and track implementation progress.',
    tips: [
      'Filter recommended practices by TMDL applicability',
      'Track which practices address your TMDL targets',
      'Prioritize practices that address multiple water quality concerns',
      'Coordinate implementation across regions',
      'Monitor progress toward TMDL objectives',
    ],
  },
};

const TMDLFilter = ({ selectedTMDLs, onTMDLChange, availableTMDLs }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <Text strong>Filter by TMDL:</Text>
      <Select
        mode="multiple"
        placeholder="Select TMDLs to filter practices"
        value={selectedTMDLs}
        onChange={onTMDLChange}
        options={availableTMDLs.map((tmdl) => ({
          label: tmdl,
          value: tmdl,
        }))}
        style={{ width: '100%', marginTop: 8 }}
      />
    </div>
  );
};

TMDLFilter.propTypes = {
  selectedTMDLs: PropTypes.arrayOf(PropTypes.string),
  onTMDLChange: PropTypes.func,
  availableTMDLs: PropTypes.arrayOf(PropTypes.string),
};

const UserTypeGuide = ({ userType, children, selectedTMDLs, onTMDLChange, availableTMDLs }) => {
  const guide = userTypeGuides[userType] || userTypeGuides.Landowner;

  return (
    <div>
      <Alert
        message={guide.title}
        description={guide.description}
        type="info"
        style={{ marginBottom: 16 }}
      />

      {userType === 'Board / TMDL' && (
        <>
          <TMDLFilter
            selectedTMDLs={selectedTMDLs}
            onTMDLChange={onTMDLChange}
            availableTMDLs={availableTMDLs}
          />
          <Divider />
        </>
      )}

      <div style={{ color: 'white', marginBottom: 16 }}>
        <Text strong>Quick Tips</Text>
        <ul style={{ paddingLeft: 20 }}>
          {guide.tips.map((tip, index) => (
            <li key={index} style={{ color: 'white' }}>{tip}</li>
          ))}
        </ul>
      </div>

      {children}
    </div>
  );
};

UserTypeGuide.propTypes = {
  userType: PropTypes.string.isRequired,
  children: PropTypes.node,
  selectedTMDLs: PropTypes.arrayOf(PropTypes.string),
  onTMDLChange: PropTypes.func,
  availableTMDLs: PropTypes.arrayOf(PropTypes.string),
};

export default UserTypeGuide;
