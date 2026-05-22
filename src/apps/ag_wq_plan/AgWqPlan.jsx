import { useEffect, useMemo, useState, useRef } from 'react';

import {Alert,Layout,Steps,Card,Typography,Divider,Space,Button,Spin,Row,Col,} from 'antd';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

import StartUp from './StartUp';
import StepWhoWhere from './StepWhoWhere';
import StepConditions from './StepConditions';
import StepGoals from './StepGoals';
import StepPractices from './StepPractices';
import StepSummary from './StepSummary';

import AgWqplanLogin from "./AgWqplanLogin";
import ValidationError from './ValidationError';


const { Content, Footer } = Layout;
const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;
const API_BASE = 'https://agwater.org:5556';

const TMDL_GEOJSON_URL = 'https://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services/TMDLs_DEQ_by_parameter_Feb2026/FeatureServer/4/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson';
const ODA_AWQMA_WMS_URL = 'https://maps.oda.oregon.gov/arcgis/rest/services/Water_Quality/WQ_Auth_Datasets/FeatureServer/3/query?where=MA_Index>0&outFields=*&returnGeometry=true&f=geojson'
/*
  "Create a 'living' repository of suggested agricultural/environmental practices
   to maintain and improve the quality of water for all waters of the State."
  "Ability for landowner to identify/search for Ag Practices related to their land."
*/

const WqMap = ({ feature_url, center = [-120.5, 44.0], zoom = 5, height = 400 }) => {
  const mapContainer = useRef(null);
  const mapView = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initializeMap = async () => {
      try {
        // Create map with basemap
        const map = new Map({
          basemap: 'osm-3d',
        });

        // Create MapView
        mapView.current = new MapView({
          container: mapContainer.current,
          map: map,
          center: center,
          zoom: zoom,
        });

        // If feature_url is provided, load and display the feature
        if (feature_url) {
          try {
            // Check if it's a FeatureServer URL
            if (feature_url.includes('FeatureServer')) {
              // Add the feature layer directly from the URL
              const featureLayer = new FeatureLayer({
                url: feature_url
              });

              map.add(featureLayer);

              // Zoom to the extent of the feature layer
              await mapView.current.when(async () => {
                if (featureLayer.loaded) {
                  mapView.current.extent = featureLayer.fullExtent;
                }
              });
            } else if (feature_url.includes('query')) {
              // Handle GeoJSON or query endpoints
              const response = await fetch(feature_url);
              if (!response.ok) {
                throw new Error(`Failed to fetch feature: ${response.status}`);
              }

              const geojson = await response.json();

              // Create a graphics layer to display the features
              const graphicsLayer = new GraphicsLayer();
              map.add(graphicsLayer);

              // Process GeoJSON features
              const features = geojson.features || [];
              features.forEach((feature) => {
                const geometry = feature.geometry;
                const properties = feature.properties;

                let graphicGeometry = null;

                if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
                  const rings = geometry.coordinates;
                  graphicGeometry = {
                    type: 'polygon',
                    rings: rings[0] ? [rings[0]] : [],
                    spatialReference: { wkid: 4326 }
                  };
                } else if (geometry.type === 'Point') {
                  graphicGeometry = {
                    type: 'point',
                    longitude: geometry.coordinates[0],
                    latitude: geometry.coordinates[1],
                    spatialReference: { wkid: 4326 }
                  };
                } else if (geometry.type === 'LineString') {
                  graphicGeometry = {
                    type: 'polyline',
                    paths: [geometry.coordinates],
                    spatialReference: { wkid: 4326 }
                  };
                }

                if (graphicGeometry) {
                  let symbol, label;

                  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
                    symbol = {
                      type: 'simple-fill',
                      color: [51, 102, 153, 0.3],
                      outline: {
                        color: [51, 102, 153],
                        width: 2
                      }
                    };
                    label = properties?.name || 'Feature Area';
                  } else if (geometry.type === 'Point') {
                    symbol = {
                      type: 'simple-marker',
                      size: 10,
                      color: [51, 102, 153],
                      outline: {
                        color: [255, 255, 255],
                        width: 2
                      }
                    };
                    label = properties?.name || 'Feature Point';
                  } else if (geometry.type === 'LineString') {
                    symbol = {
                      type: 'simple-line',
                      color: [51, 102, 153],
                      width: 3
                    };
                    label = properties?.name || 'Feature Line';
                  }

                  const graphic = new Graphic({
                    geometry: graphicGeometry,
                    symbol: symbol,
                    attributes: properties,
                    popupTemplate: {
                      title: label,
                      content: properties ? Object.entries(properties)
                        .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
                        .join('') : 'Feature'
                    }
                  });

                  graphicsLayer.add(graphic);
                }
              });

              // Zoom to graphics extent
              if (graphicsLayer.graphics.length > 0) {
                await mapView.current.when(() => {
                  const extent = graphicsLayer.graphics.reduce((acc, graphic) => {
                    if (graphic.geometry && graphic.geometry.extent) {
                      return acc ? acc.union(graphic.geometry.extent) : graphic.geometry.extent;
                    }
                    return acc;
                  }, null);

                  if (extent) {
                    mapView.current.extent = extent.expand(1.2);
                  }
                });
              }
            }
          } catch (error) {
            console.error('Error loading feature from URL:', error);
          }
        }
      } catch (err) {
        console.error('Error initializing map:', err);
      }
    };

    initializeMap();

    return () => {
      // Cleanup if needed
      if (mapView.current) {
        mapView.current.destroy();
      }
    };
  }, [feature_url, center, zoom]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: `${height}px`,
        borderRadius: 8,
        overflow: 'hidden'
      }}
    />
  );
};



// Main AgWqPlan component for the Water Quality Practices Planner.
// Loads concern questions and practices from the /agwqplan routes exposed by ag_wqplan.py.
const AgWqPlan = () => {
  // Current step in the wizard (0-4)
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
  const [userType, setUserType] = useState('Landowner');
  const commodity = useRef('Pasture/Hay');
  const [siteName, setSiteName] = useState('');
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

  // ------------------------------------------------------------------------------------
  // Success/Error status of each Step for validation and user feedback
  // possible values are wait process finish error
  //------------------------------------------------------------------------------------
  const [stepLocationStatus, setStepLocationStatus] = useState('process');
  const [stepConditionsStatus, setStepConditionsStatus] = useState('wait');
  const [stepGoalsStatus, setStepGoalsStatus] = useState('wait');
  const [stepPracticesStatus, setStepPracticesStatus] = useState('wait');
  


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
        const [sitesData, commoditiesData, concernsData, questionsData, practicesData, goalsData,areaRulesData] = await Promise.all([
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
      {loggingIn && (
        <AgWqplanLogin
          onLoginSuccess={(result) => {
            console.log("Login successful:", result);
            setLoginName(result.user.username);
            setUserRole(result.user.role);
            setLoggingIn(false);
          }}
          onLoginFailure={(error) => {
            console.error("Login failed:", error);
            setLoggingIn(false);
          }}
          onLogout={() => {
            console.log("Logged out");
            setLoginName(null);
            setUserRole(null);
            setLoggingIn(false);
          }}
        />
      )}
      {!loginName && !loggingIn && (
        <div style={{ padding: 4, textAlign: 'right' }} >
          <Button type="text" onClick={() => setLoggingIn(true)}>
            Sign In
          </Button>
          <Button type="text" onClick={() => showMapContent(true)}>
            Maps
          </Button>
        </div>
      )}
      {loginName && (
        <div style={{ padding: 4, textAlign: 'right', color: 'white', fontSize: 'small' }} >
          Signed in as <b>{loginName}</b>
          <Button ghost onClick={() => {
            setLoggingIn(false);
            setLoginName(null);
            setUserRole(null);
          }} style={{ marginLeft: 8 }}>
            Sign Out
          </Button>
          <Button type="text" onClick={() => showMapContent(true)}>
            Maps
          </Button>
        </div>
      )}

      {showMaps && (
        <Content style={{ padding: '8px 8px', backgroundColor: '#001529' }}>
          <Card>
            <Title level={3}>Maps</Title>
            <Row>
              <Col xs={24} md={12}>
                <Title level={4}>Agricultural Water Quality Management Areas</Title>
                <Text>ODA Agricultural Water Quality Management Areas. Source: <a href="https://www.oregon.gov/oda/programs/NaturalResources/Pages/AWQMA.aspx">ODA AWQMA Mapper</a></Text>
                <WqMap features_url={ODA_AWQMA_WMS_URL}></WqMap>



              </Col>
              <Col xs={24} md={12}>
                <Title level={4}>TMDL Areas</Title>
                <Text>Oregon DEQ TMDL areas by parameter. Source: <a href="https://www.oregon.gov/deq/wq/Pages/TMDLs.aspx">DEQ TMDL Mapper</a></Text>
                <WqMap feature_url={TMDL_GEOJSON_URL}></WqMap>
              </Col>
            </Row>

            <Button type="primary" onClick={() => showMapContent(false)}>Close</Button>
          </Card>
        </Content>
      )}


      <Content style={{ padding: '8px 8px', backgroundColor: '#001529' }}>
        <Card>
            <Title level={3}>Water Quality Practices Planner</Title>
            {current === -1 && (
              <Paragraph>
                This tool connects land conditions and goals to agricultural water quality
                practices, technical assistance, and reference materials.
              </Paragraph>
            )}
            <Divider />            

          <Spin spinning={loadingData} tip="Loading planner data...">
            {current === -1 && (
              <StartUp 
                userType={userType} 
                setUserType={setUserType} 
                selectedTMDLs={selectedTMDLs} 
                setSelectedTMDLs={setSelectedTMDLs} 
                availableTMDLs={availableTMDLs}
                setLoginName={setLoginName}
                setUserRole={setUserRole}
                setLoggingIn={setLoggingIn} />
            )}

            {current >= 0 && (
              <>
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
                userType={userType}
                sitesData={sites}
                commodity={commodity}
                commoditiesData={commodities}
                siteName={siteName} setSiteName={setSiteName}
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
                userType={userType}
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
                userType={userType}
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
              {current < 4 && stepLocationStatus !== 'error' &&  stepConditionsStatus !== 'error' && stepGoalsStatus !== 'error' && stepPracticesStatus !== 'error' && (
                <Button type="primary" onClick={next}>
                  Next
                </Button>
              )}
              {current < 4 && ( stepLocationStatus === 'error' ||  stepConditionsStatus === 'error' || stepGoalsStatus === 'error' || stepPracticesStatus === 'error' ) && (
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
