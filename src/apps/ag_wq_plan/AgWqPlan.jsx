import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Layout,
  Steps,
  Card,
  Typography,
  Divider,
  Space,
  Button,
  Spin,
  Row,
  Col,
} from 'antd';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import WMSLayer from '@arcgis/core/layers/WMSLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Polygon from '@arcgis/core/geometry/Polygon';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

import StepWhoWhere from './StepWhoWhere';
import StepConditions from './StepConditions';
import StepGoals from './StepGoals';
import StepPractices from './StepPractices';
import StepSummary from './StepSummary';
import UserTypeGuide from './UserTypeGuide';

import AgWqplanLogin from "./AgWqplanLogin";


const { Content, Footer } = Layout;
const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;
const API_BASE = 'https://agwater.org:5556';

const TMDL_GEOJSON_URL = 'https://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services/TMDLs_DEQ_by_parameter_Feb2026/FeatureServer/4/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson';
const ODA_AWQMA_WMS_URL = 'https://maps.oda.oregon.gov/arcgis/rest/services/Water_Quality/WQ_Auth_Datasets/FeatureServer/3'
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
  const [showMaps, setShowMaps] = useState(false);


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
        const [concernsData, questionsData, practicesData, goalsData] = await Promise.all([
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

  const showMapContent = (show) => {
    console.log("Show maps:", show);
    setShowMaps(show);
  }

  const next = () => setCurrent((c) => c + 1);
  const prev = () => setCurrent((c) => c - 1);

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
        ></AgWqplanLogin>
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
            <Paragraph>
              This tool connects land conditions and goals to agricultural water quality
              practices, technical assistance, and reference materials.
            </Paragraph>

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
