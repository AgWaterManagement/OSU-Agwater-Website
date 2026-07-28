import { useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button, Divider, Typography, Tag, Space, Row, Col } from 'antd';

const { Collapse, Title, Paragraph, Text } = Typography;

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
const Report = ({
  userType,
  userID,
  latitude,
  longitude,
  agWqMArea,
  region,
  regionalSpecialist,
  regionalSpecialistEmail,
  regionalSpecialistPhone,
  adminRulesLink,
  areaPlanLink,
  siteName,
  site,
  sitePhotos,
  selectedCommodities,
  selectedConcerns,
  selectedQuestions,
  selectedGoals,
  goalData,
  selectedPractices,
  concernQuestions,
  areaRules
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

  // Handle saving the report (e.g., to a server or local storage)
  const handleSaveReport = () => {
    // Implement saving logic here (e.g., send data to server or save to local storage)
    console.log('Saving report...');
    // Example: You could send the selected practices and other details to a backend API
   /*
  userType,
  latitude,
  longitude,
  agWqMArea,
  region,
  regionalSpecialist,
  regionalSpecialistEmail,
  regionalSpecialistPhone,
  adminRulesLink,
  areaPlanLink,
  siteName,
  site,
  sitePhotos,
  selectedCommodities,
  selectedConcerns,
  selectedQuestions,
  selectedGoals,
  goalData,
  selectedPractices,
  concernQuestions,
  areaRules */

const now = () => new Date().toISOString(); // Helper function to get current timestamp in ISO format

const reportData = {
  userType,
  userID,
  latitude,
  longitude,
  agWqMArea,
  region,
  regionalSpecialist,
  regionalSpecialistEmail,
  regionalSpecialistPhone,
  adminRulesLink,
  areaPlanLink,
  siteName,
  site,
  sitePhotos,
  selectedCommodities,
  selectedConcerns,
  selectedQuestions,
  selectedGoals,
  //goalData,
  selectedPractices,
  //concernQuestions,
  //areaRules
};


const record = {
    //id: integer NOT NULL,
    //report:  // text COLLATE pg_catalog."default" NOT NULL,
    report_data: reportData, // jsonb,
    created_by: userID,  // text COLLATE pg_catalog."default",
    site_id: site.id,   // integer,
    latitude: latitude,   // real,
    longitude: longitude,   // real,
    keywords: "",   // text COLLATE pg_catalog."default",
    created_at: now(),   // timestamp with time zone DEFAULT now(),
    updated_at: now(),   // timestamp with time zone DEFAULT now(),
    


  };
}


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


  const matchingRules = areaRules.filter((rule) => {
    return rule.MA_Index && rule.MA_Index === agWqMArea;
  });

  return (
    <>
      {/* Printable content container */}
      <div ref={printRef}>
        <Title level={3}>Water Quality Plan for {siteName}</Title>

        {/* Summary section: User info and location */}
        <Title level={4}>Summary</Title>
        <Row>
          <Col span={12} style={{ paddingRight: '2em' }}>
            <Paragraph>
              <Text strong>Summary goes here...</Text>
            </Paragraph>
          </Col>
          <Col span={12} style={{ paddingLeft: '2em' }}>
            <Paragraph>
            </Paragraph>
          </Col>
        </Row>

        <Title level={4}>Site Information</Title>
        <Row>
          <Col span={12} style={{ paddingRight: '2em' }}>
            <Paragraph>
              <Text strong>User type:</Text> {userType}
            </Paragraph>
            <Paragraph>
              <Text strong>Lat/Long:</Text> {latitude}, {longitude}
            </Paragraph>
            <Paragraph>
              <Text strong>Commodities/Operations: </Text>
              {selectedCommodities.join(', ') || 'Not specified'}
            </Paragraph>
            <Paragraph>
              <Text strong>Admin Rules Link:</Text> <Button type="link" href={adminRulesLink || '#'} target="_blank" rel="noopener noreferrer">
                {'Admin Rules'}
              </Button>
            </Paragraph>
            <Paragraph>
              <Text strong>Area Plan Link:</Text> <Button type="link" href={areaPlanLink || '#'} target="_blank" rel="noopener noreferrer">
                {'Area Plan'}
              </Button>
            </Paragraph>
          </Col>

          <Col span={12} style={{ paddingLeft: '2em' }}>
            <Paragraph>
              <Text strong>Ag WQM Area:</Text> {agWqMArea || 'Not specified'}
            </Paragraph>
            <Paragraph>
              <Text strong>Region:</Text> {region || 'Not specified'}
            </Paragraph>
            <Paragraph>
              <Text strong>Regional Specialist:</Text> {regionalSpecialist || 'Not specified'}
            </Paragraph>
            <Paragraph>
              <Text strong>Regional Specialist Email:</Text> {regionalSpecialistEmail || 'Not specified'}
            </Paragraph>
            <Paragraph>
              <Text strong>Regional Specialist Phone:</Text> {regionalSpecialistPhone || 'Not specified'}
            </Paragraph>
          </Col>
        </Row>

        {sitePhotos && (
          <>
            <Title level={5}>Site Photos</Title>
            <Row gutter={[16, 16]}>
              {sitePhotos.map((photo, index) => (
                <Col key={index} xs={24} sm={12} lg={8}>
                  <img src={photo.url} alt={photo.description || `Photo ${index + 1}`} style={{ width: '100%', height: 'auto' }} />
                  <Paragraph>{photo.description || `Photo ${index + 1}`}</Paragraph>
                </Col>
              ))}
            </Row>
          </>
        )}

        <Divider />

        {/* Conditions/Concerns section */}
        <Title level={4}>Applicable Area  Rules</Title>
        {matchingRules.length === 0 ? (
          <Paragraph>No area-specific rules or TMDL requirements apply.</Paragraph>
        ) : (
          <>
            <Paragraph>
              {"Area-specific rules or TMDL requirements may apply in this management area (" + agWqMArea
                + "). Please review the information for each practice carefully."}
            </Paragraph>
            {matchingRules.map((rule, index) => (
              <>
                <Paragraph key={`rule_paragraph_${index}`}><span style={{ fontWeight: 'bold' }}>{rule.CATEGORY}:</span> {rule['Oregon Administrative Rules (OAR)']}             <Tag>{rule.CATEGORY}</Tag>
                </Paragraph>
              </>
            ))}
          </>
        )}

        <Divider />


        {/* Conditions/Concerns section */}
        <Title level={4}>Conditions / Concerns</Title>
        {selectedConcerns.length === 0 ? (
          <Paragraph>No concerns selected.</Paragraph>
        ) : (
          <Space wrap>
            <ul>
              {selectedConcerns.map((concern) => (
                <li key={concern}>{concern}</li>
              ))}
            </ul>
          </Space>
        )}

        <Divider />
        <Title level={4}>Selected Questions</Title>
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
              <Divider />
              <Paragraph>
                <Title level={5}>
                  {p.title}
                </Title>
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
                <Text strong>References: </Text>
                {p.links.map((l, index) => (
                  <div key={'reference_' + index} style={{ paddingLeft: '2em', paddingTop: '0.5em' }}>
                    <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                      {l.label}
                    </a>
                  </div>
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
      
      {/* save report */}
      <Button type="primary" onClick={handleSaveReport}>
        Save Report
      </Button>

      {/* Print/PDF export button */}
      <Button type="primary" onClick={handlePrint}>
        Print / Save as PDF
      </Button>
    </>
  );
};

Report.propTypes = {
  userType: PropTypes.string,
  latitude: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  longitude: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  agWqMArea: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  region: PropTypes.string,
  regionalSpecialist: PropTypes.string,
  regionalSpecialistEmail: PropTypes.string,
  regionalSpecialistPhone: PropTypes.string,
  adminRulesLink: PropTypes.string,
  areaPlanLink: PropTypes.string,
  siteName: PropTypes.string,

  selectedCommodities: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  selectedConcerns: PropTypes.arrayOf(PropTypes.string).isRequired,

  selectedQuestions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
  selectedGoals: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,

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

  selectedPractices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      helps: PropTypes.arrayOf(PropTypes.string).isRequired,
      ecosystem_benefits: PropTypes.string,
      benefits: PropTypes.string,
      links: PropTypes.arrayOf(
        PropTypes.shape({
          url: PropTypes.string.isRequired,
          label: PropTypes.string,
        }),
      ),
    }),
  ).isRequired,
};

export default Report;
