import { useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button, Divider, Typography, Tag, Space } from 'antd';

const { Title, Paragraph, Text } = Typography;

// Step 5: Final summary and review of selected plan
// Creates a printable/exportable summary of the water quality practices plan
// Props:
//   - userType: Selected user type (Landowner, SWCD/TA, etc.)
//   - region: Selected region (optional)
//   - commodity: Selected commodity/operation type (optional)
//   - selectedConcerns: Array of selected concerns from StepConditions
//   - selectedQuestions: Array of selected question IDs
//   - selectedGoals: Array of selected goal strings
//   - goalData: Array of fetched goal records from /agwqplan/goals
//   - selectedPractices: Array of selected Practice objects
//   - concernQuestions: Array of fetched concern question objects from /agwqplan/concernQuestions
const StepSummary = ({
  userType,
  region,
  commodity,
  selectedConcerns,
  selectedQuestions,
  selectedGoals,
  goalData,
  selectedPractices,
  concernQuestions,
}) => {
  const printRef = useRef(null);

  // Handle printing/saving as PDF
  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(
      `<html><head><title>Ag WQ Plan</title></head><body>${printContents}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  };

  // Create map of question IDs to question objects for lookup
  const questionMap = new Map();
  concernQuestions.forEach((q) => questionMap.set(q.id, q));

  const goalLabelMap = useMemo(() => {
    const map = new Map();
    (Array.isArray(goalData) ? goalData : []).forEach((goal) => {
      const value = goal.id;
      const label = goal.goal;
      if (value != null) {
        map.set(String(value), String(label));
      }
    });
    return map;
  }, [goalData]);

  return (
    <>
      {/* Printable content container */}
      <div ref={printRef}>
        <Title level={3}>Site‑Specific Water Quality Practices Plan</Title>

        {/* Summary section: User info and location */}
        <Title level={4}>Summary</Title>
        <Paragraph>
          <Text strong>User type:</Text> {userType}
        </Paragraph>
        <Paragraph>
          <Text strong>Region:</Text> {region || 'Not specified'}
        </Paragraph>
        <Paragraph>
          <Text strong>Commodity / operation:</Text> {commodity.current || 'Not specified'}
        </Paragraph>

        <Divider />

        {/* Conditions/Concerns section */}
        <Title level={4}>Conditions / Concerns</Title>
        {selectedConcerns.length === 0 ? (
          <Paragraph>No concerns selected.</Paragraph>
        ) : (
          <Space wrap>
            {selectedConcerns.map((concern) => (
              <Tag key={concern}>{concern}</Tag>
            ))}
          </Space>
        )}

        <Divider />
        <Title level={5}>Selected Questions</Title>
        {selectedQuestions.length === 0 ? (
          <Paragraph>No specific conditions selected.</Paragraph>
        ) : (
          <ul>
            {selectedQuestions.map((id) => {
              const q = questionMap.get(id);
              if (!q) return null;
              return (
                <li key={id}>
                  {q.question} <Tag key={q.concern}>{q.concern}</Tag>
                </li>
              );
            })}
          </ul>
        )}

        <Divider />

        {/* Goals/Benefits section */}
        <Title level={4}>Goals / Desired Benefits</Title>
        {selectedGoals.length === 0 ? (
          <Paragraph>No goals selected.</Paragraph>
        ) : (
          <ul>
            {selectedGoals.map((g) => (
                <li key={g}>
                  {goalLabelMap.get(String(g))}
                </li>
            ))}
          </ul>
        )}

        <Divider />

        {/* Recommended practices section with full details */}
        <Title level={4}>Recommended Practices</Title>
        {selectedPractices.length === 0 ? (
          <Paragraph>No practices selected yet. Go back to choose practices to include.</Paragraph>
        ) : (
          selectedPractices.map((p) => (
            <div key={p.id} style={{ marginBottom: 16 }}>
              <Paragraph>
                <Text strong>
                  {p.title}
                </Text>
              </Paragraph>
              <Paragraph>
                <Text strong>Helps water quality:</Text>{' '}
                {p.helps.map((h) => (
                  <Tag key={h}>{h}</Tag>
                ))}
              </Paragraph>
              <Paragraph>
                <Text strong>How it helps:</Text> {p.ecosystem_benefits}
              </Paragraph>
              <Paragraph>
                <Text strong>Notes:</Text> {p.benefits}
              </Paragraph>
              <Paragraph>
                <Text strong>References:</Text>{' '}
                {p.links.map((l, index) => ( <>
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                    {l.label}
                  </a>
                   { index < p.links.length - 1 && <span style={{ color: 'yellow' }}> | </span> }
                  </>
                ))}
              </Paragraph>
            </div>
          ))
        )}

        <Divider />

        <Paragraph>
          This summary can be shared with landowners, SWCD staff, or ODA as a starting
          point for a conservation plan or compliance follow‑up.
        </Paragraph>
      </div>

      <Divider />
      {/* Print/PDF export button */}
      <Button type="primary" onClick={handlePrint}>
        Print / Save as PDF
      </Button>
    </>
  );
};

StepSummary.propTypes = {
  userType: PropTypes.string.isRequired,
  region: PropTypes.string,
  commodity: PropTypes.object,
  selectedConcerns: PropTypes.arrayOf(PropTypes.string).isRequired,
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
  concernQuestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      concern: PropTypes.string.isRequired,
      question: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedQuestions: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  selectedGoals: PropTypes.arrayOf(PropTypes.number).isRequired,
  selectedPractices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      helps: PropTypes.arrayOf(PropTypes.string).isRequired,
      ecosystemBenefits: PropTypes.string.isRequired,
      benefits: PropTypes.string.isRequired,
      links: PropTypes.arrayOf(
        PropTypes.shape({
          url: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
};

export default StepSummary;
