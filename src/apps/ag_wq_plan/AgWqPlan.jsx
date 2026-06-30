import { useEffect, useMemo, useState, useRef } from 'react';

import { Menu, Layout, Steps, Card, Typography, Divider, Space, Button, Spin, Tabs } from 'antd';
//import Map from '@arcgis/core/Map';
//import MapView from '@arcgis/core/views/MapView';
//import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
//import Graphic from '@arcgis/core/Graphic';
//import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

import Maps from './Maps';

import StartUp from './StartUp';
import StepWhoWhere from './StepWhoWhere';
import StepConditions from './StepConditions';
import StepGoals from './StepGoals';
import StepPractices from './StepPractices';
import StepSummary from './StepSummary';

//import AgWqplanLogin from "./AgWqplanLogin";
import PracticesGuide from './PracticesGuide';
import PageRating from '../../components/page_rating/PageRating';

const { Content, Footer } = Layout;
const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;
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
  const [currentMode, setCurrentMode] = useState('generate_plan');
  const [current, setCurrent] = useState(-1);

  //------------------------------------------------------------------------------------
  // Global state for planner data and user inputs
  //------------------------------------------------------------------------------------
  const [sites, setSites] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [concerns, setConcerns] = useState([]);
  const [concernQuestions, setConcernQuestions] = useState([]);
  const [practices, setPractices] = useState([]);
  const [goals, setGoals] = useState([]);
  const [areaRules, setAreaRules] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // -----------------------------------------------------------------------------------
  // global report data state that gets passed to summary and used for PDF generation
  // useStates() reflect data that is reactive
  // useRef() for data that doesn't need to trigger re-renders
  // -----------------------------------------------------------------------------------
  const [loginName, setLoginName] = useState(null);
  const userType = useRef('Landowner');
  const userID = useRef(null);
  const [selectedCommodities, setSelectedCommodities] = useState([]);
  //const commodity = useRef('Pasture/Hay');
  const [siteName, setSiteName] = useState('');
  const siteID = useRef(null);
  const [siteDescription, setSiteDescription] = useState('');
  const [siteLocator, setSiteLocator] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [agwqmArea, setAgwqmArea] = useState(null);   // MA_Index from ODA AWQMA dataset
  const [agwqRegion, setAgwqRegion] = useState(null);
  const [regionalSpecialist, setRegionalSpecialist] = useState(null);
  const [regionalSpecialistEmail, setRegionalSpecialistEmail] = useState(null);
  const [regionalSpecialistPhone, setRegionalSpecialistPhone] = useState(null);
  const [adminRulesLink, setAdminRulesLink] = useState(null);
  const [areaPlanLink, setAreaPlanLink] = useState(null);

  // -----------------------------------------------------------------------------------
  // Step-specific state
  // Each step component receives relevant pieces of state and setters as props
  // to manage user inputs and selections for that step
  //------------------------------------------------------------------------------------
  const [selectedConcerns, setSelectedConcerns] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedPracticeIds, setSelectedPracticeIds] = useState([]);
  const [selectedTMDLs, setSelectedTMDLs] = useState([]);
  const [photos, setPhotos] = useState([]);

  // ------------------------------------------------------------------------------------
  // Success/Error status of each Step for validation and user feedback
  // possible values are wait process finish error
  //------------------------------------------------------------------------------------
  const [stepLocationStatus, setStepLocationStatus] = useState('process');
  const [stepConditionsStatus, setStepConditionsStatus] = useState('wait');
  const [stepGoalsStatus, setStepGoalsStatus] = useState('wait');
  const [stepPracticesStatus, setStepPracticesStatus] = useState('wait');

  // Cookie helpers
  function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  }
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  const _setUserType = (type) => {
    console.log("Setting userType to:", type);
    userType.current = type;
  }

  const _setUserID = (id) => {
    console.log("Setting userID to:", id);
    userID.current = id;
    setCookie('agwqplan_userID', id);
  }

  const _setSiteID = (id) => {
    console.log("Setting siteID to:", id);
    siteID.current = id;
    setCookie('agwqplan_siteID', id);
  }

  const _setLoginName = (name) => {
    console.log("Setting loginName to:", name);
    setLoginName(name);
    setCookie('agwqplan_loginName', name);
  }

  const _setUserRole = (role) => {
    console.log("Setting userRole to:", role);
    setUserRole(role);
    setCookie('agwqplan_userRole', role);
  }


  useEffect(() => {
    let active = true;

    getCookie('agwqplan_userID') && _setUserID(getCookie('agwqplan_userID'));
    getCookie('agwqplan_userRole') && setUserRole(getCookie('agwqplan_userRole'));
    getCookie('agwqplan_loginName') && setLoginName(getCookie('agwqplan_loginName'));
    getCookie('agwqplan_siteID') && _setSiteID(getCookie('agwqplan_siteID'));

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
        const [sitesData, commoditiesData, concernsData, questionsData, practicesData, goalsData, areaRulesData] = await Promise.all([
          fetchJson('/agwqplan/sites'),
          fetchJson('/agwqplan/commodities'),
          fetchJson('/agwqplan/concerns'),
          fetchJson('/agwqplan/concernQuestions'),
          fetchJson('/agwqplan/practices'),
          fetchJson('/agwqplan/goals'),
          fetchJson('/agwqplan/areaRules'),

        ]);

        if (!active) return;

        setCommodities(Array.isArray(commoditiesData) ? commoditiesData : []);
        setConcerns(Array.isArray(concernsData) ? concernsData : []);
        setConcernQuestions(Array.isArray(questionsData) ? questionsData : []);
        setPractices(Array.isArray(practicesData) ? practicesData : []);
        setGoals(Array.isArray(goalsData) ? goalsData : []);
        setSites(Array.isArray(sitesData) ? sitesData : []);
        setAreaRules(Array.isArray(areaRulesData) ? areaRulesData : []);
      } catch (error) {
        console.error('Error loading ag_wqplan data:', error);
        if (active) {
          setCommodities([]);
          setConcerns([]);
          setConcernQuestions([]);
          setPractices([]);
          setGoals([]);
          setSites([]);
          setAreaRules([]);
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
    return practices.filter((p) =>
      p.tags.some((t) =>
        questionTags.has(t)));
  }, [selectedQuestions, concernQuestions, practices]);

  const filteredRecommendedPractices = useMemo(() => {
    if (userType.current === 'Board/TMDL' && selectedTMDLs.length > 0) {
      return recommendedPractices.filter((p) =>
        p.tmdls && p.tmdls.some((t) => selectedTMDLs.includes(t)),
      );
    }

    return recommendedPractices;
  }, [recommendedPractices, selectedTMDLs]);

  // Get full practice objects for selected practice IDs
  const selectedPractices = useMemo(
    () => practices.filter((p) => selectedPracticeIds.includes(p.id)),
    [selectedPracticeIds, practices],
  );

  const showMapContent = (show) => {
    console.log("Show maps:", show);
    setShowMaps(show);
  }


  const next = () => {
    //if (!validateInputs())
    //  return;
    setCurrent((c) => c + 1);
  };

  const prev = () => {
    //if (validateInputs())
    //  return;

    setCurrent((c) => c - 1);
  };

  return (
    <>
      <Content style={{ padding: '8px 8px', backgroundColor: '#001529' }}>
        <Card>
          <PageRating pageID='/apps/ag_wq_plan' />
          <Title level={3}>Water Quality Practices Planner</Title>
          {current === -1 && (
            <Paragraph>
              This tool connects land conditions and goals to agricultural water quality
              practices, technical assistance, and reference materials.
            </Paragraph>
          )}

          <Menu onClick={({ key }) => setCurrentMode(key)} selectedKeys={[currentMode]} mode="horizontal" items={[
            { label: 'Generate Plan', key: 'generate_plan' },
            { label: 'View Plan', key: 'view_plan', },
            { label: 'Learn More', key: 'learn_more', }]}
          />

          <Spin spinning={loadingData} tip="Loading planner data...">

            {currentMode === 'generate_plan' && (
              <>
                {current === -1 && (
                  <StartUp
                    userType={userType.current}
                    setUserType={_setUserType}
                    selectedTMDLs={selectedTMDLs}
                    setSelectedTMDLs={setSelectedTMDLs}
                    availableTMDLs={availableTMDLs}
                    setLoginName={_setLoginName}
                    setUserRole={_setUserRole}
                    setUserID={_setUserID}
                    setLoggingIn={setLoggingIn}
                    setCurrent={setCurrent} />
                )}
                {current >= 0 && (
                  <>
                    <Divider />
                    <Steps current={current} onChange={setCurrent} style={{ marginBottom: 24 }}>
                      <Step title="Location" status={stepLocationStatus} />
                      <Step title="Conditions" status={stepConditionsStatus} />
                      <Step title="Goals" status={stepGoalsStatus} />
                      <Step title="Practices" status={stepPracticesStatus} />
                      <Step title="Plan Summary" />
                    </Steps>
                    <Divider />
                  </>
                )}

                {current === 0 && (
                  <StepWhoWhere
                    userType={userType.current}
                    userID={userID.current}
                    sitesData={sites}
                    commoditiesData={commodities}
                    selectedCommodities={selectedCommodities}
                    setSelectedCommodities={setSelectedCommodities}
                    setPhotos={setPhotos}
                    siteName={siteName} setSiteName={setSiteName}
                    siteID={siteID.current} setSiteID={_setSiteID }
                    siteDescription={siteDescription} setSiteDescription={setSiteDescription}
                    siteLocator={siteLocator} setSiteLocator={setSiteLocator}
                    _latitude={latitude} setLatitude={setLatitude}
                    _longitude={longitude} setLongitude={setLongitude}
                    agwqmArea={agwqmArea} setAgwqmArea={setAgwqmArea}
                    agwqRegion={agwqRegion} setAgwqRegion={setAgwqRegion}
                    regionalSpecialist={regionalSpecialist} setRegionalSpecialist={setRegionalSpecialist}
                    regionalSpecialistEmail={regionalSpecialistEmail} setRegionalSpecialistEmail={setRegionalSpecialistEmail}
                    regionalSpecialistPhone={regionalSpecialistPhone} setRegionalSpecialistPhone={setRegionalSpecialistPhone}
                    adminRulesLink={adminRulesLink} setAdminRulesLink={setAdminRulesLink}
                    areaPlanLink={areaPlanLink} setAreaPlanLink={setAreaPlanLink}
                    setError={setStepLocationStatus}
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
                    setError={setStepConditionsStatus}
                  />
                )}

                {current === 2 && (
                  <StepGoals
                    selectedGoals={selectedGoals}
                    setSelectedGoals={setSelectedGoals}
                    goalData={goals}
                    setError={setStepGoalsStatus}
                  />
                )}

                {current === 3 && (
                  <StepPractices
                    userType={userType.current}
                    areaRules={areaRules}
                    agwqmArea={agwqmArea}
                    recommendedPractices={filteredRecommendedPractices}
                    selectedPracticeIds={selectedPracticeIds}
                    setSelectedPracticeIds={setSelectedPracticeIds}
                    setError={setStepPracticesStatus}
                  />
                )}

                {current === 4 && (
                  <StepSummary
                    userType={userType.current}
                    latitude={latitude}
                    longitude={longitude}
                    agWqMArea={agwqmArea}
                    region={agwqRegion}
                    regionalSpecialist={regionalSpecialist}
                    regionalSpecialistEmail={regionalSpecialistEmail}
                    regionalSpecialistPhone={regionalSpecialistPhone}
                    adminRulesLink={adminRulesLink}
                    areaPlanLink={areaPlanLink}
                    siteName={siteName}
                    selectedCommodities={selectedCommodities}
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
                  {current < 4 && stepLocationStatus !== 'error' && stepConditionsStatus !== 'error' && stepGoalsStatus !== 'error' && stepPracticesStatus !== 'error' && (
                    <Button type="primary" onClick={next}>
                      Next
                    </Button>
                  )}
                  {current < 4 && (stepLocationStatus === 'error' || stepConditionsStatus === 'error' || stepGoalsStatus === 'error' || stepPracticesStatus === 'error') && (
                    <Button type="primary" disabled>
                      Next
                    </Button>
                  )}

                  <span style={{ marginLeft: 8, fontStyle: 'italic', fontSize: 14, color: 'red' }}>
                    {stepLocationStatus === 'error' && 'Please complete the Location step before proceeding.'}
                    {stepConditionsStatus === 'error' && 'Please complete the Conditions step before proceeding.'}
                    {stepGoalsStatus === 'error' && 'Please complete the Goals step before proceeding.'}
                    {stepPracticesStatus === 'error' && 'Please complete the Practices step before proceeding.'}
                  </span>
                </Space>
              </>
            )}

            {currentMode === 'view_plan' && (
              <div> View Plan Content </div>
            )}

            {currentMode === 'learn_more' && (
              <>
                <Divider />
                <Tabs defaultActiveKey="1" items={
                  [
                    {
                      key: 'practices',
                      label: 'Practices Guide',
                      children: <PracticesGuide practicesData={practices} />,
                    },
                    {
                      key: 'maps',
                      label: 'Maps',
                      children: <Maps />,
                    },
                    {
                      key: 'external_links',
                      label: 'External Links',
                      children: '<span>external links to come...</span>',
                    },
                  ]} />
              </>

            )}



          </Spin>
        </Card>
      </Content >
      <Footer style={{ textAlign: 'center' }}>
        Oregon Ag Water Quality Practices – prototype planner
      </Footer>
    </>
  );
};

export default AgWqPlan;
