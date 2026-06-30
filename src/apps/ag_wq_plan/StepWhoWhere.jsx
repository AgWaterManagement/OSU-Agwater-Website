// Import React and Ant Design components for form building
import { useEffect, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';

import { Card, Button, Checkbox, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Typography, message } from 'antd';
import ValidationError from './ValidationError';
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';

import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';

import "@arcgis/map-components/components/arcgis-basemap-toggle";
import "@arcgis/map-components/components/arcgis-search"; // Import ArcGIS Search component
import "@arcgis/map-components/components/arcgis-zoom"; // Import ArcGIS Zoom component

import { secrets } from '../../secrets';


// Extract Typography.Paragraph component for use in the form description
const { Paragraph, Title, Text } = Typography;
const { TextArea } = Input;

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
  userID,
  sitesData,
  commoditiesData,
  selectedCommodities,
  setSelectedCommodities,
  setPhotos,
  siteName, setSiteName,
  siteID, setSiteID,
  siteDescription, setSiteDescription,
  siteLocator, setSiteLocator,
  _latitude, setLatitude,
  _longitude, setLongitude,
  agwqmArea, setAgwqmArea,
  agwqRegion, setAgwqRegion,
  regionalSpecialist, setRegionalSpecialist,
  regionalSpecialistEmail, setRegionalSpecialistEmail,
  regionalSpecialistPhone, setRegionalSpecialistPhone,
  adminRulesLink, setAdminRulesLink,
  areaPlanLink, setAreaPlanLink,
  setError
}) => {
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [sitePhotoPreviews, setSitePhotoPreviews] = useState([]);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [selectedExistingSite, setSelectedExistingSite] = useState('new-site');

  const isSiteDirty = useRef(false);


  const arcgisBasemapToggleRef = useRef(null);
  const arcgisSearchRef = useRef(null);
  const arcgisZoomRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapViewRef = useRef(null);
  const markerLayerRef = useRef(null);
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const awqmaLayer = useRef(null);

  const ODA_AWQMA_WMS_URL = 'https://maps.oda.oregon.gov/arcgis/rest/services/Water_Quality/WQ_Auth_Datasets/FeatureServer/3/query?where=MA_Index>0&outFields=*&returnGeometry=true&f=geojson'


  const handlePhotoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingPhoto({ name: file.name, url: previewUrl, description: '', file });
    event.target.value = '';
  };

  // handle confirmation of adding a pending photo by adding to the 
  // list of site photo previews (currentPreviews)
  const confirmAddPendingPhoto = () => {
    if (!pendingPhoto) return;
    setSitePhotoPreviews((currentPreviews) => [
      ...currentPreviews,
      { name: pendingPhoto.name, url: pendingPhoto.url, description: pendingPhoto.description },
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
          // ?? REMOVE FROM DATABASE ??
        } catch {
          // ignore
        }
      }
      return remaining;
    });
  };


  const handleSavePhoto = async (url) => {
    // sitePhotoPreviews is the array of photo previews for this site
    const saved = sitePhotoPreviews.find((p) => p.url === url);
    if (saved) {
      try {
        //URL.revokeObjectURL(removed.url);
        const payload = [
          {
            //id:  // integer NOT NULL DEFAULT nextval('sites_id_seq'::regclass),
            site_id: siteID,
            file_path: pendingPhoto.file,
            description: pendingPhoto.description,
          },
        ];

        const response = await fetch(`https://agwater.org:5556/agwqplan/site/images`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': secrets.agwater_api_key
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.success) {
          message.success('Site Photo saved successfully');
          //isSiteDirty.current = false;
        } else {
          message.error(`Failed to save site photo: ${data.error}`);
        }
      } catch (error) {
        message.error(`Error saving site photo: ${error.message}`);
      }
    }
  }

  // Handle saving site
  const handleSaveSite = async () => {
    try {
      const payload = [
        {

          //id:  // integer NOT NULL DEFAULT nextval('sites_id_seq'::regclass),
          latitude: _latitude,  // real,
          longitude: _longitude,  // real,
          name: siteName,  // text COLLATE pg_catalog."default",
          description: siteDescription,   // text COLLATE pg_catalog."default",
          awqma: agwqmArea,   // text COLLATE pg_catalog."default",
          tmdl_area: agwqRegion,   // text COLLATE pg_catalog."default",
          locator: siteLocator,    //text COLLATE pg_catalog."default",
          owner_id: null,  // integer,
        },
      ];

      const response = await fetch(`https://agwater.org:5556/agwqplan/sites`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        message.success('Site saved successfully');
        isSiteDirty.current = false;
      } else {
        message.error(`Failed to save site: ${data.error}`);
      }
    } catch (error) {
      message.error(`Error saving site: ${error.message}`);
    }
  };


  function queryLayer(layer, latitude, longitude) {
    // Query the AWQMA GeoJSON layer for attributes at the clicked point
    if (layer && typeof layer.queryFeatures === 'function') {
      console.log('Querying layer for clicked location...');

      layer.queryFeatures({
        geometry: { latitude: latitude, longitude: longitude },
        spatialRelationship: 'intersects',
        outFields: '*', // ['MA_Index'], //, 'AgWQ_Reporting_Area','Administrative_rules','Area_plan','Phone','Email'],
        returnGeometry: false,
      }).then((result) => {
        console.log('AWQMA query result:', result);
        const features = result?.features || [];
        if (features.length > 0) {
          const attrs = features[0].attributes || {};
          setLatitude(latitude);
          setLongitude(longitude);
          setAgwqRegion(attrs.AgWQ_Reporting_Area);
          setAgwqmArea(attrs.MA_Index);
          setRegionalSpecialist(attrs.Water_quality_specialist);
          setRegionalSpecialistEmail(attrs.Email);
          setRegionalSpecialistPhone(attrs.Phone);
          setAdminRulesLink(attrs.Administrative_rules ? attrs.Administrative_rules : null);
          setAreaPlanLink(attrs.Area_plan ? attrs.Area_plan : null);
          setError('process');
        } else {
          console.log('No feature found at clicked location');
        }
      }).catch((err) => {
        console.error('Error querying AWQMA layer:', err);
      });
    }
  }


  // if sitePhotoPreview, pendingPhoto changes
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

  // startup
  //  1. stop event propagation
  //  2. add handler for search results
  //    - set site location info
  //  3. Manage map event propagation
  useEffect(() => {
    //const searchElement = arcgisSearchRef.current;
    //const view = mapViewRef.current;
    if (!arcgisSearchRef.current || !mapViewRef.current) {
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
          //setMarkerPosition(latLng);
          //setError('process');
          const [latitude, longitude] = latLng;
          const point = {
            type: 'point',
            latitude,
            longitude,
          };
          markerLayerRef.current?.removeAll();
          markerLayerRef.current?.add(new Graphic({
            geometry: point,
            symbol: {
              type: 'simple-marker',
              color: '#d7191c',
              size: 12,
              outline: {
                color: '#ffffff',
                width: 1,
              },
            },
          }));
          mapViewRef.current.goTo({ center: [longitude, latitude], zoom: 11 });
        }
      }
    };

    // manage event propagation
    const eventsToStop = ['click']; //, 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'dblclick', 'touchstart', 'touchend'];
    const searchElement = arcgisSearchRef.current;
    eventsToStop.forEach((eventName) => {
      searchElement.addEventListener(eventName, stopPropagation, true);
    });
    searchElement.addEventListener('arcgis-search-result', handleSearchResult);

    // return cleanup function to remove installed event listeners
    return () => {
      eventsToStop.forEach((eventName) => {
        searchElement.removeEventListener(eventName, stopPropagation, true);
      });
      searchElement.removeEventListener('arcgis-search-result', handleSearchResult);
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapViewRef.current) {
      return undefined;
    }

    const map = new Map({
      basemap: 'streets-vector',
    });

    const markerLayer = new GraphicsLayer({
      title: 'Selected site marker',
    });
    markerLayerRef.current = markerLayer;
    map.add(markerLayer);

    awqmaLayer.current = new GeoJSONLayer({
      url: ODA_AWQMA_WMS_URL,
      title: 'ODA AWQMA',
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [0, 0, 0, 0], // fully transparent fill
          outline: {
            type: 'simple-line',
            color: [0, 0, 0, 0.6],
            width: 1
          }
        }
      }
    });
    map.add(awqmaLayer.current);

    // create a MapView to view hte map
    const view = new MapView({
      container: mapContainerRef.current,
      map,
      center: [-120.5, 44.0],
      zoom: 5,
      ui: {
        components: [] // disable default UI (prevents duplicate zoom control)
      },
      constraints: {
        rotationEnabled: false,
      },
    });
    mapViewRef.current = view;

    // mousePosition handler
    //const updateMousePosition = (event) => {
    //  const mapPoint = view.toMap({ x: event.x, y: event.y });
    //  if (mapPoint) {
    //    setMousePosition(`${mapPoint.latitude.toFixed(5)}, ${mapPoint.longitude.toFixed(5)}`);
    //  }
    //};

    // click handler
    const handleClick = (event) => {
      if (!event.mapPoint) {
        return;
      }

      const { latitude, longitude } = event.mapPoint;
      // Log click coordinates
      console.log('map click lat,long:', latitude, longitude);
      queryLayer(awqmaLayer.current, latitude, longitude);   // query spatail data and update UIlocation states

      console.log('Setting marker at clicked location');
      //setMarkerPosition([latitude, longitude]);
      setError('process');
      markerLayer.removeAll();
      markerLayer.add(new Graphic({
        geometry: event.mapPoint,
        symbol: {
          type: 'simple-marker',
          color: '#d7191c',
          size: 12,
          outline: {
            color: '#ffffff',
            width: 1,
          },
        },
      }));
    };

    const handleViewReady = async () => {
      await view.when();
      const searchElement = arcgisSearchRef.current;
      const zoomElement = arcgisZoomRef.current;
      const basemapToggleElement = arcgisBasemapToggleRef.current;
      if (searchElement) {
        searchElement.view = view;
      }
      if (zoomElement) {
        zoomElement.view = view;
      }
      if (basemapToggleElement) {
        basemapToggleElement.view = view;
      }
    };

    //view.on('pointer-move', updateMousePosition);
    view.on('click', handleClick);
    handleViewReady();

    return () => {
      markerLayerRef.current = null;
      mapViewRef.current = null;
      view.destroy();
    };
  }, []);


  const siteOptions = useMemo(() => {
    if (!Array.isArray(sitesData) || sitesData.length === 0) {
      return [{ label: 'New Site', value: 'new-site' }];
    }

    const sites = sitesData.map((item) => {
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
      console.log({ label: String(label), value: String(value) });
      return { label: String(label), value: String(value) };
    }).filter(Boolean);

    return [{ label: 'New Site', value: 'new-site' }, ...sites];
  }, [sitesData]);


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



  function handleDescriptionChange(photoUrl, description) {
    //setPhotos(prevPhotos =>
    //  prevPhotos.map(photo =>
    //    photo.url === photoUrl ? { ...photo, description } : photo
    //  )
    //);
  }

  if (!siteName || _latitude == null || _longitude == null) {
    setError('error');
  }

  const _setSiteName = (value) => {
    isSiteDirty.current = true;
    setSiteName(value);
    if (value) {
      setError('process');
    }
  };

  if (siteName && _latitude != null && _longitude != null) {
    setError('finish');
  }

  function _setSiteLocator(value) {
    isSiteDirty.current = true;
    setSiteLocator(value);
  }

  function _setSiteDescription(value) {
    isSiteDirty.current = true;
    setSiteDescription(value);
  }


  function _setSelectedSite(value) {
    // get this site in the sitesData
    const site = sitesData.find((s) => s.id === parseInt(value));

    // update the site name, location, description, etc
    setLatitude(site?.latitude || null);
    setLongitude(site?.longitude || null);
    setSiteName(site?.name || null);
    setSiteID(site?.id || null);
    setSiteLocator(site?.locator || null);
    setSiteDescription(site?.description || null);

    queryLayer(awqmaLayer.current, site?.latitude, site?.longitude);

    // zoom to location
    if (site?.latitude != null && site?.longitude != null) {
      mapViewRef.current.goTo({
        target: [site.longitude, site.latitude],
        zoom: 15,
      });
    }

    // place a marker on the map
    markerLayerRef.current?.removeAll();
    if (site?.latitude != null && site?.longitude != null) {
      markerLayerRef.current?.add({
        geometry: {
          type: 'point',
          x: site.longitude,
          y: site.latitude,
          //coordinates: [site.longitude, site.latitude]
        },
        symbol: {
          type: 'simple-marker',
          color: '#d7191c',
          size: 12,
          outline: {
            color: '#ffffff',
            width: 1,
          },
        },
      });

      //mapViewRef.current.goTo({ center: [longitude, latitude], zoom: 11 });
      }


    setSelectedExistingSite(value);
  }

  return (
    <>
      {/* Instructions for the user */}
      <Paragraph>
        Select where the operation is located. This helps tailor practices and resources to your location.
      </Paragraph>
      <Form layout="vertical">
        <Row gutter={16}>
          <Col sm={24} md={12}>

            <Title level={5}>Site location </Title>
            <div>
              {userID  && (
                <Select
                  value={selectedExistingSite}
                  onChange={(v) => _setSelectedSite(v)}
                  style={{ width: '30em', maxWidth: '100%' }}
                  options={siteOptions}
                />
              )}

            </div>
            <Card>
              {!siteName && <ValidationError message="" />}

              <Row>
                <Col style={{ width: '12em' }}>
                  <Text>Site Name: </Text>
                </Col>
                <Col>
                  <Input
                    value={siteName}
                    onChange={(e) => _setSiteName(e.target.value)}
                    placeholder="Enter a name for this site"
                    style={{ width: '30em', maxWidth: '100%' }}
                  />
                </Col>
              </Row>
              <br />
              <Row>
                <Col style={{ width: '12em' }}>
                  <Text>Site Locator/Address: </Text>
                </Col>
                <Col>
                  <Input
                    value={siteLocator}
                    onChange={(e) => _setSiteLocator(e.target.value)}
                    placeholder="Enter the location or address of the site"
                    style={{ width: '30em', maxWidth: '100%' }}
                  />
                </Col>
              </Row>

              <br />
              <Row>
                <Col style={{ width: '12em' }}>
                  <Text>Site Description: </Text>
                </Col>
                <Col>
                  <TextArea
                    value={siteDescription}
                    onChange={(e) => _setSiteDescription(e.target.value)}
                    placeholder="Enter a description for this site"
                    style={{ width: '30em', maxWidth: '100%' }}
                  />
                </Col>
              </Row>

              <br />

              <Paragraph>
                After specifying the site name and selecting the site location on the map below, you can save
                 the site for future reference. <span style={{ fontStyle: 'italic' }}>Note: You must be logged in to save a site.</span>
              </Paragraph>

              <Button type="primary" style={{ marginBottom: 16, marginLeft: 16 }} 
                      onClick={() => { handleSaveSite(); }}
                      disabled={(!userID || siteName.trim() === '' || !_latitude || !_longitude || isSiteDirty.current === false)}>
                  Save Site
                </Button>

              {!_latitude && !_longitude && (<><br /><ValidationError message="Below, specify the location of the site." /></>)}

              <div style={{ fontSize: '0.9rem', fontStyle: 'italic', marginBottom: 8 }}>
                Click on the map to set the location of your operation, or search for an address or place using the search box in the top right corner of the map.
              </div>
              <div style={{ width: '100%', maxWidth: '800px', height: 500, marginBottom: 12, position: 'relative' }}>
                <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
                <arcgis-zoom
                  ref={arcgisZoomRef}
                  style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000 }}
                ></arcgis-zoom>
                <arcgis-search
                  ref={arcgisSearchRef}
                  placeholder="Search for a location"
                  countries="US"
                  style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}
                ></arcgis-search>
                {/*
                <arcgis-basemap-toggle 
                  slot="bottom-right" 
                  view="Map"
                ></arcgis-basemap-toggle>
                  */}


              </div>

              {_latitude && _longitude && (
                <>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Site Details</span>
                  <Paragraph>
                    <span style={{ fontStyle: 'italic' }}>Lat/Long: </span>({_latitude ? _latitude.toFixed(5) : ''}, {_longitude ? _longitude.toFixed(5) : ''})
                    <br />
                    <span style={{ fontStyle: 'italic' }}>Ag Water Quality Management Area: </span>{agwqmArea ? agwqmArea : ''}
                    <br />
                    {/*}
                      <span style={{ fontStyle: 'italic' }}>Region: </span>{agwqRegion ? agwqRegion : ''}
                      <br /> */}
                    <span style={{ fontStyle: 'italic' }}>Regional Specialist: </span>{regionalSpecialist ? regionalSpecialist : ''}
                    <br />
                    <span style={{ fontStyle: 'italic' }}>Email: </span>{regionalSpecialistEmail ? regionalSpecialistEmail : ''}
                    <br />
                    <span style={{ fontStyle: 'italic' }}>Phone: </span>{regionalSpecialistPhone ? regionalSpecialistPhone : ''}
                    <br />
                    <span style={{ fontStyle: 'italic' }}>Admin Rules: </span>{adminRulesLink ? <a href={adminRulesLink} target="_blank" rel="noreferrer">Link</a> : ''}
                    <br />
                    <span style={{ fontStyle: 'italic' }}>Area Plan: </span>{areaPlanLink ? <a href={areaPlanLink} target="_blank" rel="noreferrer">Link</a> : ''}
                  </Paragraph>
                </>
              )}
            </Card>

          </Col>

          <Col sm={24} md={12}>
            <Title level={5}>Farm Type</Title>
            <span>Select all that apply from the list below</span>
            <br />
            <Select
              mode="multiple"
              allowClear
              value={selectedCommodities || undefined}
              onChange={(v) => setSelectedCommodities(v)}
              style={{ width: '30em', maxWidth: '100%' }}
              options={commodityOptions}
            />

            <Title level={5}>Site Photos</Title>

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

                      <div style={{ fontSize: '0.8rem', marginTop: 16 }}>
                        <label htmlFor={`description-${photo.url}`}>Photo Description:</label>
                        <TextArea rows={4} 
                                  placeholder="Add a description for this photo" 
                                  value={photo.description} 
                                  onChange={(e) => handleDescriptionChange(photo.url, e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
                        <Popconfirm title="Delete this photo?" onConfirm={() => handleDeletePhoto(photo.url)} okText="Delete" cancelText="Cancel">
                          <Button type="text" size="x-large" danger icon={<DeleteOutlined />} >
                            Delete
                          </Button>
                        </Popconfirm>
                        <Popconfirm title="Save this photo/description?" onConfirm={() => handleSavePhoto(photo.url)} okText="Save" cancelText="Cancel">
                          <Button type="text" size="x-large" icon={<SaveOutlined />} >
                            Save
                          </Button>
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
              destroyOnHidden
            >
              {pendingPhoto ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <img src={pendingPhoto.url} alt={pendingPhoto.name} style={{ width: '100%', maxWidth: 480, borderRadius: 8 }} />
                  <div style={{ fontSize: '0.9rem' }}>{pendingPhoto.name}</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Button type="primary" onClick={confirmAddPendingPhoto}>Add photo</Button>
                    <Button type="default" onClick={cancelPendingPhoto}>Cancel</Button>
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
  userType: PropTypes.string,
  sitesData: PropTypes.array,
  _latitude: PropTypes.number,
  setLatitude: PropTypes.func.isRequired,
  _longitude: PropTypes.number,
  setLongitude: PropTypes.func.isRequired,
  agwqmArea: PropTypes.number,
  setAgwqmArea: PropTypes.func.isRequired,
  agwqRegion: PropTypes.string,
  setAgwqRegion: PropTypes.func.isRequired,
  regionalSpecialist: PropTypes.string,
  setRegionalSpecialist: PropTypes.func.isRequired,
  regionalSpecialistEmail: PropTypes.string,
  setRegionalSpecialistEmail: PropTypes.func.isRequired,
  regionalSpecialistPhone: PropTypes.string,
  setRegionalSpecialistPhone: PropTypes.func.isRequired,
  adminRulesLink: PropTypes.string,
  setAdminRulesLink: PropTypes.func.isRequired,
  areaPlanLink: PropTypes.string,
  setAreaPlanLink: PropTypes.func.isRequired,
};

// Export the component as default
export default StepWhoWhere;
