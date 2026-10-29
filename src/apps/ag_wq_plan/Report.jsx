import { useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Divider, Typography, Tag, Space, Row, Col } from 'antd';

//import ChatResponse from '../../components/chat_response/ChatReponse';

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


const Report = ({
  userName,
  currentPlan,
  userRole,
  goalsData,
  concernQuestionsData, 
  areaRulesData,
  practicesData,
  savePlan,
  isDirty
}) => {
  const printRef = useRef(null);

  const SITE_IMAGES_URL = 'https://agwater.org:5556/image?path=ag_wqplan/site_photos&file='
/*
  const summaryPrompt = () => {
    const siteName = currentPlan?.report_data?.site_name || "the site";
    const concerns = currentPlan?.report_data?.selected_concerns.join(',') || 'no concerns selected';
    const questions = currentPlan?.report_data?.selected_questions.join(',') || 'no questions selected';
    const goals = currentPlan?.report_data?.selected_goals || 'no goals selected';
    const practices = currentPlan?.report_data?.selected_practices || 'no practices selected';
    const commodities = currentPlan?.report_data?.selected_commodities?.join(', ') || 'Not specified';
    const areaRules = areaRulesData.filter(rule => rule.MA_Index === currentPlan?.report_data?.agwqm_area).map(rule => rule.CATEGORY).join(', ') || 'No applicable area rules';
    
    return `Summarize the water quality plan for ${siteName} based on the following:
    - Concerns: ${concerns}
    - Questions: ${questions}
    - Goals: ${goals}
    - Practices: ${practices}
    - Location: ${currentPlan?.latitude}, ${currentPlan?.longitude}
    - Commodities/Operations: ${commodities}
    - Role: ${userRole}
    - Applicable area rules: ${areaRules}
    Provide a concise summary highlighting the key points and recommendations.`;
  };
*/
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
  concernQuestionsData.forEach((q) => questionMap.set(q.id, q));

  const goalLabelMap = useMemo(() => {
    const map = new Map();
    (Array.isArray(goalsData) ? goalsData : []).forEach((goal) => {
      const value = goal.id;
      const label = goal.goal;
      if (value != null) {
        map.set(String(value), String(label));
      }
    });
    return map;
  }, [goalsData]);



  const matchingRules = areaRulesData.filter((rule) => {
    return rule.MA_Index && rule.MA_Index === currentPlan?.report_data?.agwqm_area;
  });

  return (
    <>
      {/* Printable content container */}
      <div ref={printRef}>
        <Title level={3}>Water Quality Plan for {currentPlan?.report_data?.site_name}</Title>

        {/* Summary section: User info and location */}

        {/*
        <Title level={4}>Summary</Title>
        <Row>
          <Col span={12} style={{ paddingRight: '2em' }}>
            <Paragraph>
              <Text strong>Summary goes here...</Text>
              <ChatResponse prompt={summaryPrompt()} />
            </Paragraph>
          </Col>
          <Col span={12} style={{ paddingLeft: '2em' }}>
            <Paragraph>
            </Paragraph>
          </Col>
        </Row>
        */}
        <Title level={4}>Site Information</Title>
        <Row>
          <Col span={12} style={{ paddingRight: '2em' }}>
            <Paragraph>
              <Text strong>User role:</Text> {userRole}
            </Paragraph>
            <Paragraph>
              <Text strong>Lat/Long:</Text> {currentPlan?.latitude}, {currentPlan?.longitude}
            </Paragraph>
            <Paragraph>
              <Text strong>Commodities/Operations: </Text>
              {currentPlan?.report_data?.selected_commodities?.join(', ') || 'Not specified'}
            </Paragraph>
            <Paragraph>
              <Text strong>Admin Rules Link:</Text>
              <Button type="link" href={currentPlan?.report_data?.admin_rules_link || '#'} target="_blank" rel="noopener noreferrer">
                {'Admin Rules'}
              </Button>
            </Paragraph>
            <Paragraph>
              <Text strong>Area Plan Link:</Text> <Button type="link" href={currentPlan?.report_data?.area_plan_link || '#'} target="_blank" rel="noopener noreferrer">
                {'Area Plan'}
              </Button>
            </Paragraph>
          </Col>

          <Col span={12} style={{ paddingLeft: '2em' }}>
            <Paragraph>
              <Text strong>Ag WQM Area:</Text> {currentPlan?.report_data?.agwqm_area || 'Not specified'}
            </Paragraph>
            <Paragraph>
              <Text strong>Region:</Text> {currentPlan?.report_data?.agwqm_region || 'Not specified'}
            </Paragraph>
            <Paragraph>
              <Text strong>Regional Specialist:</Text> {currentPlan?.report_data?.regional_specialist || 'Not specified'}
            </Paragraph>
            <Paragraph>
              <Text strong>Regional Specialist Email:</Text> {currentPlan?.report_data?.regional_specialist_email || 'Not specified'}
            </Paragraph>
            <Paragraph>
              <Text strong>Regional Specialist Phone:</Text> {currentPlan?.report_data?.regional_specialist_phone || 'Not specified'}
            </Paragraph>
          </Col>
        </Row>

        {currentPlan.report_data.site_photos && currentPlan.report_data.site_photos.length > 0 && (
          <>
            <Title level={5}>Site Photos</Title>
            <Row gutter={[16, 16]}>
              {currentPlan.report_data.site_photos.map((photo, index) => (
                <Col key={index} xs={24} sm={12} lg={8}>
                  <img src={SITE_IMAGES_URL + photo.filename} alt={photo.description || `Photo ${index + 1}`} style={{ width: '100%', height: 'auto' }} />
                  <Text strong>{photo.label || `Photo ${index + 1}`}</Text>
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
              {"Area-specific rules or TMDL requirements may apply in this management area (" + currentPlan?.report_data?.agwqm_area
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
        {currentPlan.report_data.selected_concerns?.length === 0 ? (
          <Paragraph>No concerns selected.</Paragraph>
        ) : (
          <Space wrap>
            <ul>
              {currentPlan.report_data.selected_concerns.map((concern) => (
                <li key={concern}>{concern}</li>
              ))}
            </ul>
          </Space>
        )}

        <Divider />
        <Title level={4}>Selected Questions</Title>
        {currentPlan.report_data.selected_questions?.length === 0 ? (
          <Paragraph>No specific conditions selected.</Paragraph>
        ) : (
          <ul>
            {currentPlan.report_data.selected_questions.map((id) => {
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
        {currentPlan.report_data.selected_goals?.length === 0 ? (
          <Paragraph>No goals selected.</Paragraph>
        ) : (
          <ul>
            {currentPlan.report_data.selected_goals.map((g) => (
              <li key={g}>
                {goalLabelMap.get(String(g))}
              </li>
            ))}
          </ul>
        )}

        <Divider />

        {/* Recommended practices section with full details */}
        <Title level={4}>Recommended Practices</Title>

        {currentPlan.report_data.selected_practices?.length === 0 ? (
          <Paragraph>No practices selected yet. Go back to choose practices to include.</Paragraph>
        ) : (
          currentPlan.report_data.selected_practices.map((index) => {
            const p = practicesData?.find((practice) => practice.id === index);
            if (!p) return null;
            return (
              <div key={p.id} style={{ marginBottom: 16 }}>
                <Divider />
                <Paragraph>
                  <Title key={'title_' + p.id} level={5}>
                    {p.title}
                  </Title>
                </Paragraph>
                <Paragraph>
                  <Text strong>Helps water quality:</Text>{' '}
                  {p.helps.map((h) => (
                    <Tag key={p.id + h}>{h}</Tag>
                  ))}
                </Paragraph>
                <Paragraph>
                  <Text strong>How it helps:</Text> <span key={'how_it_helps_' + p.id}>{p.ecosystem_benefits}</span>
                </Paragraph>
                <Paragraph>
                <Text strong>Benefits:</Text><span key={'notes_' + p.id}>{p.benefits}</span>
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
            )})
        )}

        <Divider />

        <Paragraph>
          This summary can be shared with landowners, SWCD staff, or ODA Water Quality Staff as a starting
          point for a conservation plan or compliance follow‑up.
        </Paragraph>
      </div>

      <Divider />

      {/* save report */}
      {isDirty.current === true && (
        <>
        <Alert
          message="Unsaved changes" 
          description="You have unsaved changes in this plan. Please save your plan before printing or exporting."
          type="warning"
          showIcon
          style={{ marginBottom: '1em' }}
        />
      
      <Button type="primary" onClick={savePlan}
        disabled={(currentPlan === null || userName === null || userName === 'Guest')}>
        Save Report
      </Button>
      </>
      )}

      {/* Print/PDF export button */}
      <Button type="primary" style={{ marginLeft: '1em' }} onClick={handlePrint}>
        Print / Save as PDF
      </Button>
    </>
  );
};

Report.propTypes = {
  currentPlan: PropTypes.shape({
    latitude: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    longitude: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    report_data: PropTypes.shape({
      site_name: PropTypes.string,
      selected_commodities: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
      agwqm_area: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      agwqm_region: PropTypes.string,
      admin_rules_link: PropTypes.string,
      area_plan_link: PropTypes.string,
      regional_specialist: PropTypes.string,
      regional_specialist_email: PropTypes.string,
      regional_specialist_phone: PropTypes.string,
      site_photos: PropTypes.arrayOf(PropTypes.shape({
        url: PropTypes.string,
        description: PropTypes.string,
      })),
      selected_concerns: PropTypes.arrayOf(PropTypes.string),
      selected_questions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
      selected_goals: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
      selected_practices: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          title: PropTypes.string,
          helps: PropTypes.arrayOf(PropTypes.string),
          ecosystem_benefits: PropTypes.string,
          benefits: PropTypes.string,
          links: PropTypes.arrayOf(PropTypes.shape({
            url: PropTypes.string,
            label: PropTypes.string,
          })),
        }),
      ])),
    }).isRequired,
  }).isRequired,
  userRole: PropTypes.string,
  goalsData: PropTypes.arrayOf(
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
  ),
  concernQuestionsData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      concern: PropTypes.string,
      question: PropTypes.string,
    })
  ),
  areaRulesData: PropTypes.arrayOf(PropTypes.object),
  practicesData: PropTypes.arrayOf(PropTypes.object),
  savePlan: PropTypes.func.isRequired,
  isDirty: PropTypes.shape({ current: PropTypes.bool }).isRequired,
};

export default Report;
