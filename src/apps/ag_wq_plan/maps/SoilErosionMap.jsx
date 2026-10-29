import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
	Alert,
	Button,
	Card,
	Col,
	DatePicker,
	Descriptions,
	InputNumber,
	Radio,
	Row,
	Space,
	Spin,
	Table,
	Typography,
} from 'antd';
import { ClearOutlined, EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import Search from '@arcgis/core/widgets/Search';
import '@arcgis/core/assets/esri/themes/light/main.css';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const API_URL = 'https://agwater.org:5556/data/soils/rusle2';
const DEFAULT_CENTER = [44.05, -120.55];
const DEFAULT_ZOOM = 7;
const DEFAULT_VALUES = {
	latitude: 44.564568,
	longitude: -123.262047,
	slope_percent: 5,
	slope_length_m: 100,
	c_factor: 0.2,
	p_factor: 0.5,
	start_date: '2026-01-01',
	end_date: '2026-12-31',
};

function formatNumber(value, digits = 3) {
	return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : 'Unavailable';
}

function polygonToGeoJSON(polygonEdges) {
	const coordinates = polygonEdges.map(([latitude, longitude]) => [longitude, latitude]);
	const firstCoordinate = coordinates[0];
	const lastCoordinate = coordinates[coordinates.length - 1];
	const ringIsClosed = firstCoordinate[0] === lastCoordinate[0]
		&& firstCoordinate[1] === lastCoordinate[1];

	return {
		type: 'Polygon',
		coordinates: [ringIsClosed ? coordinates : [...coordinates, firstCoordinate]],
	};
}

function SoilErosionMap({ center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM }) {
	const [values, setValues] = useState(DEFAULT_VALUES);
	const [result, setResult] = useState(null);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [mode, setMode] = useState('point');
	const [polygonEdges, setPolygonEdges] = useState([]);
	const [isSketching, setIsSketching] = useState(false);
	const mapContainerRef = useRef(null);
	const mapViewRef = useRef(null);
	const modeRef = useRef(mode);
	const isSketchingRef = useRef(isSketching);

	useEffect(() => {
		modeRef.current = mode;
		isSketchingRef.current = isSketching;
	}, [mode, isSketching]);

	useEffect(() => {
		if (!mapContainerRef.current || mapViewRef.current) return undefined;

		const map = new Map({ basemap: 'streets-vector' });
		const view = new MapView({
			container: mapContainerRef.current,
			map,
			center: [center[1], center[0]],
			zoom,
			constraints: { rotationEnabled: false },
		});
		const graphicsLayer = view.graphics;
		mapViewRef.current = view;

		const setPoint = (latitude, longitude) => {
			setValues((current) => ({ ...current, latitude, longitude }));
			setPolygonEdges([]);
			const marker = new Graphic({
				geometry: { type: 'point', latitude, longitude },
				symbol: {
					type: 'simple-marker',
					color: '#1677ff',
					size: 11,
					outline: { color: '#ffffff', width: 1.5 },
				},
			});
			graphicsLayer.removeAll();
			graphicsLayer.add(marker);
		};

		const clickHandle = view.on('click', (event) => {
			const point = view.toMap(event);
			if (!point) return;
			if (modeRef.current === 'point') setPoint(point.latitude, point.longitude);
			if (modeRef.current === 'polygon' && isSketchingRef.current) {
				setPolygonEdges((edges) => [...edges, [point.latitude, point.longitude]]);
			}
		});
		let searchHandle;
		view.when(() => {
			const search = new Search({ view });
			searchHandle = search.on('select-result', (event) => {
				const geometry = event.result?.feature?.geometry;
				const point = geometry?.latitude != null && geometry?.longitude != null
					? geometry
					: geometry?.extent?.center;
				if (point) {
					setMode('point');
					setIsSketching(false);
					setPoint(point.latitude, point.longitude);
				}
			});
			view.ui.add(search, 'top-right');
		});

		return () => {
			clickHandle.remove();
			searchHandle?.remove();
			view.destroy();
			mapViewRef.current = null;
		};
	}, [center, zoom]);

	useEffect(() => {
		const view = mapViewRef.current;
		if (!view) return;

		view.graphics.removeAll();
		if (mode === 'point' && values.latitude != null && values.longitude != null) {
			view.graphics.add(new Graphic({
				geometry: { type: 'point', latitude: values.latitude, longitude: values.longitude },
				symbol: {
					type: 'simple-marker',
					color: '#1677ff',
					size: 11,
					outline: { color: '#ffffff', width: 1.5 },
				},
			}));
		}
		if (mode === 'polygon' && polygonEdges.length > 0) {
			const paths = polygonEdges.map(([latitude, longitude]) => [longitude, latitude]);
			view.graphics.add(new Graphic({
				geometry: { type: 'polyline', paths: [paths], spatialReference: { wkid: 4326 } },
				symbol: { type: 'simple-line', color: '#1677ff', width: 2 },
			}));
			if (polygonEdges.length > 2 && !isSketching) {
				view.graphics.add(new Graphic({
					geometry: { type: 'polygon', rings: [paths], spatialReference: { wkid: 4326 } },
					symbol: { type: 'simple-fill', color: [105, 177, 255, 0.35], outline: { color: '#1677ff', width: 2 } },
				}));
			}
		}
	}, [isSketching, mode, polygonEdges, values.latitude, values.longitude]);

	const updateValue = (name) => (value) => {
		setValues((current) => ({ ...current, [name]: value }));
	};

	const submit = async () => {
		if (mode === 'point' && (values.latitude == null || values.longitude == null)) {
			setError('Select a point on the map or enter both latitude and longitude.');
			return;
		}
		if (mode === 'polygon' && polygonEdges.length < 3) {
			setError('Add at least three vertices to define a polygon.');
			return;
		}
		setError('');
		setResult(null);
		setIsLoading(true);
		try {
			const requestBody = mode === 'polygon'
				? {
					...values,
					field_aoi: polygonToGeoJSON(polygonEdges),
				}
				: values;
			if (mode === 'polygon') {
				delete requestBody.latitude;
				delete requestBody.longitude;
			}
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
			});
			if (!response.ok) throw new Error(`RUSLE2 request failed (${response.status}).`);
			setResult(await response.json());
		} catch (requestError) {
			setError(requestError.message || 'Unable to calculate soil erosion.');
		} finally {
			setIsLoading(false);
		}
	};

	const selectMode = (nextMode) => {
		setMode(nextMode);
		setIsSketching(false);
		setResult(null);
		setError('');
		if (nextMode === 'point') setPolygonEdges([]);
	};

	const clearGeometry = () => {
		setPolygonEdges([]);
		setIsSketching(false);
		if (mode === 'point') {
			setValues((current) => ({ ...current, latitude: null, longitude: null }));
		}
		setResult(null);
		setError('');
	};

	const mapunits = result?.soil?.mapunits || [];
	const componentColumns = [
		{ title: 'Name', dataIndex: 'name', key: 'name' },
		{ title: 'Component %', dataIndex: 'component_percent', key: 'component_percent' },
		{ title: 'K factor', dataIndex: 'k_factor', key: 'k_factor', render: (value) => formatNumber(value, 2) },
		{ title: 'Hydrologic group', dataIndex: 'hydrologic_soil_group', key: 'hydrologic_soil_group' },
		{ title: 'Hydric rating', dataIndex: 'hydric_rating', key: 'hydric_rating' },
	];

	return (
		<Space direction="vertical" size="middle" style={{ display: 'flex' }}>
			<Title level={4}>RUSLE2 soil erosion estimate</Title>
			<Text type="secondary">Choose a point or sketch a polygon on the map, then enter the field conditions.</Text>
			<Space wrap>
				<Radio.Group value={mode} onChange={(event) => selectMode(event.target.value)} optionType="button" buttonStyle="solid">
					<Radio.Button value="point"><EnvironmentOutlined /> Point</Radio.Button>
					<Radio.Button value="polygon">Polygon</Radio.Button>
				</Radio.Group>
				<Button icon={<ClearOutlined />} onClick={clearGeometry} disabled={mode === 'point' ? values.latitude == null || values.longitude == null : polygonEdges.length === 0}>Clear</Button>
				{mode === 'polygon' && <>
					<Button type="primary" onClick={() => setIsSketching(true)} disabled={isSketching}>Start sketch</Button>
					<Button onClick={() => setIsSketching(false)} disabled={!isSketching || polygonEdges.length < 3}>Finish polygon</Button>
				</>}
			</Space>
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={11}>
					<div ref={mapContainerRef} style={{ width: '100%', height: 420 }} />
				</Col>
				<Col xs={24} lg={13}>
					<Card size="small" title={<><EnvironmentOutlined /> Location and field inputs</>}>
						<Row gutter={[12, 12]}>
							{mode === 'point' && <>
								<Col span={12}><InputNumber style={{ width: '100%' }} addonBefore="Lat" value={values.latitude} onChange={updateValue('latitude')} /></Col>
								<Col span={12}><InputNumber style={{ width: '100%' }} addonBefore="Lon" value={values.longitude} onChange={updateValue('longitude')} /></Col>
							</>}
							<Col span={12}><InputNumber style={{ width: '100%' }} addonBefore="Slope %" min={0} value={values.slope_percent} onChange={updateValue('slope_percent')} /></Col>
							<Col span={12}><InputNumber style={{ width: '100%' }} addonBefore="Length m" min={0} value={values.slope_length_m} onChange={updateValue('slope_length_m')} /></Col>
							<Col span={12}><InputNumber style={{ width: '100%' }} addonBefore="C factor" min={0} max={1} step={0.01} value={values.c_factor} onChange={updateValue('c_factor')} /></Col>
							<Col span={12}><InputNumber style={{ width: '100%' }} addonBefore="P factor" min={0} max={1} step={0.01} value={values.p_factor} onChange={updateValue('p_factor')} /></Col>
							<Col span={12}><DatePicker style={{ width: '100%' }} value={values.start_date ? dayjs(values.start_date) : null} onChange={(date) => updateValue('start_date')(date?.format('YYYY-MM-DD'))} /></Col>
							<Col span={12}><DatePicker style={{ width: '100%' }} value={values.end_date ? dayjs(values.end_date) : null} onChange={(date) => updateValue('end_date')(date?.format('YYYY-MM-DD'))} /></Col>
						</Row>
						{mode === 'polygon' && <Text type="secondary">{polygonEdges.length} polygon vertices selected.</Text>}
						<Button type="primary" icon={<SearchOutlined />} onClick={submit} loading={isLoading} style={{ marginTop: 16 }}>
							Calculate erosion
						</Button>
					</Card>
				</Col>
			</Row>
			{error && <Alert type="error" showIcon message={error} />}
			{isLoading && <Spin tip="Calculating erosion..." />}
			{result && (
				<Card title="RUSLE2 result">
					<Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 4 }}>
						<Descriptions.Item label="Annual soil loss (A)">{formatNumber(result.rusle?.A)} t/ha/year</Descriptions.Item>
						<Descriptions.Item label="Rainfall erosivity (R)">{formatNumber(result.rusle?.R)}</Descriptions.Item>
						<Descriptions.Item label="Soil erodibility (K)">{formatNumber(result.rusle?.K)}</Descriptions.Item>
						<Descriptions.Item label="Slope factors (L / S)">{formatNumber(result.rusle?.L)} / {formatNumber(result.rusle?.S)}</Descriptions.Item>
						<Descriptions.Item label="Field-weighted K">{formatNumber(result.soil?.field_weighted_k)}</Descriptions.Item>
						<Descriptions.Item label="Map units">{result.soil?.mapunit_count ?? 0}</Descriptions.Item>
						<Descriptions.Item label="Centroid">{result.location?.centroid?.latitude}, {result.location?.centroid?.longitude}</Descriptions.Item>
						<Descriptions.Item label="Period">{result.period?.start_date} to {result.period?.end_date}</Descriptions.Item>
					</Descriptions>
					{mapunits.map((mapunit) => (
						<Card key={mapunit.mukey} size="small" title={`Map unit ${mapunit.musym ?? mapunit.mukey}`} style={{ marginTop: 16 }}>
							<Text>Intersection area: {formatNumber(mapunit.intersection_area_m2, 1)} m²; weighted K: {formatNumber(mapunit.component_weighted_k)}</Text>
							<Table rowKey="cokey" columns={componentColumns} dataSource={mapunit.components || []} pagination={false} size="small" style={{ marginTop: 12 }} />
						</Card>
					))}
				</Card>
			)}
		</Space>
	);
}

SoilErosionMap.propTypes = {
	center: PropTypes.arrayOf(PropTypes.number),
	zoom: PropTypes.number,
};

export default SoilErosionMap;
