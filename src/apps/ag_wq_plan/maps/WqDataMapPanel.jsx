import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Card, Col, Row, Space, Spin, Switch, Typography, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import BasemapToggle from '@arcgis/core/widgets/BasemapToggle';
import Search from '@arcgis/core/widgets/Search';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import '@arcgis/core/assets/esri/themes/light/main.css';

import SSURGOTable from './SSURGOTable';

import shp from 'shpjs';

const { Text, Title, Paragraph } = Typography;
const DEFAULT_CENTER = [44.05, -120.55];
const DEFAULT_ZOOM = 7;

const API_BASE = 'https://agwater.org:5556';



function geometryToEdges(geojson) {
    const geometry = geojson?.type === 'FeatureCollection'
        ? geojson.features?.find((feature) => ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type))?.geometry
        : geojson?.type === 'Feature' ? geojson.geometry : geojson;

    if (geometry?.type === 'Polygon') return geometry.coordinates[0].map(([longitude, latitude]) => [latitude, longitude]);
    if (geometry?.type === 'MultiPolygon') return geometry.coordinates[0]?.[0]?.map(([longitude, latitude]) => [latitude, longitude]) || [];
    throw new Error('The file must contain a Polygon or MultiPolygon geometry.');
}

function kfColor(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return '#9ca3af';
    const normalized = Math.max(0, Math.min(1, numericValue));
    const red = Math.round(34 + (220 - 34) * normalized);
    const green = Math.round(139 - (139 - 38) * normalized);
    const blue = Math.round(34 - 34 * normalized);
    return `rgba(${red}, ${green}, ${blue}, 0.5)`;
}

function featureLabelPoint(geometry) {
    const ring = geometry.type === 'Polygon'
        ? geometry.coordinates[0]
        : geometry.type === 'MultiPolygon' ? geometry.coordinates[0]?.[0] : null;
    if (!ring?.length) return null;

    const total = ring.reduce(([longitudeSum, latitudeSum], [longitude, latitude]) => [
        longitudeSum + longitude,
        latitudeSum + latitude,
    ], [0, 0]);
    return {
        type: 'point',
        longitude: total[0] / ring.length,
        latitude: total[1] / ring.length,
        spatialReference: { wkid: 4326 },
    };
}

function soilGraphics(geojson) {
    const features = geojson?.type === 'FeatureCollection'
        ? geojson.features || []
        : geojson?.type === 'Feature' ? [geojson] : [];

    return features.flatMap((feature) => {
        const geometry = feature.geometry;
        const properties = feature.properties || {};
        if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) return [];

        const fillColor = kfColor(properties.weighted_kf_factor);
        const graphicGeometry = geometry.type === 'Polygon'
            ? { type: 'polygon', rings: geometry.coordinates, spatialReference: { wkid: 4326 } }
            : geometry.coordinates.map((rings) => ({ type: 'polygon', rings, spatialReference: { wkid: 4326 } }));
        const geometries = Array.isArray(graphicGeometry) ? graphicGeometry : [graphicGeometry];
        return geometries.map((item) => new Graphic({
            geometry: item,
            attributes: properties,
            symbol: {
                type: 'simple-fill',
                color: fillColor,
                outline: { color: '#ffffff', width: 0.75 },
            },
        }));
    });
}

function soilLabels(geojson) {
    const features = geojson?.type === 'FeatureCollection'
        ? geojson.features || []
        : geojson?.type === 'Feature' ? [geojson] : [];

    return features.flatMap((feature) => {
        const labelPoint = feature.geometry && featureLabelPoint(feature.geometry);
        const name = feature.properties?.name;
        if (!labelPoint || name === null || name === undefined || name === '') return [];
        return [new Graphic({
            geometry: labelPoint,
            symbol: {
                type: 'text',
                text: String(name),
                color: '#111827',
                haloColor: '#ffffff',
                haloSize: 1.5,
                font: { size: 9, family: 'Arial' },
            },
        })];
    });
}

function createKfLegend() {
    const legend = document.createElement('div');
    legend.style.cssText = 'background:white;padding:10px 12px;border:1px solid #d1d5db;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.25);font:12px Arial,sans-serif;color:#111827;min-width:170px;';
    legend.innerHTML = '<strong>SSURGO K factor</strong><div style="height:12px;margin:6px 0 3px;border:1px solid #9ca3af;background:linear-gradient(to right,#228b22,#b5961f,#dc2626);"></div><div style="display:flex;justify-content:space-between;"><span>0</span><span>0.5</span><span>1</span></div><div style="margin-top:4px;color:#6b7280;">Gray = unavailable</div>';
    return legend;
}

function WqDataMap({ center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM, 
    onGeometryChange, 
    polygonEdges, setPolygonEdges, 
    selectedPoint,setSelectedPoint,
    showMap, setShowMap,
}) {
    const [mode, setMode] = useState('point');
    const [sketching, setSketching] = useState(false);
    const [error, setError] = useState('');
    const [soilLayerVisible, setSoilLayerVisible] = useState(true);
    const [isMapLoading, setIsMapLoading] = useState(false);
    const mapContainerRef = useRef(null);
    const mapViewRef = useRef(null);
    const userLayerRef = useRef(null);
    const soilLayerRef = useRef(null);
    const soilLabelLayerRef = useRef(null);
    const modeRef = useRef(mode);
    const sketchingRef = useRef(sketching);
    const soilRequestRef = useRef(null);

    useEffect(() => {
        modeRef.current = mode;
        sketchingRef.current = sketching;
    }, [mode, sketching]);

    useEffect(() => {
        if (!mapContainerRef.current || mapViewRef.current) return undefined;

        const map = new Map({ basemap: 'streets-vector' });
        const userLayer = new GraphicsLayer({ title: 'Selected geometry' });
        const soilLayer = new GraphicsLayer({ title: 'SSURGO map units' });
        const soilLabelLayer = new GraphicsLayer({ title: 'SSURGO map-unit labels' });
        map.addMany([soilLayer, soilLabelLayer, userLayer]);
        userLayerRef.current = userLayer;
        soilLayerRef.current = soilLayer;
        soilLabelLayerRef.current = soilLabelLayer;

        const view = new MapView({
            container: mapContainerRef.current,
            map,
            center: [center[1], center[0]],
            zoom,
            constraints: { rotationEnabled: false },
        });
        mapViewRef.current = view;

        // query the agwater API for soils data when the map 
        // is clicked or the extent changes
        const loadSoilLayer = async () => {
            const zoomLevel = view.zoom;
            if (zoomLevel < 11) {
                soilLayer.removeAll();
                setIsMapLoading(false);
                setError('Zoom in to load SSURGO map units.');
                return;
            }
            soilRequestRef.current?.abort();
            const controller = new AbortController();
            soilRequestRef.current = controller;
            const extent = view.extent;
            const geographicExtent = extent.spatialReference?.isWebMercator
                ? webMercatorUtils.webMercatorToGeographic(extent)
                : extent;
            const params = new URLSearchParams({
                min_longitude: String(geographicExtent.xmin),
                min_latitude: String(geographicExtent.ymin),
                max_longitude: String(geographicExtent.xmax),
                max_latitude: String(geographicExtent.ymax),
            });
            try {
                setIsMapLoading(true);
                const response = await fetch(`${API_BASE}/data/soils/ssurgo/mapunits?${params}`, { signal: controller.signal });
                if (!response.ok) throw new Error(`SSURGO layer request failed (${response.status}).`);
                const data = await response.json();
                if (controller.signal.aborted) return;
                soilLayer.removeAll();
                soilLabelLayer.removeAll();
                soilLayer.addMany(soilGraphics(data));
                soilLabelLayer.addMany(soilLabels(data));
                setError('');
            } catch (fetchError) {
                if (fetchError.name !== 'AbortError') setError(fetchError.message || 'Unable to load SSURGO map units.');
            } finally {
                if (soilRequestRef.current === controller) {
                    setIsMapLoading(false);
                }
            }
        };

        const clickHandle = view.on('click', (event) => {
            const mapPoint = view.toMap(event);
            if (!mapPoint) return;
            const point = [mapPoint.latitude, mapPoint.longitude];
            if (modeRef.current === 'point') setSelectedPoint(point);
            if (modeRef.current === 'polygon' && sketchingRef.current) setPolygonEdges((edges) => [...edges, point]);
        });
            const extentHandle = reactiveUtils.watch(() => view.stationary, (isStationary) => {
                if (isStationary) loadSoilLayer();
            });
        let searchHandle;
        view.when(() => {
            const searchWidget = new Search({ view });
            searchHandle = searchWidget.on('select-result', (event) => {
                const geometry = event.result?.feature?.geometry;
                const location = geometry?.latitude != null && geometry?.longitude != null
                    ? [geometry.latitude, geometry.longitude]
                    : geometry?.extent?.center
                        ? [geometry.extent.center.latitude, geometry.extent.center.longitude]
                        : null;

                if (location) {
                    setMode('point');
                    setPolygonEdges([]);
                    setSelectedPoint(location);
                    view.goTo({ center: [location[1], location[0]], zoom: 14 });
                }
            });
            view.ui.add(searchWidget, 'top-right');
            view.ui.add(new BasemapToggle({
                view,
                nextBasemap: 'satellite',
            }), 'bottom-left');
            view.ui.add(createKfLegend(), 'bottom-right');
            loadSoilLayer();
        });

        return () => {
            clickHandle.remove();
            extentHandle.remove();
            searchHandle?.remove();
            soilRequestRef.current?.abort();
            view.ui.empty('bottom-left');
            view.destroy();
            mapViewRef.current = null;
            soilLayerRef.current = null;
            soilLabelLayerRef.current = null;
        };
    }, [center, setPolygonEdges, setSelectedPoint, zoom]);

    useEffect(() => {
        if (soilLayerRef.current) soilLayerRef.current.visible = soilLayerVisible;
        if (soilLabelLayerRef.current) soilLabelLayerRef.current.visible = soilLayerVisible;
    }, [soilLayerVisible]);

    useEffect(() => {
        const layer = userLayerRef.current;
        if (!layer) return;
        layer.removeAll();
        if (selectedPoint) layer.add(new Graphic({ geometry: { type: 'point', longitude: selectedPoint[1], latitude: selectedPoint[0] }, symbol: { type: 'simple-marker', color: '#1677ff', size: 10, outline: { color: '#ffffff', width: 1 } } }));
        if (polygonEdges?.length) {
            const paths = polygonEdges.map(([latitude, longitude]) => [longitude, latitude]);
            layer.add(new Graphic({ geometry: { type: 'polyline', paths: [paths], spatialReference: { wkid: 4326 } }, symbol: { type: 'simple-line', color: '#1677ff', width: 2 } }));
            if (polygonEdges.length > 2) layer.add(new Graphic({ geometry: { type: 'polygon', rings: [paths], spatialReference: { wkid: 4326 } }, symbol: { type: 'simple-fill', color: [105, 177, 255, 0.35], outline: { color: '#1677ff', width: 2 } } }));
        }
    }, [polygonEdges, selectedPoint]);

    useEffect(() => {
        onGeometryChange({
            type: selectedPoint ? 'Point' : polygonEdges && polygonEdges.length > 2 ? 'Polygon' : null,
            point: selectedPoint,
            polygonEdges,
        });
    }, [onGeometryChange, polygonEdges, selectedPoint]);

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

    if (!showMap) {
        return (<></>);
    }

    return (        
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                {/*
                <Title level={4}>Select a location or area</Title>
                <Radio.Group value={mode} onChange={(event) => selectMode(event.target.value)} optionType="button" buttonStyle="solid">
                    <Radio.Button value="point"><EnvironmentOutlined /> Point</Radio.Button>
                    <Radio.Button value="polygon">Polygon</Radio.Button>
                </Radio.Group>
 
                <Button icon={<ClearOutlined />} onClick={clearGeometry} disabled={!selectedPoint && polygonEdges && polygonEdges.length === 0}>Clear</Button>
                */}
                
                {mode === 'polygon' && (
                    <Space wrap>
                        <Button type="primary" onClick={() => setSketching(true)} disabled={sketching}>Start sketch</Button>
                        <Button onClick={() => setSketching(false)} disabled={!sketching || polygonEdges.length < 3}>Finish polygon</Button>
                        <Upload accept=".geojson,.json,.shp,.zip" beforeUpload={handleFile} showUploadList={false}>
                            <Button icon={<UploadOutlined />}>Load GeoJSON / shapefile</Button>
                        </Upload>
                    </Space>
                )}

                <br/>
                <Paragraph>
                    The map below shows information from the USDA NRCS SSURGO database 
                    for soils in Oregon. You can tap/click  a point to see soil data for that
                    location.  The map shows the K factor, which is a measure of
                    soil erodibility, with higher values (redder) indicating
                     greater susceptibility to erosion. Note that you must zoom into the map to see 
                     the soil information. 
                </Paragraph>
                {error && <Alert type="error" showIcon message={error} />}

                <Space>
                    <Switch checked={soilLayerVisible} onChange={setSoilLayerVisible} />
                    <Text>Toggle SSURGO soil layer</Text>
                    <Button type='primary' style={{ float:'right' }} onClick={() => setShowMap(false)}>
                        Hide Map
                    </Button>
                </Space>
                <Spin spinning={isMapLoading} tip="Loading soil data...">
                    <div
                        ref={mapContainerRef}
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: 480,
                            overflow: 'hidden',
                        }}
                    />
                </Spin>
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



export default function WqDataMapPanel({currentPlan}) {
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [polygonEdges, setPolygonEdges] = useState([]);
    const [soilData, setSoilData] = useState(null);
    const [showMap, setShowMap] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(false);
    
    const onGeometryChange = useCallback((geometry) => {
        if (geometry.type === 'Point') {
            setSelectedPoint(geometry.point);
            setIsDataLoading(true);

            fetch(`${API_BASE}/data/soils/ssurgo/point?latitude=${geometry.point[0]}&longitude=${geometry.point[1]}`)
                .then((response) => {
                    setIsDataLoading(false);
                    if (!response.ok) throw new Error(`Soil data request failed (${response.status}).`);
                    return response.json();
                })
                .then(setSoilData)
                .catch((fetchError) => console.error('Error retrieving soil data:', fetchError));
            
        } else if (geometry.type === 'Polygon') {
            setPolygonEdges(geometry.polygonEdges);
        } else {
            setSoilData(null);
        }
    }, []);

    return (
        <>
        <Row gutter={16} style={{ marginBottom: 16 }}>
            { showMap && (
              <>
              <Col xs={24} md={12}>
                <WqDataMap selectedPoint={selectedPoint} polygonEdges={polygonEdges}
                 setSelectedPoint={setSelectedPoint} setPolygonEdges={setPolygonEdges}
                 onGeometryChange={onGeometryChange} showMap={showMap} setShowMap={setShowMap}
                 currentPlan={currentPlan} />
            </Col>
            <Col xs={24} md={12}>
                <Spin spinning={isDataLoading} tip="Loading data...">
                    <WqDataDisplay selectedPoint={selectedPoint} polygonEdges={polygonEdges} soilData={soilData} />
                </Spin>
            </Col>
        </> )}
            {!showMap && (
                <>
                <Button type="primary" onClick={() => setShowMap(true)}>
                    Show Map
                </Button>
                <Col xs={24}>
                    <WqDataDisplay selectedPoint={selectedPoint} polygonEdges={polygonEdges} soilData={soilData} />
                </Col>
                </>
            )}

        </Row>
        </>
    );
}

WqDataMapPanel.propTypes = {
};


WqDataMap.propTypes = {
    center: PropTypes.arrayOf(PropTypes.number),
    zoom: PropTypes.number,
    onGeometryChange: PropTypes.func.isRequired,
    selectedPoint: PropTypes.arrayOf(PropTypes.number),
    polygonEdges: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    setPolygonEdges: PropTypes.func.isRequired,
    setSelectedPoint: PropTypes.func.isRequired,
    showMap: PropTypes.bool,
    setShowMap: PropTypes.func.isRequired,
    currentPlan: PropTypes.object,
};

WqDataMap.defaultProps = {
    onGeometryChange: () => {},
};

WqDataDisplay.propTypes = {
    selectedPoint: PropTypes.arrayOf(PropTypes.number),
    polygonEdges: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    soilData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
