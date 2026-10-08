import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Card, Col, Input, Radio, Row, Space, Typography, Upload, message } from 'antd';
import { ClearOutlined, EnvironmentOutlined, UploadOutlined } from '@ant-design/icons';
import { GeoJSON, MapContainer, Marker, Polygon, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import SSURGOTable from './SSURGOTable';

import shp from 'shpjs';
import 'leaflet/dist/leaflet.css';

const { Text, Title } = Typography;
const DEFAULT_CENTER = [44.05, -120.55];
const DEFAULT_ZOOM = 7;

const API_BASE = 'https://agwater.org:5556';



function MapViewController({ location }) {
    const map = useMap();

    useEffect(() => {
        if (location) map.setView(location, 14);
    }, [location, map]);

    return null;
}

MapViewController.propTypes = {
    location: PropTypes.arrayOf(PropTypes.number),
};

function MapInteraction({ mode, sketching, onPointSelect, onPolygonPoint }) {
    useMapEvents({
        click(event) {
            if (mode === 'point') onPointSelect([event.latlng.lat, event.latlng.lng]);
            if (mode === 'polygon' && sketching) onPolygonPoint([event.latlng.lat, event.latlng.lng]);
        },
    });

    return null;
}

function SoilGeoJsonLayer({ onError }) {
    const map = useMap();
    const [data, setData] = useState(null);

    const loadSoilData = useCallback(async (mapInstance, signal) => {
        const bounds = mapInstance.getBounds();
        const zoomLevel = mapInstance.getZoom();

        if (zoomLevel < 12) {
            setData(null);
            onError('Zoom in to load SSURGO map units.');
            return;
        }
        const params = new URLSearchParams({
            min_longitude: String(bounds.getWest()),
            min_latitude: String(bounds.getSouth()),
            max_longitude: String(bounds.getEast()),
            max_latitude: String(bounds.getNorth()),
        });

        try {
            const response = await fetch(`${API_BASE}/data/soils/ssurgo/mapunits?${params.toString()}`, { signal });
            if (!response.ok) throw new Error(`SSURGO layer request failed (${response.status}).`);
            const geojson = await response.json();
            if (!signal?.aborted) setData(geojson);
        } catch (fetchError) {
            if (fetchError.name !== 'AbortError') onError(fetchError.message || 'Unable to load SSURGO map units.');
        }
    }, [onError]);

    useEffect(() => {
        const controller = new AbortController();
        loadSoilData(map, controller.signal);
        return () => controller.abort();
    }, [loadSoilData, map]);

    useMapEvents({
        moveend(event) {
            loadSoilData(event.target);
        },
    });

    return data ? <GeoJSON data={data} style={{ color: '#7a4e24', weight: 1, fillColor: '#d6b36a', fillOpacity: 0.25 }} /> : null;
}

SoilGeoJsonLayer.propTypes = {
    onError: PropTypes.func.isRequired,
};

MapInteraction.propTypes = {
    mode: PropTypes.oneOf(['point', 'polygon']).isRequired,
    sketching: PropTypes.bool.isRequired,
    onPointSelect: PropTypes.func.isRequired,
    onPolygonPoint: PropTypes.func.isRequired,
};

function geometryToEdges(geojson) {
    const geometry = geojson?.type === 'FeatureCollection'
        ? geojson.features?.find((feature) => ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type))?.geometry
        : geojson?.type === 'Feature' ? geojson.geometry : geojson;

    if (geometry?.type === 'Polygon') return geometry.coordinates[0].map(([longitude, latitude]) => [latitude, longitude]);
    if (geometry?.type === 'MultiPolygon') return geometry.coordinates[0]?.[0]?.map(([longitude, latitude]) => [latitude, longitude]) || [];
    throw new Error('The file must contain a Polygon or MultiPolygon geometry.');
}

function WqDataMap({ center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM, 
    onGeometryChange, 
    polygonEdges, setPolygonEdges, 
    selectedPoint,setSelectedPoint,
}) {
    const [mode, setMode] = useState('point');
    const [searchedLocation, setSearchedLocation] = useState(null);
    const [sketching, setSketching] = useState(false);
    const [error, setError] = useState('');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        onGeometryChange({
            type: selectedPoint ? 'Point' : polygonEdges && polygonEdges.length > 2 ? 'Polygon' : null,
            point: selectedPoint,
            polygonEdges,
        });
    }, [onGeometryChange, polygonEdges, selectedPoint]);

    const selectMode = (nextMode) => {
        setMode(nextMode);
        setError('');
        if (nextMode === 'point') {
            setPolygonEdges([]);
            setSketching(false);
        } else {
            setSelectedPoint(null);
        }
    };

    const handlePointSelect = (point) => {
        setSelectedPoint(point);
        setError('');
    };

    const handlePolygonPoint = (point) => {
        setPolygonEdges((edges) => [...edges, point]);
        setError('');
    };

    const clearGeometry = () => {
        setSelectedPoint(null);
        setPolygonEdges([]);
        setSketching(false);
        setError('');
    };

    const searchAddress = async (address) => {
        const query = address.trim();
        if (!query) {
            setError('Enter an address to search.');
            return;
        }

        setSearching(true);
        setError('');
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Address search failed.');
            const results = await response.json();
            if (!results.length) throw new Error('No location was found for that address.');

            setSearchedLocation([Number(results[0].lat), Number(results[0].lon)]);
        } catch (searchError) {
            setError(searchError.message || 'Unable to search for that address.');
        } finally {
            setSearching(false);
        }
    };

    const handleFile = async (file) => {
        try {
            setError('');
            const extension = file.name.toLowerCase().split('.').pop();
            let geojson;

            if (extension === 'geojson' || extension === 'json') {
                geojson = JSON.parse(await file.text());
            } else if (extension === 'zip' || extension === 'shp') {
                geojson = await shp(await file.arrayBuffer());
            } else {
                throw new Error('Upload a GeoJSON file or an ESRI shapefile (.shp or .zip).');
            }

            setPolygonEdges(geometryToEdges(geojson));
            setSelectedPoint(null);
            setMode('polygon');
            setSketching(false);
            message.success('Polygon loaded');
        } catch (fileError) {
            setError(fileError.message || 'Unable to read the geometry file.');
            message.error('Unable to load geometry');
        }

        return false;
    };

    return (        
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                <Title level={4}>Select a location or area</Title>
                <Input.Search
                    placeholder="Search for an address or place"
                    enterButton="Search"
                    loading={searching}
                    onSearch={searchAddress}
                    allowClear
                />
                <Radio.Group value={mode} onChange={(event) => selectMode(event.target.value)} optionType="button" buttonStyle="solid">
                    <Radio.Button value="point"><EnvironmentOutlined /> Point</Radio.Button>
                    <Radio.Button value="polygon">Polygon</Radio.Button>
                </Radio.Group>
                {mode === 'polygon' && (
                    <Space wrap>
                        <Button type="primary" onClick={() => setSketching(true)} disabled={sketching}>Start sketch</Button>
                        <Button onClick={() => setSketching(false)} disabled={!sketching || polygonEdges.length < 3}>Finish polygon</Button>
                        <Upload accept=".geojson,.json,.shp,.zip" beforeUpload={handleFile} showUploadList={false}>
                            <Button icon={<UploadOutlined />}>Load GeoJSON / shapefile</Button>
                        </Upload>
                    </Space>
                )}
                <Button icon={<ClearOutlined />} onClick={clearGeometry} disabled={!selectedPoint && polygonEdges && polygonEdges.length === 0}>Clear</Button>
                {error && <Alert type="error" showIcon message={error} />}
                <Text type="secondary">
                    {mode === 'point' ? (selectedPoint ? `Point: ${selectedPoint[0].toFixed(5)}, ${selectedPoint[1].toFixed(5)}` : 'Click the map to select a point.') : `${polygonEdges.length} polygon vertices`}
                </Text>
                <MapContainer center={center} zoom={zoom} style={{ height: 480, width: '100%' }}>
                    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <SoilGeoJsonLayer onError={setError} />
                    <MapViewController location={searchedLocation} />
                    <MapInteraction mode={mode} sketching={sketching} onPointSelect={handlePointSelect} onPolygonPoint={handlePolygonPoint} />
                    {searchedLocation && <Marker position={searchedLocation} />}
                    {selectedPoint && <Marker position={selectedPoint} />}
                    {polygonEdges.length > 0 && <Polyline positions={polygonEdges} color="#1677ff" />}
                    {polygonEdges.length > 2 && <Polygon positions={polygonEdges} pathOptions={{ color: '#1677ff', fillColor: '#69b1ff', fillOpacity: 0.35 }} />}
                </MapContainer>
            </Space>
    );
}


function WqDataDisplay({ selectedPoint, polygonEdges, soilData }) {
    return (
        <Card>
            <Title level={4}>Selected Geometry</Title>
            {selectedPoint && (
                <Text>
                    Point: {selectedPoint[0].toFixed(5)}, {selectedPoint[1].toFixed(5)}
                </Text>
            )}
            {polygonEdges.length > 0 && (
                <Text>
                    Polygon: {polygonEdges.length} vertices
                </Text>
            )}

            <div />
            <Title level={4} style={{ marginTop: 16 }}>Soil Data</Title>
            {soilData ? (
                <SSURGOTable soilData={soilData} />
            ) : (
                <Text>No soil data available for the selected location.</Text>
            )}
        </Card>
    );
}


export default function WqDataMapPanel() {
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [polygonEdges, setPolygonEdges] = useState([]);
    const [soilData, setSoilData] = useState(null);
    
    const onGeometryChange = (geometry) => {
        if (geometry.type === 'Point') {
            setSelectedPoint(geometry.point);

            fetch(`${API_BASE}/data/soils/ssurgo/point?latitude=${geometry.point[0]}&longitude=${geometry.point[1]}`)
                .then((response) => {
                    if (!response.ok) throw new Error(`Soil data request failed (${response.status}).`);
                    return response.json();
                })
                .then(setSoilData)
                .catch((fetchError) => console.error('Error retrieving soil data:', fetchError));
            
        } else if (geometry.type === 'Polygon') {
            setPolygonEdges(geometry.polygonEdges);
        }
    }

    return (
        <>
        <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
                <WqDataMap selectedPoint={selectedPoint} polygonEdges={polygonEdges}
                 setSelectedPoint={setSelectedPoint} setPolygonEdges={setPolygonEdges}
                 onGeometryChange={onGeometryChange} />
            </Col>
            <Col xs={24} md={12}>
                <WqDataDisplay selectedPoint={selectedPoint} polygonEdges={polygonEdges} soilData={soilData} />
            </Col>
        </Row>
        </>
    );
}


WqDataMap.propTypes = {
    center: PropTypes.arrayOf(PropTypes.number),
    zoom: PropTypes.number,
    onGeometryChange: PropTypes.func.isRequired,
    selectedPoint: PropTypes.arrayOf(PropTypes.number),
    polygonEdges: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    setPolygonEdges: PropTypes.func.isRequired,
    setSelectedPoint: PropTypes.func.isRequired,
};

WqDataMap.defaultProps = {
    onGeometryChange: () => {},
};

WqDataDisplay.propTypes = {
    selectedPoint: PropTypes.arrayOf(PropTypes.number),
    polygonEdges: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    soilData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
