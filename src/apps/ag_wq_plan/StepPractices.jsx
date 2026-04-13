import PropTypes from 'prop-types';
import { Card, Collapse, Tag, Typography, Checkbox } from 'antd';
import ComplianceInfo from './ComplianceInfo';

const { Title, Paragraph, Text } = Typography;

// Step 4: Select and review recommended agricultural water quality practices
// Props:
//   - userType: Current user type (for compliance/TMDL display)
//   - recommendedPractices: Array of Practice objects recommended based on conditions
//   - selectedPracticeIds: Array of selected practice IDs
//   - setSelectedPracticeIds: Function to update selected practice IDs
const StepPractices = ({
  userType,
  recommendedPractices,
  selectedPracticeIds,
  setSelectedPracticeIds,
}) => {
  // Toggle a practice's selection state
  const togglePractice = (id) => {
    setSelectedPracticeIds(
      selectedPracticeIds.includes(id)
        ? selectedPracticeIds.filter((p) => p !== id)
        : [...selectedPracticeIds, id],
    );
  };

  return (
    <>
      <Title level={4}>Recommended practices</Title>
      <Paragraph>
        Based on your conditions, these practices may help protect water quality and meet
        rules and TMDL expectations. Select any that you are interested in implementing to see more details and
        to include them in your plan.
      </Paragraph>

      {/* Accordion list of API-backed recommended practices with detailed information */}
      <Collapse accordion>
        {recommendedPractices.map((p) => (
          <Collapse.Panel
            key={p.id}
            header={
              <span>
                <span
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                  role="presentation"
                >
                  <Checkbox
                    checked={selectedPracticeIds.includes(p.id)}
                    onChange={() => togglePractice(p.id)}
                    style={{ marginRight: 8 }}
                  />
                </span>
                {/* <Text strong>{p.id}</Text> – {p.title} */}
                <Text strong style={{color:'yellow'}}>{p.title}</Text>
              </span>
            }
          >
            <Card style={{ width: '100%' }}>
              <Paragraph>
                <Text strong>Category:</Text> {p.category}
              </Paragraph>
              <Paragraph>
                <Text strong>Helps water quality:</Text>{' '}
                {p.helps.map((h) => (
                  <Tag key={h}>{h}</Tag>
                ))}
              </Paragraph>
              <Paragraph>
                <Text strong>How it helps (ecosystem benefit):</Text> {p.ecosystem_benefits}
              </Paragraph>
              <Paragraph>
                <Text strong>Costs (potential):</Text> {p.costs}
              </Paragraph>
              <Paragraph>
                <Text strong>Benefits (potential):</Text> {p.benefits}
              </Paragraph>
              <Paragraph>
                <Text strong>References:</Text>{' '}
                {p.links.map((l) => (<>
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                    {l.label}
                  </a> <span> | </span>
                  </>
                ))}
              </Paragraph>
              <ComplianceInfo practice={p} userType={userType} />
            </Card>
          </Collapse.Panel>
        ))}
      </Collapse>
    </>
  );
};

StepPractices.propTypes = {
  userType: PropTypes.string.isRequired,
  recommendedPractices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      helps: PropTypes.arrayOf(PropTypes.string).isRequired,
      ecosystemBenefits: PropTypes.string.isRequired,
      costs: PropTypes.string.isRequired,
      benefits: PropTypes.string.isRequired,
      links: PropTypes.arrayOf(
        PropTypes.shape({
          url: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ).isRequired,
      tmdls: PropTypes.arrayOf(PropTypes.string),
      complianceNotes: PropTypes.string,
    })
  ).isRequired,
  selectedPracticeIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  setSelectedPracticeIds: PropTypes.func.isRequired,
};

export default StepPractices;
