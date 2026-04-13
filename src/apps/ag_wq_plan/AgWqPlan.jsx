import { useEffect, useMemo, useState } from 'react';
import {
  Layout,
  Steps,
  Card,
  Typography,
  Divider,
  Space,
  Button,
  Spin,
} from 'antd';

import StepWhoWhere from './StepWhoWhere';
import StepConditions from './StepConditions';
import StepGoals from './StepGoals';
import StepPractices from './StepPractices';
import StepSummary from './StepSummary';
import UserTypeGuide from './UserTypeGuide';

import AgWqplanLogin from "./AgWqplanLogin";


const { Content, Footer } = Layout;
const { Step } = Steps;
const { Title, Paragraph } = Typography;
const API_BASE = 'https://agwater.org:5556';

/*
  "Create a 'living' repository of suggested agricultural/environmental practices
   to maintain and improve the quality of water for all waters of the State."
  "Ability for landowner to identify/search for Ag Practices related to their land."
*/

// Main AgWqPlan component for the Water Quality Practices Planner.
// Loads concern questions and practices from the /agwqplan routes exposed by ag_wqplan.py.
const AgWqPlan = () => {
  // Current step in the wizard (0-4)
  const [current, setCurrent] = useState(0);
  const [concerns, setConcerns] = useState([]);
  const [concernQuestions, setConcernQuestions] = useState([]);
  const [practices, setPractices] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginName, setLoginName] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // User identification and location state
  const [userType, setUserType] = useState('Landowner');
  const [region, setRegion] = useState();
  const [commodity, setCommodity] = useState();

  // Selection state across steps
  const [selectedConcerns, setSelectedConcerns] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedPracticeIds, setSelectedPracticeIds] = useState([]);
  const [selectedTMDLs, setSelectedTMDLs] = useState([]);

  useEffect(() => {
    let active = true;

    const fetchJson = async (fileName) => {
      const response = await fetch(`${API_BASE}${fileName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileName}: ${response.status}`);
      }

      const json = await response.json();
      if (json.success !== true || !json.data) {
        throw new Error(`Invalid response format for ${fileName}`);
      }

      return json.data;
    };

    const loadData = async () => {
      setLoadingData(true);

      try {
        const [concernsData,questionsData, practicesData, goalsData] = await Promise.all([
          fetchJson('/agwqplan/concerns'),
          fetchJson('/agwqplan/concernQuestions'),
          fetchJson('/agwqplan/practices'),
          fetchJson('/agwqplan/goals'),
        ]);

        if (!active) return;

        setConcerns(Array.isArray(concernsData) ? concernsData : []);
        setConcernQuestions(Array.isArray(questionsData) ? questionsData : []);
        setPractices(Array.isArray(practicesData) ? practicesData : []);
        setGoals(Array.isArray(goalsData) ? goalsData : []);
      } catch (error) {
        console.error('Error loading ag_wqplan data:', error);
        if (active) {
          setConcerns([]);
          setConcernQuestions([]);
          setPractices([]);
          setGoals([]);
        }
      } finally {
        if (active) {
          setLoadingData(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Filter questions based on selected concerns
  const filteredQuestions = useMemo(
    () =>
      concernQuestions.filter((q) =>
        selectedConcerns.length ? selectedConcerns.includes(q.concern) : true,
      ),
    [selectedConcerns, concernQuestions],
  );

  // Get all available TMDLs from practices
  const availableTMDLs = useMemo(() => {
    const tmdlSet = new Set();
    practices.forEach((p) => {
      if (p.tmdls) {
        p.tmdls.forEach((t) => tmdlSet.add(t));
      }
    });
    return Array.from(tmdlSet).sort();
  }, [practices]);

  // Recommend practices based on selected questions
  const recommendedPractices = useMemo(() => {
    const questionTags = new Set(
      concernQuestions
        .filter((q) => selectedQuestions.includes(q.id))
        .map((q) => q.concern),
    );
    return practices.filter((p) => p.tags.some((t) => questionTags.has(t)));
  }, [selectedQuestions, concernQuestions, practices]);

  const filteredRecommendedPractices = useMemo(() => {
    if (userType === 'Board/TMDL' && selectedTMDLs.length > 0) {
      return recommendedPractices.filter((p) =>
        p.tmdls && p.tmdls.some((t) => selectedTMDLs.includes(t)),
      );
    }

    return recommendedPractices;
  }, [recommendedPractices, userType, selectedTMDLs]);

  // Get full practice objects for selected practice IDs
  const selectedPractices = useMemo(
    () => practices.filter((p) => selectedPracticeIds.includes(p.id)),
    [selectedPracticeIds, practices],
  );

  const next = () => setCurrent((c) => c + 1);
  const prev = () => setCurrent((c) => c - 1);

  return (
    <>
    {loggingIn && (
      <AgWqplanLogin
        onLoginSuccess={(result) => {console.log("Login successful:", result);
          setLoginName(result.user.username);
          setUserRole(result.user.role);
          setLoggingIn(false);
        } }
        onLoginFailure={(error) => {console.error("Login failed:", error);
          setLoggingIn(false);
        }}
        onLogout={() => {console.log("Logged out");
          setLoginName(null);
          setUserRole(null);
          setLoggingIn(false);
        }}
      ></AgWqplanLogin>
    )}
    {!loginName && !loggingIn && (
      <div style={{ padding: 4, textAlign: 'right' }} >
        <Button type="text" onClick={() => setLoggingIn(true)}>
          Sign In
        </Button>
      </div>  
    )}
    { loginName && (
      <div style={{ padding: 4, textAlign: 'right', color: 'white', fontSize:'small' }} >
        Signed in as <b>{loginName}</b>
        <Button ghost onClick={() => {
          setLoggingIn(false);
          setLoginName(null);
          setUserRole(null);
        }} style={{ marginLeft: 8 }}>
          Sign Out
        </Button>
      </div>
    )}



      <Content style={{ padding: '8px 8px', backgroundColor: '#001529' }}>
        <Card>
          <Title level={3}>Water Quality Practices Planner</Title>
          <Paragraph>
            This tool connects land conditions and goals to agricultural water quality
            practices, technical assistance, and reference materials.
          </Paragraph>

          <Spin spinning={loadingData} tip="Loading planner data...">
            <UserTypeGuide
              userType={userType}
              selectedTMDLs={selectedTMDLs}
              onTMDLChange={setSelectedTMDLs}
              availableTMDLs={availableTMDLs}
            >
              <Steps current={current} onChange={setCurrent} style={{ marginBottom: 24 }}>
                <Step title="Who & Where" />
                <Step title="Conditions" />
                <Step title="Goals" />
                <Step title="Practices" />
                <Step title="Plan Summary" />
              </Steps>

              {current === 0 && (
                <StepWhoWhere
                  userType={userType}
                  setUserType={setUserType}
                  region={region}
                  setRegion={setRegion}
                  commodity={commodity}
                  setCommodity={setCommodity}
                />
              )}

              {current === 1 && (
                <StepConditions
                  concernData={concerns}
                  selectedConcerns={selectedConcerns}
                  setSelectedConcerns={setSelectedConcerns}
                  filteredQuestions={filteredQuestions}
                  selectedQuestions={selectedQuestions}
                  setSelectedQuestions={setSelectedQuestions}
                />
              )}

              {current === 2 && (
                <StepGoals
                  selectedGoals={selectedGoals}
                  setSelectedGoals={setSelectedGoals}
                  goalData={goals}
                />
              )}

              {current === 3 && (
                <StepPractices
                  userType={userType}
                  recommendedPractices={filteredRecommendedPractices}
                  selectedPracticeIds={selectedPracticeIds}
                  setSelectedPracticeIds={setSelectedPracticeIds}
                />
              )}

              {current === 4 && (
                <StepSummary
                  userType={userType}
                  region={region}
                  commodity={commodity}
                  selectedConcerns={selectedConcerns}
                  selectedQuestions={selectedQuestions}
                  selectedGoals={selectedGoals}
                  goalData={goals}
                  selectedPractices={selectedPractices}
                  concernQuestions={concernQuestions}
                />
              )}

              <Divider />

              <Space>
                {current > 0 && (
                  <Button ghost onClick={prev}>
                    Back
                  </Button>
                )}
                {current < 4 && (
                  <Button type="primary" onClick={next}>
                    Next
                  </Button>
                )}
              </Space>
            </UserTypeGuide>
          </Spin>
        </Card>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Oregon Ag Water Quality Practices – prototype planner
      </Footer>
    </>
  );
};

export default AgWqPlan;
