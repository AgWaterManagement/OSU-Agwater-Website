import { useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import PropTypes from 'prop-types';
import {
	Alert,
	Button,
	Card,
	Collapse,
	Col,
	Divider,
	Input,
	InputNumber,
	List,
	Row,
	Segmented,
	Select,
	Space,
	Statistic,
	Typography,
	Tabs,
} from 'antd';

import {
	InfoCircleOutlined,
	PrinterOutlined,
	RightOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text, Link } = Typography;

const soilPresets = {
	sand: { name: 'Sand', fieldCapacity: 12, wiltingPoint: 5 },
	loamySand: { name: 'Loamy sand', fieldCapacity: 15, wiltingPoint: 7 },
	sandyLoam: { name: 'Sandy loam', fieldCapacity: 23, wiltingPoint: 11 },
	loam: { name: 'Loam', fieldCapacity: 27, wiltingPoint: 12 },
	siltLoam: { name: 'Silt loam', fieldCapacity: 29, wiltingPoint: 15 },
	silt: { name: 'Silt', fieldCapacity: 32, wiltingPoint: 17 },
	sandyClayLoam: { name: 'Sandy clay loam', fieldCapacity: 27, wiltingPoint: 17 },
	clayLoam: { name: 'Clay loam', fieldCapacity: 34, wiltingPoint: 18 },
	siltyClayLoam: { name: 'Silty clay loam', fieldCapacity: 36, wiltingPoint: 21 },
	siltyClay: { name: 'Silty clay', fieldCapacity: 38, wiltingPoint: 24 },
	clay: { name: 'Clay', fieldCapacity: 40, wiltingPoint: 27 },
};

const fieldGuides = [
	{
		id: 'flow',
		number: '01',
		title: 'Timed volume',
		bestFor: 'Outlets, emitters, and small pipe discharge',
		kit: 'Calibrated container · stopwatch · field sheet',
		steps: [
			'Choose a safe collection point with steady flow.',
			'Time a complete fill without estimating partial seconds.',
			'Repeat at least three times and average the discharge.',
		],
	},
	{
		id: 'depth',
		number: '02',
		title: 'Flow × runtime',
		bestFor: 'Average depth applied over a known field area',
		kit: 'Flow measurement · runtime record · field area',
		steps: [
			'Confirm the flow represents the entire operating set.',
			'Use the actual wetted area, not the parcel area.',
			'Report gross depth and document the efficiency assumption.',
		],
	},
	{
		id: 'uniformity',
		number: '03',
		title: 'Catch-can test',
		bestFor: 'Sprinkler distribution and low-quarter performance',
		kit: 'Matched cans · ruler · flags · wind reading',
		steps: [
			'Place identical cans on a regular grid before startup.',
			'Run long enough to obtain clearly measurable depths.',
			'Flag plugged nozzles, wind shifts, or spills in the record.',
		],
	},
	{
		id: 'soil',
		number: '04',
		title: 'Root-zone deficit',
		bestFor: 'Scheduling a refill from volumetric water content',
		kit: 'Calibrated sensor · root-depth estimate · soil limits',
		steps: [
			'Sample more than one location and depth.',
			'Use site-specific field capacity when available.',
			'Limit refill to the active root zone and system capacity.',
		],
	},
];

const conversionCards = [
	{ label: '1 acre-inch', value: '27,154', unit: 'US gallons' },
	{ label: '1 cubic foot/sec', value: '448.8', unit: 'US gpm' },
	{ label: '1 US gpm', value: '0.0631', unit: 'liters/sec' },
	{ label: '1 inch', value: '25.4', unit: 'millimeters' },
];

const referenceItems = [
	{
		text: 'Allen, R. G., Pereira, L. S., Raes, D., & Smith, M. (1998). Crop evapotranspiration: Guidelines for computing crop water requirements. FAO Irrigation and Drainage Paper 56.',
		href: 'https://www.fao.org/4/x0490e/x0490e00.htm',
		label: 'FAO publication',
	},
	{
		text: 'Burt, C. M., Clemmens, A. J., Strelkoff, T. S., Solomon, K. H., Bliesner, R. D., Hardy, L. A., Howell, T. A., & Eisenhauer, D. E. (1997). Irrigation performance measures: Efficiency and uniformity.',
		href: 'https://doi.org/10.1061/(ASCE)0733-9437(1997)123:6(423)',
		label: 'Journal article',
	},
	{
		text: 'Christiansen, J. E. (1942). Irrigation by sprinkling. California Agricultural Experiment Station Bulletin 670.',
		href: 'https://archive.org/details/irrigationbyspri670chri',
		label: 'Digital copy',
	},
	{
		text: 'Merriam, J. L., & Keller, J. (1978). Farm irrigation system evaluation: A guide for management.',
		href: 'https://digitalcommons.usu.edu/cee_facpub/3779/',
		label: 'USU record',
	},
	{
		text: 'Oregon State University Extension Service. Efficient irrigation of perennial forages with wheel lines in the Pacific Northwest (EM 9399).',
		href: 'https://extension.oregonstate.edu/catalog/em-9399-efficient-irrigation-perennial-forages-wheel-lines-pacific-northwest',
		label: 'OSU Extension',
	},
	{
		text: 'USDA Natural Resources Conservation Service. National Engineering Handbook, Part 623, Chapter 9: Water Measurement.',
		href: 'https://www.wcc.nrcs.usda.gov/ftpref/wntsc/waterMgt/irrigation/NEH15/ch9.pdf',
		label: 'NRCS handbook',
	},
	{
		text: 'USDA Natural Resources Conservation Service. National Engineering Handbook, Part 652: Irrigation Guide.',
		href: 'https://www.nrcs.usda.gov/sites/default/files/2022-11/WA-Irrigation-Guide_4.pdf',
		label: 'NRCS guide',
	},
	{
		text: 'U.S. Department of the Interior, Bureau of Reclamation. Water Measurement Manual (3rd ed., revised reprint).',
		href: 'https://www.usbr.gov/tsc/techreferences/mands/wmm/WMM_3rd_2001.pdf',
		label: 'USBR manual',
	},
];

const formatNumber = (value, digits = 2) => (Number.isFinite(value) ? value.toFixed(digits) : (0).toFixed(digits));
const parseList = (text, minValue = 0) => text
	.split(/[\s,;]+/)
	.map((item) => Number(item))
	.filter((value) => Number.isFinite(value) && value >= minValue);

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const asNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0);

const renderCatchBars = (values) => {
	if (!values.length) {
		return <Text type="secondary">No valid catch-can observations yet.</Text>;
	}

	const maxValue = Math.max(...values, 1);
	return (
		<div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 96, padding: 12, background: 'var(--off-white, #f5f5f5)', borderRadius: 8 }}>
			{values.map((value, index) => (
				<div
					key={`${index}-${value}`}
					title={`Catch ${index + 1}: ${value}`}
					style={{
						flex: 1,
						minWidth: 10,
						height: `${Math.max((value / maxValue) * 100, 5)}%`,
						background: 'var(--orange, #d73f09)',
						borderRadius: '4px 4px 0 0',
						opacity: 0.78,
					}}
				/>
			))}
		</div>
	);
};

const FlowCalculatorPanel = ({ units, volume, setVolume, fillTimes, setFillTimes }) => (
	<section id="tool-panel-flow" role="tabpanel" aria-labelledby="tool-tab-flow" hidden={false}>
		<Title level={4} id="tool-panel-flow-title">Timed-volume Pump Discharge</Title>
		<Paragraph>
			Collect water in a container of known volume and time each fill. Enter one fill time per trial; the calculator averages the trial discharges.
		</Paragraph>
		<Text strong style={{ display: 'block', marginBottom: 4 }}>COLLECTED VOLUME</Text>
		<InputNumber
			value={volume}
			onChange={(value) => setVolume(value)}
			addonAfter={units === 'us' ? 'gal' : 'L'}
			style={{ width: '8em' }}
		/>
		<br />
		<Text strong style={{ display: 'block', marginTop: 12, marginBottom: 4 }}>FILL TIMES (ONE PER TRIAL)</Text>
		<Input
			value={fillTimes}
			onChange={(event) => setFillTimes(event.target.value)}
			placeholder="18, 17.5, 18.4"
		/>
		<Alert type="info" showIcon message="Separate trial times with commas. Repeat at least three trials for a reliable average." />
		<Divider style={{ margin: '4px 0' }} />
		<Space direction="vertical" size={4}>
			<Text>Formula</Text>
			<Text code>Q = volume ÷ time, averaged across trials</Text>
		</Space>
	</section>
);

FlowCalculatorPanel.propTypes = {
	units: PropTypes.string.isRequired,
	volume: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	setVolume: PropTypes.func.isRequired,
	fillTimes: PropTypes.string.isRequired,
	setFillTimes: PropTypes.func.isRequired,
};

const DepthCalculatorPanel = ({ units, systemFlow, setSystemFlow, area, setArea, runtime, setRuntime, efficiency, setEfficiency }) => (
	<section id="tool-panel-depth" role="tabpanel" aria-labelledby="tool-tab-depth" hidden={false}>
		<Title level={4} id="tool-panel-depth-title">Applied Irrigation Depth</Title>
		<Paragraph>Convert system flow and runtime to an average depth over the irrigated area.</Paragraph>
		<Row gutter={16}>
			<Col xs={24} sm={12}>
				<Text strong style={{ display: 'block', marginBottom: 6 }}>System flow</Text>
				<InputNumber value={systemFlow} onChange={(value) => setSystemFlow(value)} inputMode="decimal" addonAfter={units === 'us' ? 'gpm' : 'L/s'} style={{ width: '10em', marginBottom: 16 }} />
			</Col>
			<Col xs={24} sm={12}>
				<Text strong style={{ display: 'block', marginBottom: 6 }}>Irrigated area</Text>
				<InputNumber value={area} onChange={(value) => setArea(value)} inputMode="decimal" addonAfter={units === 'us' ? 'ac' : 'ha'} style={{ width: '10em', marginBottom: 16 }} />
			</Col>
			<Col xs={24} sm={12}>
				<Text strong style={{ display: 'block', marginBottom: 6 }}>Runtime</Text>
				<InputNumber value={runtime} onChange={(value) => setRuntime(value)} inputMode="decimal" addonAfter="hr" style={{ width: '10em', marginBottom: 16 }} />
			</Col>
			<Col xs={24} sm={12}>
				<Text strong style={{ display: 'block', marginBottom: 6 }}>Application efficiency</Text>
				<InputNumber value={efficiency} onChange={(value) => setEfficiency(value)} inputMode="decimal" addonAfter="%" style={{ width: '10em', marginBottom: 16 }} />
			</Col>
		</Row>
		<br />
		<Alert type="info" showIcon message="Use a measured efficiency when available." />
		<Divider style={{ margin: '4px 0' }} />
		<Space direction="vertical" size={4}>
			<Text type="secondary">Method</Text>
			<Text code>depth = applied volume ÷ irrigated area</Text>
		</Space>
	</section>
);

DepthCalculatorPanel.propTypes = {
	units: PropTypes.string.isRequired,
	systemFlow: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	setSystemFlow: PropTypes.func.isRequired,
	area: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	setArea: PropTypes.func.isRequired,
	runtime: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	setRuntime: PropTypes.func.isRequired,
	efficiency: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	setEfficiency: PropTypes.func.isRequired,
};

const UniformityCalculatorPanel = ({ catches, setCatches, uniformityResult }) => (
	<section id="tool-panel-uniformity" role="tabpanel" aria-labelledby="tool-tab-uniformity" hidden={false}>
		<Title level={4} id="tool-panel-uniformity-title">Catch-can Uniformity</Title>
		<Paragraph>Paste catch depths to calculate low-quarter distribution uniformity and Christiansen CU.</Paragraph>
		<Text strong>Catch-can observations</Text>
		<Input.TextArea
			rows={2}
			value={catches}
			onChange={(event) => setCatches(event.target.value)}
			placeholder="18, 21, 17, 22, 20, 16"
		/>
		<Alert type="info" showIcon message="Separate values with commas, spaces, or line breaks. Keep all observations in the same unit." />
		{renderCatchBars(uniformityResult.values)}
		<Text type="secondary" aria-live="polite" style={{ display: 'block', marginTop: 8 }}>
			{uniformityResult.values.length > 0
				? `Entered ${uniformityResult.values.length} catch observations. Lowest value ${Math.min(...uniformityResult.values)} and highest value ${Math.max(...uniformityResult.values)}.`
				: 'No catch observations entered.'}
		</Text>
		<Divider style={{ margin: '4px 0' }} />
		<Space direction="vertical" size={4}>
			<Text type="secondary">Formula</Text>
			<Text code>DUlq = low-quarter mean ÷ overall mean</Text>
		</Space>
	</section>
);

UniformityCalculatorPanel.propTypes = {
	catches: PropTypes.string.isRequired,
	setCatches: PropTypes.func.isRequired,
	uniformityResult: PropTypes.shape({
		values: PropTypes.arrayOf(PropTypes.number).isRequired,
		average: PropTypes.number.isRequired,
		du: PropTypes.number.isRequired,
		cu: PropTypes.number.isRequired,
	}).isRequired,
};

const SoilWaterCalculatorPanel = ({
	units,
	soilPreset,
	setSoilPreset,
	fieldCapacity,
	setFieldCapacity,
	wiltingPoint,
	setWiltingPoint,
	currentVwc,
	setCurrentVwc,
	rootDepth,
	setRootDepth,
	soilEfficiency,
	setSoilEfficiency,
}) => (
	<section id="tool-panel-soil" role="tabpanel" aria-labelledby="tool-tab-soil" hidden={false}>
		<Title level={4} id="tool-panel-soil-title">Root Zone Soil-Water Deficit</Title>
		<Paragraph>Estimate the refill needed to return the active root zone to field capacity.</Paragraph>
		<Row gutter={12}>
			<Col xs={24}>
				<Text strong style={{ display: 'block', marginBottom: 6 }}>Texture preset</Text>
				<Select
					value={soilPreset}
					onChange={(value) => setSoilPreset(value)}
					style={{ width: '100%' }}
					options={Object.entries(soilPresets).map(([value, preset]) => ({ value, label: preset.name }))}
				/>
				<Text type="secondary" style={{ display: 'block', marginTop: 6, marginBottom: 12 }}>
					Typical values by USDA texture class. Use site-specific soil data when available.
				</Text>
			</Col>
			<Col xs={24} sm={12}>
				<Text strong style={{ display: 'block', marginBottom: 6 }}>Field capacity</Text>
				<InputNumber value={fieldCapacity} onChange={(value) => setFieldCapacity(value)} inputMode="decimal" addonAfter="% VWC" style={{ width: '10em', marginBottom: 16 }} />
			</Col>
			<Col xs={24} sm={12}>
				<Text strong style={{ display: 'block', marginBottom: 6 }}>Wilting point</Text>
				<InputNumber value={wiltingPoint} onChange={(value) => setWiltingPoint(value)} inputMode="decimal" addonAfter="% VWC" style={{ width: '10em', marginBottom: 16 }} />
			</Col>
			<Col xs={24} sm={12}>
				<Text strong style={{ display: 'block', marginBottom: 6 }}>Current water content</Text>
				<InputNumber value={currentVwc} onChange={(value) => setCurrentVwc(value)} inputMode="decimal" addonAfter="% VWC" style={{ width: '10em', marginBottom: 16 }} />
			</Col>
			<Col xs={24} sm={12}>
				<Text strong style={{ display: 'block', marginBottom: 6 }}>Active root depth</Text>
				<InputNumber value={rootDepth} onChange={(value) => setRootDepth(value)} inputMode="decimal" addonAfter={units === 'us' ? 'in' : 'cm'} style={{ width: '10em', marginBottom: 16 }} />
			</Col>
			<Col xs={24} sm={12}>
				<Text strong style={{ display: 'block', marginBottom: 6 }}>Application efficiency</Text>
				<InputNumber value={soilEfficiency} onChange={(value) => setSoilEfficiency(value)} inputMode="decimal" addonAfter="%" style={{ width: '10em', marginBottom: 16 }} />
			</Col>
		</Row>
		<Alert type="warning" showIcon message="Texture presets are starting values. Calibrate with field measurements." />
		<Divider style={{ margin: '4px 0' }} />
		<Space direction="vertical" size={4}>
			<Text type="secondary">Formula</Text>
			<Text code>deficit = (θfc - θv) x root depth</Text>
		</Space>
	</section>
);

SoilWaterCalculatorPanel.propTypes = {
	units: PropTypes.string.isRequired,
	soilPreset: PropTypes.string.isRequired,
	setSoilPreset: PropTypes.func.isRequired,
	fieldCapacity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	setFieldCapacity: PropTypes.func.isRequired,
	wiltingPoint: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	setWiltingPoint: PropTypes.func.isRequired,
	currentVwc: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	setCurrentVwc: PropTypes.func.isRequired,
	rootDepth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	setRootDepth: PropTypes.func.isRequired,
	soilEfficiency: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	setSoilEfficiency: PropTypes.func.isRequired,
};

const IrrigationMeasurement = () => {
	const [units, setUnits] = useState('us');
	const [activeTool, setActiveTool] = useState('flow');
	const [openGuide, setOpenGuide] = useState('flow');

	const [volume, setVolume] = useState(5);
	const [fillTimes, setFillTimes] = useState('18, 17.5, 18.4');

	const [systemFlow, setSystemFlow] = useState(620);
	const [area, setArea] = useState(18);
	const [runtime, setRuntime] = useState(8);
	const [efficiency, setEfficiency] = useState(82);

	const [catches, setCatches] = useState('18, 21, 17, 22, 20, 16, 23, 19, 21, 18, 20, 17');

	const [soilPreset, setSoilPreset] = useState('loam');
	const [fieldCapacity, setFieldCapacity] = useState(27);
	const [wiltingPoint, setWiltingPoint] = useState(12);
	const [currentVwc, setCurrentVwc] = useState(19);
	const [rootDepth, setRootDepth] = useState(24);
	const [soilEfficiency, setSoilEfficiency] = useState(85);

	useEffect(() => {
		const preset = soilPresets[soilPreset];
		if (preset) {
			setFieldCapacity(preset.fieldCapacity);
			setWiltingPoint(preset.wiltingPoint);
		}
	}, [soilPreset]);

	const switchUnits = (nextUnits) => {
		if (nextUnits === units) {
			return;
		}

		if (nextUnits === 'metric') {
			setVolume((current) => asNumber(current) * 3.78541);
			setSystemFlow((current) => asNumber(current) * 0.0630902);
			setArea((current) => asNumber(current) * 0.404686);
			setRootDepth((current) => asNumber(current) * 2.54);
		} else {
			setVolume((current) => asNumber(current) / 3.78541);
			setSystemFlow((current) => asNumber(current) / 0.0630902);
			setArea((current) => asNumber(current) / 0.404686);
			setRootDepth((current) => asNumber(current) / 2.54);
		}

		setUnits(nextUnits);
	};

	const calcFlow = () => {
		const trials = parseList(fillTimes, 0).filter((value) => value > 0);
		const collectedVolume = asNumber(volume);
		if (!trials.length || collectedVolume <= 0) {
			return { trials: trials.length, primary: 0, secondary: 0, primaryUnit: units === 'us' ? 'gpm' : 'L/s', secondaryUnit: units === 'us' ? 'L/s' : 'gpm' };
		}

		const meanQ = trials.reduce((sum, time) => sum + collectedVolume / time, 0) / trials.length;

		if (units === 'us') {
			const gpm = meanQ * 60;
			return {
				trials: trials.length,
				primary: gpm,
				primaryUnit: 'gpm',
				secondary: gpm * 0.0630902,
				secondaryUnit: 'L/s',
			};
		}

		return {
			trials: trials.length,
			primary: meanQ,
			primaryUnit: 'L/s',
			secondary: meanQ * 15.8503,
			secondaryUnit: 'gpm',
		};
	};

	const calcDepth = () => {
		const grossArea = Math.max(asNumber(area), 0.001);
		const eff = clamp01(asNumber(efficiency) / 100);

		if (units === 'us') {
			const gallons = asNumber(systemFlow) * asNumber(runtime) * 60;
			const gross = gallons / (grossArea * 27154);
			return {
				volume: gallons / 1000,
				volumeUnit: 'thousand gal',
				gross,
				net: gross * eff,
				depthUnit: 'in',
				effPct: eff * 100,
			};
		}

		const cubicMeters = asNumber(systemFlow) * asNumber(runtime) * 3.6;
		const gross = cubicMeters / (grossArea * 10);
		return {
			volume: cubicMeters,
			volumeUnit: 'm³',
			gross,
			net: gross * eff,
			depthUnit: 'mm',
			effPct: eff * 100,
		};
	};

	const calcUniformity = () => {
		const values = parseList(catches, 0);
		if (!values.length) {
			return { values: [], average: 0, du: 0, cu: 0 };
		}

		const average = values.reduce((sum, value) => sum + value, 0) / values.length;
		const sorted = [...values].sort((a, b) => a - b);
		const lowCount = Math.max(1, Math.floor(values.length / 4));
		const lowQuarter = sorted.slice(0, lowCount).reduce((sum, value) => sum + value, 0) / lowCount;
		const meanDev = values.reduce((sum, value) => sum + Math.abs(value - average), 0) / values.length;

		return {
			values,
			average,
			du: average > 0 ? (lowQuarter / average) * 100 : 0,
			cu: average > 0 ? (1 - meanDev / average) * 100 : 0,
		};
	};

	const calcSoil = () => {
		const eff = Math.max(asNumber(soilEfficiency) / 100, 0.01);
		const depthIn = units === 'us' ? asNumber(rootDepth) : asNumber(rootDepth) / 2.54;
		const fc = asNumber(fieldCapacity);
		const wp = asNumber(wiltingPoint);
		const current = asNumber(currentVwc);
		const target = Math.max(fc - current, 0) / 100;
		const available = Math.max(fc - wp, 0) / 100;
		const deficitIn = target * depthIn;
		const grossIn = deficitIn / eff;
		const depletion = available > 0 ? clamp01((fc - current) / (fc - wp)) * 100 : 0;

		return {
			net: units === 'us' ? deficitIn : deficitIn * 25.4,
			gross: units === 'us' ? grossIn : grossIn * 25.4,
			depletion,
			unit: units === 'us' ? 'in' : 'mm',
		};
	};

	const flowResult = calcFlow();
	const depthResult = calcDepth();
	const uniformityResult = calcUniformity();
	const soilResult = calcSoil();

	const unitLabel = units === 'us' ? 'US units' : 'Metric Units';

	const resultsPanel = (() => {
		if (activeTool === 'flow') {
			return (<>
				<Statistic title="Estimated discharge" value={formatNumber(flowResult.primary, 2)} suffix={flowResult.primaryUnit} />
				<Divider size="small" />
				<Statistic title="Converted flow" value={formatNumber(flowResult.secondary, 2)} suffix={flowResult.secondaryUnit} />
				<Alert type="success" showIcon message={`Average of ${flowResult.trials} trial${flowResult.trials === 1 ? '' : 's'}. Use at least three replicate fills for scheduling.`} />
				</>
			);
		}

		if (activeTool === 'depth') {
			return (<>
				<Statistic title="Net applied depth" value={formatNumber(depthResult.net, 2)} suffix={depthResult.depthUnit} />
				<Divider size="small" />
				<Row gutter={12}>
					<Col span={12}>
						<Statistic title="Gross depth" value={formatNumber(depthResult.gross, 2)} suffix={depthResult.depthUnit} />
					</Col>
					<Col span={12}>
						<Statistic title="Applied volume" value={formatNumber(depthResult.volume, 1)} suffix={depthResult.volumeUnit} />
					</Col>
				</Row>
				<Alert type="info" showIcon message={`Net depth accounts for ${formatNumber(depthResult.effPct, 0)}% application efficiency.`} />
			</>);
		}

		if (activeTool === 'uniformity') {
			return (<>
				<Title level={4}>Uniformity Results</Title>
				<Statistic title="Low-quarter DU" value={formatNumber(uniformityResult.du, 0)} suffix="%" />
				<Divider size="small" />
				<Row gutter={12}>
					<Col span={12}>
						<Statistic title="Christiansen CU" value={formatNumber(uniformityResult.cu, 0)} suffix="%" />
					</Col>
					<Col span={12}>
						<Statistic title="Mean catch" value={formatNumber(uniformityResult.average, 1)} suffix="depth units" />
					</Col>
				</Row>
				<Alert type="info" showIcon message={`Based on ${uniformityResult.values.length} valid catch observation${uniformityResult.values.length === 1 ? '' : 's'}.`} />
			</>
			);
		}

		return (<>
			<Statistic title="Gross refill depth" value={formatNumber(soilResult.gross, 2)} suffix={soilResult.unit} />
			<Divider size="small" />
			<Row gutter={12}>
				<Col span={12}>
					<Statistic title="Net deficit" value={formatNumber(soilResult.net, 2)} suffix={soilResult.unit} />
				</Col>
				<Col span={12}>
					<Statistic title="Available water depleted" value={formatNumber(soilResult.depletion, 0)} suffix="%" />
				</Col>
			</Row>
			<Alert type="warning" showIcon message="Texture presets are starting values. Calibrate with field measurements." />
		</>
		);
	})();

	const guideItems = fieldGuides.map((guide) => ({
		key: guide.id,
		label: (
			<Space align="start" style={{ width: '100%' }}>
				<Text strong style={{ color: 'var(--orange, #d73f09)' }}>{guide.number}</Text>
				<span>
					<Text type="secondary" style={{ display: 'block' }}>{guide.bestFor}</Text>
					<Text strong>{guide.title}</Text>
				</span>
			</Space>
		),
		children: (
			<Space direction="vertical" size="small" style={{ width: '100%' }}>
				<Text type="secondary">Field kit</Text>
				<Text>{guide.kit}</Text>
				<List
					size="small"
					dataSource={guide.steps}
					renderItem={(item) => <List.Item>{item}</List.Item>}
				/>
				<Button
					type="primary"
					icon={<RightOutlined />}
					onClick={() => {
						setActiveTool(guide.id);
						setOpenGuide(guide.id);
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}}
				>
					Use this method
				</Button>
			</Space>
		),
	}));

	const buttonStyle = {
		//backgroundColor: 'lightgray',
		borderWidth: 1,
		borderStyle: 'solid',
		borderColor: 'gray',
		padding: '1em',
		borderRadius: 4,
		margin: 3,
	}

	const buttonStyleSelected = {
		backgroundColor: 'rgba(215,63,9,0.1)',
		borderColor: 'rgb(215,63,9)',
		borderWidth: 1,
		borderStyle: 'solid',
		padding: '1em',
		margin: 3,
		borderRadius: 4,
	}


	const isMobile = useMediaQuery({ query: '(max-width: 800px)' })

	return (
		<main aria-labelledby="irrigation-measurement-title" style={{ maxWidth: 1240, margin: '0 auto', padding: '1rem' }}>
			<div>
				<Title level={2} id="irrigation-measurement-title" style={{ marginBottom: 8 }}>
					Irrigation measurement calculators
				</Title>
				<Paragraph style={{ maxWidth: 980, marginBottom: 12 }}>
					Interactive calculators for pump discharge, applied depth, catch-can uniformity, and root-zone soil-water deficit. Each calculator shows the formula behind the result so field measurements become irrigation-ready numbers.
				</Paragraph>
				<Title level={4} style={{ marginTop: 0 }}>Measure water. Manage every drop.</Title>
				<Segmented
					aria-label="Unit system"
					value={units}
					onChange={switchUnits}
					options={[
						{ label: 'US units', value: 'us' },
						{ label: 'Metric Units', value: 'metric' },
					]}
					style={{ marginBottom: 16 }}
				/>
			</div>

			{!isMobile ? (
				<div>
					<Tabs
						activeKey={activeTool}
						onChange={setActiveTool}
						items={[
							{
								key: 'flow',
								label: <div style={activeTool == 'flow' ? buttonStyleSelected : buttonStyle}>
									<Text type="secondary">TIMED VOLUME</Text><br />
									<Text strong style={{ fontSize: 'large' }}>Pump Discharge</Text>
								</div>,
							},
							{
								key: 'depth',
								label:
									<div style={activeTool == 'depth' ? buttonStyleSelected : buttonStyle}>
										<Text type="secondary">FLOW x TIME</Text><br />
										<Text strong style={{ fontSize: 'large' }}>Applied Depth</Text>
									</div>,
							},
							{
								key: 'uniformity',
								label: <div style={activeTool == 'uniformity' ? buttonStyleSelected : buttonStyle}>
									<Text type="secondary">CATCH CANS</Text><br />
									<Text strong style={{ fontSize: 'large' }}>Uniformity</Text>
								</div>,
							},
							{
								key: 'soil',
								label: <div style={activeTool == 'soil' ? buttonStyleSelected : buttonStyle}>
									<Text type="secondary">ROOT ZONE REFILL</Text><br />
									<Text strong style={{ fontSize: 'large' }}>Soil Water</Text>
								</div>,
							},
						]}
					/>
				</div>
			) : (
				<Row gutter={8}>
					<Col xs={24} sm={12} md={6}>
						<Button
							id="tool-tab-flow"
							type="text"
							role="tab"
							aria-selected={activeTool === 'flow'}
							aria-controls="tool-panel-flow"
							onClick={() => setActiveTool('flow')}
							style={activeTool === 'flow' ? buttonStyleSelected : buttonStyle}
						>
							<Text strong style={{ fontSize: 'large' }}>Pump discharge</Text>
						</Button>
					</Col>

					<Col xs={24} sm={12} md={6}>
						<div style={activeTool == 'depth' ? buttonStyleSelected : buttonStyle} onClick={() => setActiveTool('depth')}>
							<Text type="secondary">FLOW x TIME</Text><br />
							<Text strong style={{ fontSize: 'large' }}>Applied Depth</Text>
						</div>
					</Col>
					<Col xs={24} sm={12} md={6}>
						<div style={activeTool == 'uniformity' ? buttonStyleSelected : buttonStyle} onClick={() => setActiveTool('uniformity')}>
							<Text type="secondary">CATCH CANS</Text><br />
							<Text strong style={{ fontSize: 'large' }}>Uniformity</Text>
						</div>
					</Col>
					<Col xs={24} sm={12} md={6}>
						<div style={activeTool == 'soil' ? buttonStyleSelected : buttonStyle} onClick={() => setActiveTool('soil')}>
							<Text type="secondary">ROOT ZONE REFILL</Text><br />
							<Text strong style={{ fontSize: 'large' }}>Soil Water</Text>
						</div>
					</Col>
				</Row>
			)
			}

			<div style={buttonStyleSelected}>
				<Row gutter={16} align="top">
					<Col xs={24} lg={16}>
						<Space direction="vertical" size="middle" style={{ width: '100%' }}>
							{activeTool === 'flow' && (
								<FlowCalculatorPanel
									units={units}
									volume={volume}
									setVolume={setVolume}
									fillTimes={fillTimes}
									setFillTimes={setFillTimes}
								/>
							)}
							{activeTool === 'depth' && (
								<DepthCalculatorPanel
									units={units}
									systemFlow={systemFlow}
									setSystemFlow={setSystemFlow}
									area={area}
									setArea={setArea}
									runtime={runtime}
									setRuntime={setRuntime}
									efficiency={efficiency}
									setEfficiency={setEfficiency}
								/>
							)}
							{activeTool === 'uniformity' && (
								<UniformityCalculatorPanel
									catches={catches}
									setCatches={setCatches}
									uniformityResult={uniformityResult}
								/>
							)}
							{activeTool === 'soil' && (
								<SoilWaterCalculatorPanel
									units={units}
									soilPreset={soilPreset}
									setSoilPreset={setSoilPreset}
									fieldCapacity={fieldCapacity}
									setFieldCapacity={setFieldCapacity}
									wiltingPoint={wiltingPoint}
									setWiltingPoint={setWiltingPoint}
									currentVwc={currentVwc}
									setCurrentVwc={setCurrentVwc}
									rootDepth={rootDepth}
									setRootDepth={setRootDepth}
									soilEfficiency={soilEfficiency}
									setSoilEfficiency={setSoilEfficiency}
								/>
							)}
						</Space>
					</Col>
					<Col xs={24} lg={8}>
						<Card style={{ background: 'rgba(215,63,9,0.7)' }} aria-live="polite" aria-atomic="true" role="status" >
							<Title level={4} id="calculated-result-title">
								CALCULATED RESULT
							</Title>
							{resultsPanel}
							<Text style={{ display: 'block', marginTop: 16, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
								Results update as you type · {unitLabel}
							</Text>
						</Card>
					</Col>
				</Row>
			</div>

			<Divider />

			<section>
				<Title level={3}>Measure with a method, not a guess</Title>
				<Paragraph>
					Good calculations begin with representative observations. Use these short protocols to prepare, measure, and document each field test.
				</Paragraph>
				<Collapse
					accordion
					activeKey={openGuide}
					onChange={(key) => setOpenGuide(Array.isArray(key) ? key[0] : key)}
					items={guideItems}
				/>
			</section>

			<Divider />

			<section>
				<Title level={3}>Three habits improve every result</Title>
				<Row gutter={[16, 16]}>
					<Col xs={24} md={8}>
						<Card>
							<Text strong style={{ color: 'var(--orange, #d73f09)' }}>01</Text>
							<Title level={4} style={{ marginTop: 8 }}>Repeat</Title>
							<Paragraph>Collect replicates across representative operating conditions, not just the easiest point to access.</Paragraph>
						</Card>
					</Col>
					<Col xs={24} md={8}>
						<Card>
							<Text strong style={{ color: 'var(--orange, #d73f09)' }}>02</Text>
							<Title level={4} style={{ marginTop: 8 }}>Record</Title>
							<Paragraph>Note pressure, wind, runtime, set area, sensor depth, and unusual field conditions with the measurement.</Paragraph>
						</Card>
					</Col>
					<Col xs={24} md={8}>
						<Card>
							<Text strong style={{ color: 'var(--orange, #d73f09)' }}>03</Text>
							<Title level={4} style={{ marginTop: 8 }}>Compare</Title>
							<Paragraph>Compare measured performance with design values, prior tests, and crop or soil-water requirements.</Paragraph>
						</Card>
					</Col>
				</Row>
			</section>

			<Divider />

			<section>
				<Title level={3}>Conversions worth keeping close</Title>
				<Paragraph>Use these identities to check units before the result reaches an irrigation schedule.</Paragraph>
				<Row gutter={[16, 16]}>
					{conversionCards.map((item) => (
						<Col xs={24} sm={12} lg={6} key={item.label}>
							<Card style={{ textAlign: 'center' }}>
								<Text type="secondary" style={{ display: 'block' }}>{item.label}</Text>
								<Title level={2} style={{ margin: '8px 0', color: 'var(--orange, #d73f09)' }}>{item.value}</Title>
								<Text>{item.unit}</Text>
							</Card>
						</Col>
					))}
				</Row>
			</section>

			<Divider />

			<section>
				<Title level={3}>References and further reading</Title>
				<List
					itemLayout="vertical"
					dataSource={referenceItems}
					renderItem={(item) => (
						<List.Item>
							<Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
								<Paragraph style={{ marginBottom: 0, flex: 1 }}>{item.text}</Paragraph>
								<Button type="link" href={item.href} target="_blank" rel="noreferrer">
									{item.label}
								</Button>
							</Space>
						</List.Item>
					)}
				/>

				<Space wrap style={{ marginTop: 16 }}>
					<Button type="primary" href="https://osuagrohydrology.com/files/irrigation-measurement-field-guide.pdf" target="_blank" rel="noreferrer">
						Download the field guide
					</Button>

					<Button icon={<PrinterOutlined />} onClick={() => window.print()}>
						Print this page
					</Button>
				</Space>

				<Alert
					style={{ marginTop: 20 }}
					icon={<InfoCircleOutlined />}
					type="warning"
					showIcon
					message="Use results with context"
					description={(
						<span>
							These calculators support field measurements and learning. Verify measurements, assumptions, system limits, and crop requirements before making operational decisions. For questions, contact the AHGRI Lab at{' '}
							<Link href="mailto:floyid.nicolas@oregonstate.edu">floyid.nicolas@oregonstate.edu</Link>.
						</span>
					)}
				/>
			</section>
		</main>
	);
};

export default IrrigationMeasurement;
