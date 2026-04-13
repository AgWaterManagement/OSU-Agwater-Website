import { Alert, Tag, Space, Typography } from 'antd';
import PropTypes from 'prop-types';

const { Text } = Typography;

const ComplianceInfo = ({ practice, userType }) => {
  const showComplianceNotes = userType === 'ODA – Compliance';
  const showTMDLInfo = userType === 'Board / TMDL';

  if (!showComplianceNotes && !showTMDLInfo) {
    return null;
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
      {showTMDLInfo && practice.tmdls && practice.tmdls.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Text strong>TMDL Applicable:</Text>
          <Space wrap style={{ marginTop: 6 }}>
            {practice.tmdls.map((tmdl) => (
              <Tag key={tmdl} color="processing">
                {tmdl}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {showComplianceNotes && practice.complianceNotes && (
        <Alert
          message="Compliance Information"
          description={practice.complianceNotes}
          type="warning"
          style={{ marginBottom: 12 }}
        />
      )}

      {showTMDLInfo && !practice.tmdls && !practice.complianceNotes && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Not currently associated with a specific TMDL requirement.
        </Text>
      )}
    </div>
  );
};

ComplianceInfo.propTypes = {
  practice: PropTypes.shape({
    tmdls: PropTypes.arrayOf(PropTypes.string),
    complianceNotes: PropTypes.string,
  }).isRequired,
  userType: PropTypes.string.isRequired,
};

export default ComplianceInfo;
