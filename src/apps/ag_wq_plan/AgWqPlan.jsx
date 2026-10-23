import { useMemo, useEffect, useState, useRef } from 'react';

import { Menu, Layout, Card, message, Typography, Divider, Select, Button, Spin, Tabs } from 'antd';

import Maps from './maps/Maps';
import MyPlans from './MyPlans';
import PlanEditor from './PlanEditor';

//import AgWqplanLogin from "./AgWqplanLogin";
import PracticesGuide from './PracticesGuide';
import PageRating from '../../components/page_rating/PageRating';
import VFSGuide from './Guides/VFSGuide';
import WQCalculators from './calculators/WQCalculators';

const { Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const API_BASE = 'https://agwater.org:5556';
import { secrets } from '../../secrets.js';

import { ArrowLeftOutlined } from '@ant-design/icons';

/*
  "Create a 'living' repository of suggested agricultural/environmental practices
   to maintain and improve the quality of water for all waters of the State."
  "Ability for landowner to identify/search for Ag Practices related to their land."
*/

/*
a "Plan" is a collection of user inputs and selections that can be saved, shared, and exported as a PDF report. The plan includes:
- Site information
   (name, description, location, photos)
- Selected commodities
- Selected concerns and concern questions
- Selected goals
- Recommended practices based on the selected concerns and questions

*/


// Main AgWqPlan component for the Water Quality Practices Planner.
// Loads concern questions and practices from the /agwqplan routes exposed by ag_wqplan.py.
const AgWqPlan = () => {
  // Current step in the wizard (0-4)
  const [currentMode, setCurrentMode] = useState(''); // modes: '', 'my_plans', 'guides', 'maps', 'calculators', 'learn_more'
  const [currentPracticeGuide, setCurrentPracticeGuide] = useState('vfs');
  const [currentPlan, setCurrentPlan] = useState(null);

  //------------------------------------------------------------------------------------
  // Global state for planner data and user inputs
  //------------------------------------------------------------------------------------
  //const [sites, setSites] = useState([]);  // these are filtered based on the user ID
  const [commodities, setCommodities] = useState([]);
  const [concerns, setConcerns] = useState([]);
  const [concernQuestions, setConcernQuestions] = useState([]);
  const [practices, setPractices] = useState([]);
  const [goals, setGoals] = useState([]);
  const [areaRules, setAreaRules] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [userRole, setUserRole] = useState(null);  // User's role (e.g., 'Landowner', 'Resource Conservationist', 'ODA Water Quality Specialist')

  // -----------------------------------------------------------------------------------
  // global report data state that gets passed to summary and used for PDF generation
  // useStates() reflect data that is reactive
  // useRef() for data that doesn't need to trigger re-renders
  // -----------------------------------------------------------------------------------
  const [userName, setUserName] = useState(null);
  //const userType = useRef('Landowner');
  const userID = useRef(null);


  // -----------------------------------------------------------------------------------
  // Step-specific state
  // Each step component receives relevant pieces of state and setters as props
  // to manage user inputs and selections for that step
  //------------------------------------------------------------------------------------
  //const [selectedConcerns, setSelectedConcerns] = useState([]);
  //const [selectedQuestions, setSelectedQuestions] = useState([]);
  //const [selectedGoals, setSelectedGoals] = useState([]);
  //const [selectedPracticeIds, setSelectedPracticeIds] = useState([]);
  //const [selectedTMDLs, setSelectedTMDLs] = useState([]);

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

  //const _setUserType = (type) => {
  //  console.log("Setting userType to:", type);
  //  userType.current = type;
  //}

  const _setUserID = (id) => {
    console.log("Setting userID to:", id);
    userID.current = id;
    setCookie('agwqplan_userID', id);
  }

  //  const _setSiteID = (id) => {
  //    console.log("Setting siteID to:", id);
  //    if (id == 'null')
  //      id = null;
  //
  //    siteID.current = id;
  //    setCookie('agwqplan_siteID', id);
  //  }

  const _setUserName = (name) => {
    console.log("Setting userName to:", name);
    setUserName(name);
    setCookie('agwqplan_userName', name);
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
    getCookie('agwqplan_loginName') && setUserName(getCookie('agwqplan_loginName'));
    //getCookie('agwqplan_siteID') && _setSiteID(getCookie('agwqplan_siteID'));

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
        const [commoditiesData, concernsData, questionsData, practicesData, goalsData, areaRulesData] = await Promise.all([
          //fetchJson('/agwqplan/sites'),
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
        // setSites(Array.isArray(sitesData) ? sitesData : []);
        setAreaRules(Array.isArray(areaRulesData) ? areaRulesData : []);
      } catch (error) {
        console.error('Error loading ag_wqplan data:', error);
        if (active) {
          setCommodities([]);
          setConcerns([]);
          setConcernQuestions([]);
          setPractices([]);
          setGoals([]);
          // setSites([]);
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



  // Handle saving the report (e.g., to a server or local storage)
  const SavePlan = async () => {
    if (currentPlan === null || userName === null || userName === undefined || userName === 'Guest') {
      message.error('Cannot save plan: User is not logged in.');
      return false;
    }

    // Implement saving logic here (e.g., send data to server or save to local storage)
    console.log('Saving report...');
    const now = () => new Date().toISOString(); // Helper function to get current timestamp in ISO format

    // only save the ID's of the selected practices, goals, etc
    const _selectedPractices = currentPlan?.report_data?.selected_practices || [];
    const _selectedGoals = currentPlan?.report_data?.selected_goals || [];
    const _selectedConcerns = currentPlan?.report_data?.selected_concerns || [];
    const _selectedQuestions = currentPlan?.report_data?.selected_questions || [];
    const _selectedCommodities = currentPlan?.report_data?.selected_commodities || [];

    const isNewPlan = currentPlan?.id === null || currentPlan?.id === undefined;

    const reportData = {
      site_id: currentPlan?.report_data?.site_id,
      site_name: currentPlan?.report_data?.site_name,
      site_description: currentPlan?.report_data?.site_description,
      site_locator: currentPlan?.report_data?.site_locator,
      site_photos: currentPlan?.report_data?.site_photos,

      agwqm_region: currentPlan?.report_data?.agwqm_region,
      agwqm_area: currentPlan?.report_data?.agwqm_area,
      tmdl_area: currentPlan?.report_data?.tmdl_area,
      regional_specialist: currentPlan?.report_data?.regional_specialist,
      regional_specialist_email: currentPlan?.report_data?.regional_specialist_email,
      regional_specialist_phone: currentPlan?.report_data?.regional_specialist_phone,
      area_plan_link: currentPlan?.report_data?.area_plan_link,
      admin_rules_link: currentPlan?.report_data?.admin_rules_link,

      selected_commodities: _selectedCommodities?.toString() || '',
      selected_goals: _selectedGoals?.toString() || '',
      selected_concerns: _selectedConcerns?.toString() || '',
      selected_questions: _selectedQuestions?.toString() || '',
      selected_practices: _selectedPractices?.toString() || '',
    };

    const record = {
      report_data: JSON.stringify(reportData), // jsonb,
      created_by: userName,  // text COLLATE pg_catalog."default",
      latitude: currentPlan?.latitude,
      longitude: currentPlan?.longitude,
      keywords: "",   // text COLLATE pg_catalog."default",
      created_at: now(),   // timestamp with time zone DEFAULT now(),
      updated_at: now(),   // timestamp with time zone DEFAULT now(),
      shared_with: currentPlan?.shared_with?.toString(),  // convert to string
    };
    if (isNewPlan === false) {
      record.id = currentPlan?.id;
    }

    const data = JSON.stringify(record);
    console.log("Saving report data:", record);
    console.log("Saving report data:", data);

    // "PUT" the record to the server via API call
    try {
      const response = await fetch(`${API_BASE}/agwqplan/plans`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': secrets.agwater_api_key,
        },
        body: data,
      });
      const responseText = await response.text();
      let responseBody = {};

      try {
        responseBody = responseText ? JSON.parse(responseText) : {};
      } catch {
        responseBody = { error: responseText };
      }

      if (!response.ok || responseBody.success === false) {
        throw new Error(responseBody.error || `Unable to save plan (${response.status}).`);
      }

      if (isNewPlan) {
        // Update the current plan with the new ID returned from the server
        const newPlanId = responseBody?.inserted_record_ids[0];
        setCurrentPlan((prevPlan) => ({
          ...prevPlan,
          id: newPlanId,
        }));
        console.log(`New plan created with ID: ${newPlanId}`);
      }
      message.success('Plan saved successfully');
      return responseBody;
    } catch (error) {
      message.error(error.message || 'Unable to save plan.');
      throw error;
    }
  }



  /*
  // Filter questions based on selected concerns
  const filteredQuestions = useMemo(
    () =>
      concernQuestions.filter((q) =>
        selectedConcerns.length ? selectedConcerns.includes(q.concern) : true,
      ),
    [selectedConcerns, concernQuestions],
  );
*/
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
  /*
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
      if (userRole === 'Board/TMDL' && selectedTMDLs.length > 0) {   ///  ROLE NO LONGER EXISTS
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
  */


  return (
    <>
      <Content style={{ padding: '8px 8px', }}>
        <Card>
          <PageRating pageID='/apps/ag_wq_plan' />
          <br />
          <Title level={3}>Water Quality Practices Planner
            {userID.current && userName ? (
              <Text style={{ fontSize: 'small', marginTop: '1.0em', float: 'right' }}>
                Logged in as: {userName} ({userRole})
              </Text>
            ) : (
              <>
              <Text style={{ fontSize: 'small', marginTop: '1.0em',  float: 'right' }}>
                Not logged in: 
              <Button type='secondary' style={{ fontSize: 'small' }}>
                Log in
              </Button>
              </Text>
              </>
            )}
          </Title>

          {currentMode === '' && (
            <Paragraph>
              This tool connects land conditions and goals to agricultural water quality
              practices, technical assistance, and reference materials.
            </Paragraph>
          )}
          <br/>

          <Menu onClick={({ key }) => setCurrentMode(key)} selectedKeys={[currentMode]} mode="horizontal" items={[
            { label: 'My Plans', key: 'my_plans' },
            { label: 'Guides', key: 'guides' },
            { label: 'Maps', key: 'maps' },
            { label: 'Calculators', key: 'calculators' },
            ]}
          />


          <Spin spinning={loadingData} tip="Loading planner data...">

            {currentMode === 'my_plans' && currentPlan === null && (
              <MyPlans
                setCurrentPlan={setCurrentPlan}
                userName={userName} setUserName={_setUserName}
                userRole={userRole} setUserRole={_setUserRole}

                availableTMDLs={availableTMDLs}
                setUserID={_setUserID}
                setLoggingIn={setLoggingIn}

                savePlan={SavePlan}

              />
            )}

            {currentMode === 'my_plans' && currentPlan !== null && (
              <>
                <Button type="primary" icon={<ArrowLeftOutlined />}
                  onClick={() => setCurrentPlan(null)}
                  style={{ marginBottom: '1em', marginTop: '2em' }}>
                  Back to My Plans
                </Button>

                <PlanEditor
                  currentPlan={currentPlan} setCurrentPlan={setCurrentPlan}
                  userRole={userRole} setUserRole={_setUserRole}
                  userName={userName} setUserName={_setUserName}
                  userID={userID} setUserID={_setUserID}

                  concernsData={concerns}
                  goalsData={goals}
                  commoditiesData={commodities}
                  concernQuestionsData={concernQuestions}
                  areaRulesData={areaRules}
                  practicesData={practices}

                  setStepLocationStatus={setStepLocationStatus}
                  setStepConditionsStatus={setStepConditionsStatus}
                  setStepGoalsStatus={setStepGoalsStatus}
                  setStepPracticesStatus={setStepPracticesStatus}
                  stepLocationStatus={stepLocationStatus}
                  stepConditionsStatus={stepConditionsStatus}
                  stepGoalsStatus={stepGoalsStatus}
                  stepPracticesStatus={stepPracticesStatus}

                  savePlan={SavePlan}
                />
              </>
            )}

            { currentMode === 'guides' && (
              <PracticesGuide practicesData={practices} />
            )}

            {currentMode == 'maps' && (
              <Maps currentPlan={currentPlan} />
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
                      children: <Maps currentPlan={currentPlan} />,
                    },
                    {
                      key: 'calculators',
                      label: 'Calculators',
                      children: <>
                        <WQCalculators />
                      </>
                    },

                    {
                      key: 'additional_guides',
                      label: 'Additional Guides',
                      children: <>
                        Select a guide from the dropdown below to view additional information and guidance for implementing water quality practices.
                        <br />
                        <br />
                        <Select defaultValue="vfs" style={{ width: 200 }} onChange={(value) => setCurrentPracticeGuide(value)} options={[
                          { label: 'Vegetative Filter Strip (VFS) Guide', value: 'vfs' },
                          { label: 'Other Guide 1', value: 'other1' },
                          { label: 'Other Guide 2', value: 'other2' }
                        ]} />,
                        <div>
                          {currentPracticeGuide === 'vfs' && <VFSGuide />}
                          {currentPracticeGuide === 'other1' && <div>Other Guide 1 content goes here...</div>}
                          {currentPracticeGuide === 'other2' && <div>Other Guide 2 content goes here...</div>}
                        </div>
                      </>
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
