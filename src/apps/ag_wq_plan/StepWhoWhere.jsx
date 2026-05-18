// Import React and Ant Design components for form building
import { useEffect, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import "@arcgis/map-components/components/arcgis-search"; // Import ArcGIS Search component


// Extract Typography.Paragraph component for use in the form description
const { Paragraph } = Typography;

const MousePositionTracker = ({ setMousePosition }) => {
  useMapEvents({
    mousemove: (event) => {
      const { lat, lng } = event.latlng;
      setMousePosition(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    },
  });

  return null;
};

MousePositionTracker.propTypes = {
  setMousePosition: PropTypes.func.isRequired,
};

const MarkerClickTracker = ({ setMarkerPosition }) => {
  useMapEvents({
    click: (event) => {
      setMarkerPosition([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
};

MarkerClickTracker.propTypes = {
  setMarkerPosition: PropTypes.func.isRequired,
};

const getSearchResultLatLng = (searchResult) => {
  const location = searchResult?.location;
  if (location?.latitude != null && location?.longitude != null) {
    return [location.latitude, location.longitude];
  }

  const geometry = searchResult?.feature?.geometry;
  if (geometry) {
    if (geometry.latitude != null && geometry.longitude != null) {
      return [geometry.latitude, geometry.longitude];
    }

    if (geometry.y != null && geometry.x != null) {
      return [geometry.y, geometry.x];
    }
  }

  const center = searchResult?.extent?.center;
  if (center?.latitude != null && center?.longitude != null) {
    return [center.latitude, center.longitude];
  }

  return null;
};

// Component for Step 1: Collect user type, region, and commodity information
// This component renders a form where users identify themselves and their operation location
// Props:
//   - userType: Current selected user type
//   - setUserType: Function to update user type
//   - region: Current selected region (optional)
//   - setRegion: Function to update region
//   - commodity: Current selected commodity/operation type (optional)
//   - setCommodity: Function to update commodity
const StepWhoWhere = ({
  userType,
  setUserType,
  commodity,
  setCommodity,
  commoditiesData,
  sitesData,
}) => {
  const [mousePosition, setMousePosition] = useState('');
  const [markerPosition, setMarkerPosition] = useState(null);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [sitePhotoPreviews, setSitePhotoPreviews] = useState([]);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [useExistingSite, setUseExistingSite] = useState(false);
  const [selectedExistingSite, setSelectedExistingSite] = useState(null);
  const [siteName, setSiteName] = useState('');
  const arcgisSearchRef = useRef(null);
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const commodityOptions = useMemo(() => {
    if (!Array.isArray(commoditiesData) || commoditiesData.length === 0) {
      return [];
    }

    return commoditiesData.map((item) => {
      if (typeof item === 'string') {
        return { label: item, value: item };
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const value = item.value ?? item.id ?? item.code ?? item.name ?? item.label;
      const label = item.label ?? item.name ?? item.displayName ?? value;

      if (value == null || label == null) {
        return null;
      }

      return { label: String(label), value: String(value) };
    }).filter(Boolean);
  }, [commoditiesData]);

  const handlePhotoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingPhoto({ name: file.name, url: previewUrl, file });
    event.target.value = '';
  };

  const confirmAddPendingPhoto = () => {
    if (!pendingPhoto) return;
    setSitePhotoPreviews((currentPreviews) => [
      ...currentPreviews,
      { name: pendingPhoto.name, url: pendingPhoto.url },
    ]);
    setPendingPhoto(null);
    setPhotoPickerOpen(false);
  };

  const cancelPendingPhoto = () => {
    if (pendingPhoto) {
      try {
        URL.revokeObjectURL(pendingPhoto.url);
      } catch {
        // ignore
      }
      setPendingPhoto(null);
    }
  };

  const handleDeletePhoto = (url) => {
    setSitePhotoPreviews((current) => {
      const remaining = current.filter((p) => p.url !== url);
      const removed = current.find((p) => p.url === url);
      if (removed) {
        try {
          URL.revokeObjectURL(removed.url);
        } catch {
          // ignore
        }
      }
      return remaining;
    });
  };

  useEffect(() => {
    return () => {
      sitePhotoPreviews.forEach((preview) => {
        try {
          URL.revokeObjectURL(preview.url);
        } catch {
          // ignore
        }
      });
      if (pendingPhoto) {
        try {
          URL.revokeObjectURL(pendingPhoto.url);
        } catch {
          // ignore
        }
      }
    };
  }, [sitePhotoPreviews, pendingPhoto]);


  useEffect(() => {
    const searchElement = arcgisSearchRef.current;
    if (!searchElement) {
      return undefined;
    }

    const stopPropagation = (event) => {
      event.stopPropagation();
    };

    const handleSearchResult = (event) => {
      const result = event.detail?.results;
      if (result && result.length > 0) {
        const latLng = getSearchResultLatLng(result[0]);
        if (latLng) {
          setMarkerPosition(latLng);
        }
      }
    };

    const eventsToStop = ['click']; //, 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'dblclick', 'touchstart', 'touchend'];
    eventsToStop.forEach((eventName) => {
      searchElement.addEventListener(eventName, stopPropagation, true);
    });
    searchElement.addEventListener('arcgis-search-result', handleSearchResult);

    return () => {
      eventsToStop.forEach((eventName) => {
        searchElement.removeEventListener(eventName, stopPropagation, true);
      });
      searchElement.removeEventListener('arcgis-search-result', handleSearchResult);
    };
  }, []);

  return (
    <>
      {/* Instructions for the user */}
      <Paragraph>
        Select who you are and where the operation is located. This helps tailor practices
        and resources to your situation.
      </Paragraph>
      <Form layout="vertical">
        {/* Form field for selecting user type */}
        {/* Each user type has different perspectives and needs */}
        <Row gutter={16}>
          <Col sm={24} md={12}>
            <Form.Item label="User type">
              <Select
                value={userType}
                onChange={setUserType}
                style={{ width: '30em', maxWidth:'100%' }}
                options={[
                  { label: 'Landowner', value: 'Landowner' },
                  { label: 'SWCD / Technical Assistant', value: 'SWCD / TA' },
                  { label: 'ODA - Compliance', value: 'ODA - Compliance' },
                  { label: 'Board / TMDL', value: 'Board / TMDL' },
                ]}
              />
            </Form.Item>

            {/* Form field for selecting commodity or operation type */}
            {/* Optional field to tailor recommendations to specific crop/livestock types */}
            <Form.Item label="Commodity / operation type">
                <Select
                value={commodity}
                onChange={(v) => setCommodity(v)}
                allowClear
                placeholder="e.g., pasture, row crops, orchards, livestock"
                style={{ width: '30em', maxWidth:'100%' }}
              options={commodityOptions}
                />
            </Form.Item>


            <div>Site location </div>
            
            <div>
              <Checkbox checked={useExistingSite} onChange={(e) => setUseExistingSite(e.target.checked)}>
                Use Existing Site?
              </Checkbox>
            </div>
            <br/>

            { useExistingSite ? (
              <>
              <Select
                value={selectedExistingSite}
                onChange={(v) => setSelectedExistingSite(v)}
                placeholder="Select an existing site"
                style={{ width: '30em', maxWidth: '100%' }}
                disabled={!useExistingSite}
                options={[sitesData.map((site) => {
                  const value = site.id;
                  const label = site.name || `Site ${site.id}`;
                  return { label, value };
                })]}
              />
              </>
            ) : (
              <>
            

            



            <Form.Item label="Site name">
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Enter a name for this site"
                style={{ width: '30em', maxWidth: '100%' }}
              />
            </Form.Item>

            {/* BELOW NEEDS TO BE UPDATED */}

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Latitude">
                  <Input
                    value={siteName}
                    disabled={true}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Enter a name for this site"
                    style={{ width: '30em', maxWidth: '100%' }}
                  />
                </Form.Item>
                </Col>
              <Col span={12}>

                <Form.Item label="Longitude">
                  <Input
                    disabled={true}
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Enter a name for this site"
                    style={{ width: '30em', maxWidth: '100%' }}
                  />
                </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Ag Water Quality Management Area">
                  <Input
                    value={siteName}
                    disabled={true}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Enter a name for this site"
                    style={{ width: '30em', maxWidth: '100%' }}
                  />
                </Form.Item>
                </Col>
              <Col span={12}>

                <Form.Item label="TMDL Area">
                  <Input
                    disabled={true}
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Enter a name for this site"
                    style={{ width: '30em', maxWidth: '100%' }}
                  />
                </Form.Item>
                </Col>
            </Row>

            After specifying the site location on the map below, you can save the site...
            
            <Button type="primary" style={{ marginBottom: 16, marginLeft: 16 }} disabled={true}>
              Save Site
            </Button>


            <div style={{ fontSize: '0.9rem', fontStyle: 'italic', marginBottom: 8 }}>
              Click on the map to set the location of your operation, or search for an address or place using the search box in the top right corner of the map.
            </div>
            <div style={{ width: '100%', maxWidth: '800px', height: 500, marginBottom: 12, position: 'relative' }}>
              <MapContainer center={[44.0, -120.5]} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} doubleClickZoom={false}>
                <MousePositionTracker setMousePosition={setMousePosition} />
                <MarkerClickTracker setMarkerPosition={setMarkerPosition} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                {markerPosition && <Marker position={markerPosition} />}
                <arcgis-search
                  ref={arcgisSearchRef}
                  placeholder="Search for a location"
                  countries="US"
                  style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}
                ></arcgis-search>
              </MapContainer>
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              Location Lat/Long: {mousePosition || 'move the mouse over the map'}
            </div>
</>
            )}



          </Col>

          <Col sm={24} md={12}>
            {/* Form field for selecting geographic region */}
            {/* Optional field to limit recommendations to specific regions */}
            {/*}
            <Form.Item label="Region">
              <Select
                value={region}
                onChange={(v) => setRegion(v)}
                allowClear
                placeholder="Select region"
                style={{ width: '30em' }}
                options={[
                  { label: 'All Oregon', value: 'All' },
                  { label: 'Western Oregon', value: 'Western OR' },
                  { label: 'Eastern Oregon', value: 'Eastern OR' },
                ]}
              />
            </Form.Item>

            <Divider>OR</Divider>
            */}

          <div>Site Photos</div>

          <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
            <Button type="primary" onClick={() => setPhotoPickerOpen(true)}>
              Add site photo
            </Button>

            {sitePhotoPreviews.length > 0 && (
              <Space wrap>
                {sitePhotoPreviews.map((photo) => (
                  <div key={photo.url} style={{ width: 360 }}>
                    <img
                      src={photo.url}
                      alt={photo.name}
                      style={{ width: '100%', height: 360, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                    />
                    <div style={{ fontSize: '0.8rem', marginTop: 8, wordBreak: 'break-word', textAlign: 'center' }}>{photo.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
                      <Popconfirm title="Delete this photo?" onConfirm={() => handleDeletePhoto(photo.url)} okText="Delete" cancelText="Cancel">
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </div>
                  </div>
                ))}
              </Space>
            )}
          </Space>

          <Modal
            open={photoPickerOpen}
            title="Add a site photo"
            onCancel={() => { cancelPendingPhoto(); setPhotoPickerOpen(false); }}
            footer={null}
            style={{ textAlign: 'center' }}
            destroyOnClose
          >
            {pendingPhoto ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <img src={pendingPhoto.url} alt={pendingPhoto.name} style={{ width: '100%', maxWidth: 480, borderRadius: 8 }} />
                <div style={{ fontSize: '0.9rem' }}>{pendingPhoto.name}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button type="primary" onClick={confirmAddPendingPhoto}>Add photo</Button>
                  <Button onClick={cancelPendingPhoto}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type='primary' onClick={() => uploadInputRef.current?.click()}>
                  Upload image from device
                </Button>
                <Button type='primary' onClick={() => cameraInputRef.current?.click()}>
                  Take a photo with camera
                </Button>
              </Space>
            )}
          </Modal>

          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoFileChange}
            style={{ display: 'none' }}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoFileChange}
            style={{ display: 'none' }}
          />


              





          </Col>
        </Row>
      </Form>
    </>
  );
};
StepWhoWhere.propTypes = {
  userType: PropTypes.string.isRequired,
  setUserType: PropTypes.func.isRequired,
  region: PropTypes.string,
  setRegion: PropTypes.func.isRequired,
  commodity: PropTypes.string,
  setCommodity: PropTypes.func.isRequired,
  commoditiesData: PropTypes.array,
  sitesData: PropTypes.array,
};

// Export the component as default
export default StepWhoWhere;
