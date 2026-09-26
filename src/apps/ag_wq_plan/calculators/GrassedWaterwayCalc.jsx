import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
	Alert,
	Button,
	Card,
	Col,
	Descriptions,
	Divider,
	Form,
	InputNumber,
	Row,
	Select,
	Space,
	Spin,
	Tag,
	Tabs,
	Typography,
	message,
} from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';

const { Paragraph, Text, Title } = Typography;

const defaultValues = {
    Q: 10,
    slope: 0.01,
	channel_type: 'trapezoidal',
	side_slope: 4,
	soil_category: 'erodible',
	allowable_soil_stress: 100,
    d75: 0.1,
    CF: 0.75,
	CI_stability: 4.44,
	CI_capacity: 5.6,
    vegetation_height: 12,  // inches
    stem_density: 10,
	min_bottom_width: 0,
	freeboard: 0,
	width_rounding: 0,
	depth_rounding: 0,
	max_depth: 10,
	max_width: 200,
};





const fieldGroups = [
	{
		title: 'Flow/Channel',
		fields: [
			{ name: 'Q', label: 'Design discharge (cfs)', min: 0, required: true },
			{ name: 'slope', label: 'Channel slope (ft/ft)', min: 0, step: 0.0001, required: true },
			{ name: 'side_slope', label: 'Side slope, z (H:V)', min: 0, step: 0.1 },
			{
				name: 'channel_type',
				label: 'Channel type',
				control: <Select options={[{ value: 'trapezoidal', label: 'Trapezoidal' }, { value: 'parabolic', label: 'Parabolic' }]} />,
			},
		],
	},
	{
		title: 'Soil/Vegetation',
		fields: [
			{
				name: 'soil_category',
				label: 'Soil category',
				control: <Select options={[{ value: 'erodible', label: 'Erodible' }, { value: 'non-erodible', label: 'Non-erodible' }]} />,
			},
			{ name: 'allowable_soil_stress', label: 'Allowable soil stress (lb/ft²)', min: 0, step: 0.001 },
			{ name: 'd75', label: 'D75 grain size (in)', min: 0, step: 0.01 },
			{ name: 'CF', label: 'Cover factor, CF', min: 0, step: 0.01 },
			{ name: 'CI_stability', label: 'Stability coefficient', min: 0, step: 0.01 },
			{ name: 'CI_capacity', label: 'Capacity coefficient', min: 0, step: 0.01 },
			{ name: 'vegetation_height', label: 'Vegetation height (in)', min: 0, step: 0.1 },
			{ name: 'stem_density', label: 'Stem density (stems/ft²)', min: 0, step: 0.1 },
		],
	},
	{
		title: 'Limits/Rounding',
		fields: [
			{ name: 'min_bottom_width', label: 'Minimum bottom width (ft)', min: 0, step: 0.1 },
			{ name: 'freeboard', label: 'Freeboard (ft)', min: 0, step: 0.1 },
			{ name: 'width_rounding', label: 'Width rounding (ft)', min: 0, step: 0.1 },
			{ name: 'depth_rounding', label: 'Depth rounding (ft)', min: 0, step: 0.1 },
			{ name: 'max_depth', label: 'Maximum depth (ft)', min: 0, step: 0.1 },
			{ name: 'max_width', label: 'Maximum width (ft)', min: 0, step: 1 },
		],
	},
];

function formatValue(value, digits = 3) {
	if (value === null || value === undefined || value === '') return 'Not provided';
	if (typeof value === 'number') return value.toFixed(digits);
	return String(value);
}

function WaterwayGeometry({ design, channelType }) {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !design) return undefined;

		const draw = () => {
			const bounds = canvas.getBoundingClientRect();
			const ratio = window.devicePixelRatio || 1;
			const width = Math.max(bounds.width, 320);
			const height = 380;
			canvas.width = width * ratio;
			canvas.height = height * ratio;
			const context = canvas.getContext('2d');
			context.setTransform(ratio, 0, 0, ratio, 0, 0);
			context.clearRect(0, 0, width, height);

			const bottomWidth = Number(design.bottom_width_ft) || 0;
			const topWidth = Number(design.top_width_ft) || bottomWidth;
			const flowDepth = Number(design.flow_depth_ft) || 0;
			const totalDepth = Number(design.total_depth_with_freeboard_ft) || flowDepth;
			const maxWidth = Math.max(topWidth, bottomWidth, 1);
			const maxDepth = Math.max(totalDepth, 1);
			const plot = { left: 86, right: width - 54, top: 40, bottom: height - 66 };
			const scale = Math.min((plot.right - plot.left) / maxWidth, (plot.bottom - plot.top) / maxDepth);
			const center = (plot.left + plot.right) / 2;
			const topY = plot.bottom - totalDepth * scale;
			const flowY = plot.bottom - flowDepth * scale;
			const bottomLeft = center - (bottomWidth * scale) / 2;
			const bottomRight = center + (bottomWidth * scale) / 2;
			const topLeft = center - (topWidth * scale) / 2;
			const topRight = center + (topWidth * scale) / 2;
			const isParabolic = channelType === 'parabolic';
			const labelFont = '12px sans-serif';

			context.fillStyle = '#f3f7f1';
			context.fillRect(0, 0, width, height);
			context.fillStyle = '#d7e7d2';
			context.beginPath();
			if (isParabolic) {
				context.moveTo(topLeft, topY);
				context.lineTo(topRight, topY);
				context.quadraticCurveTo(topRight, plot.bottom, center, plot.bottom);
				context.quadraticCurveTo(topLeft, plot.bottom, topLeft, topY);
			} else {
				context.moveTo(topLeft, topY);
				context.lineTo(topRight, topY);
				context.lineTo(bottomRight, plot.bottom);
				context.lineTo(bottomLeft, plot.bottom);
			}
			context.closePath();
			context.fill();
			context.strokeStyle = '#315c3a';
			context.lineWidth = 2;
			context.stroke();

			context.fillStyle = 'rgba(74, 144, 190, 0.35)';
			const flowWidth = isParabolic
				? topWidth * Math.sqrt(Math.min(flowDepth / maxDepth, 1))
				: bottomWidth + ((topWidth - bottomWidth) * flowDepth) / maxDepth;
			const flowLeft = center - (flowWidth * scale) / 2;
			const flowRight = center + (flowWidth * scale) / 2;
			context.beginPath();
			context.moveTo(flowLeft, flowY);
			context.lineTo(flowRight, flowY);
			if (isParabolic) {
				context.quadraticCurveTo(flowRight, plot.bottom, center, plot.bottom);
				context.quadraticCurveTo(flowLeft, plot.bottom, flowLeft, flowY);
			} else {
				context.lineTo(bottomRight, plot.bottom);
				context.lineTo(bottomLeft, plot.bottom);
			}
			context.closePath();
			context.fill();
			context.strokeStyle = '#377da8';
			context.setLineDash([6, 4]);
			context.beginPath();
			context.moveTo(flowLeft, flowY);
			context.lineTo(flowRight, flowY);
			context.stroke();
			context.setLineDash([]);

			const drawDimension = (startX, startY, endX, endY, label, labelX, labelY) => {
				context.strokeStyle = '#4a5568';
				context.fillStyle = '#4a5568';
				context.lineWidth = 1;
				context.beginPath();
				context.moveTo(startX, startY);
				context.lineTo(endX, endY);
				context.stroke();
				const arrowSize = 5;
				if (startY === endY) {
					context.beginPath();
					context.moveTo(startX, startY);
					context.lineTo(startX + arrowSize, startY - arrowSize / 2);
					context.lineTo(startX + arrowSize, startY + arrowSize / 2);
					context.moveTo(endX, endY);
					context.lineTo(endX - arrowSize, endY - arrowSize / 2);
					context.lineTo(endX - arrowSize, endY + arrowSize / 2);
					context.fill();
				} else {
					context.beginPath();
					context.moveTo(startX, startY);
					context.lineTo(startX - arrowSize / 2, startY + arrowSize);
					context.lineTo(startX + arrowSize / 2, startY + arrowSize);
					context.moveTo(endX, endY);
					context.lineTo(endX - arrowSize / 2, endY - arrowSize);
					context.lineTo(endX + arrowSize / 2, endY - arrowSize);
					context.fill();
				}
				context.font = labelFont;
				context.textAlign = 'center';
				context.fillText(label, labelX, labelY);
			};

			if (!isParabolic) {
				drawDimension(bottomLeft, plot.bottom + 24, bottomRight, plot.bottom + 24, `Bottom ${formatValue(bottomWidth)} ft`, center, plot.bottom + 42);
			}
			drawDimension(topLeft, topY - 20, topRight, topY - 20, `Top ${formatValue(topWidth)} ft`, center, topY - 28);
			drawDimension(topLeft - 26, plot.bottom, topLeft - 26, topY, `Depth ${formatValue(totalDepth)} ft`, topLeft - 42, (plot.bottom + topY) / 2);
			context.save();
			context.translate(topLeft - 58, flowY);
			context.rotate(-Math.PI / 2);
			context.textAlign = 'center';
			context.fillStyle = '#377da8';
			context.fillText(`Flow depth ${formatValue(flowDepth)} ft`, 0, 0);
			context.restore();
			context.font = 'bold 14px sans-serif';
			context.fillStyle = '#1f2937';
			context.textAlign = 'left';
			context.fillText('Waterway cross-section', plot.left, 22);
		};

		draw();
		const observer = new ResizeObserver(draw);
		observer.observe(canvas);
		return () => observer.disconnect();
	}, [channelType, design]);

	return (
		<Card size="small" title="Design geometry">
			<canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 380 }} role="img" aria-label="Scaled grassed waterway cross-section with width and depth dimensions" />
		</Card>
	);
}

WaterwayGeometry.propTypes = {
	design: PropTypes.object,
	channelType: PropTypes.string,
};

function ResultSection({ title, values, digits = 3 }) {
	return (
		<Card size="small" title={title}>
			<Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered 
             styles={{ label: { color: 'red' } }}>
				{Object.entries(values || {}).map(([key, value]) => (
					<Descriptions.Item key={key} label={key.replaceAll('_', ' ')}  styles={{
                          label: {
                            color: '#eaeaea'
                          }
                        }}>
						{typeof value === 'boolean' ? <Tag color={value ? 'success' : 'error'}>{value ? 'Pass' : 'Fail'}</Tag> : formatValue(value, digits)}
					</Descriptions.Item>
				))}
			</Descriptions>
		</Card>
	);
}

ResultSection.propTypes = {
	title: PropTypes.string.isRequired,
	values: PropTypes.object,
	digits: PropTypes.number,
};

export default function GrassedWaterwayCalc({ apiBase = 'https://agwater.org:5556' }) {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState('');

	const handleSubmit = async (values) => {
		setLoading(true);
		setError('');
		setResult(null);
		const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === undefined ? null : value]));

		try {
			const response = await fetch(`${apiBase.replace(/\/$/, '')}/agwqplan/calc/grassed_waterway`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json',  },
				body: JSON.stringify(payload),
			});
			const body = await response.json();
			if (!response.ok || !body.success) throw new Error(body.error || 'Unable to calculate grassed waterway design.');
			setResult(body.result);
			message.success('Grassed waterway design calculated');
		} catch (requestError) {
			setError(requestError.message || 'Unable to calculate grassed waterway design.');
			message.error('Calculation failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Space direction="vertical" size="large" style={{ display: 'flex' }}>
			<div>
				<Title level={3}>Grassed Waterway Calculator</Title>
				<Paragraph type="secondary">Enter the design flow, channel conditions, and optional limits to calculate a stable waterway cross-section.</Paragraph>
			</div>
			<Form form={form} layout="vertical" initialValues={defaultValues} onFinish={handleSubmit}>
				<Tabs items={fieldGroups.map((group) => ({
					key: group.title,
					label: group.title,
					children: (
						<Card title={group.title}>
							<Row gutter={[16, 0]}>
								{group.fields.map((field) => (
									<Col xs={24} sm={12} lg={8} key={field.name}>
										<Form.Item
											name={field.name}
											label={field.label}
											rules={field.required ? [{ required: true, message: `${field.label} is required.` }] : []}
										>
											{field.control || <InputNumber min={field.min} step={field.step || 1} style={{ width: '100%' }} />}
										</Form.Item>
									</Col>
								))}
							</Row>
						</Card>
					),
				}))} />
                <br/>
				<Button type="primary" htmlType="submit" icon={<CalculatorOutlined />} loading={loading}>
					Calculate design
				</Button>
			</Form>

			{error && <Alert type="error" showIcon message="Calculation failed" description={error} />}
			{loading && <Spin tip="Calculating design..." />}
			{result && (
				<div>
					<Divider orientation="left">Design results</Divider>
					<Alert
						type={result.checks?.design_ok ? 'success' : 'warning'}
						showIcon
						message={result.checks?.design_ok ? 'Design checks passed' : 'Review the design checks'}
						description={<Text>Bottom width: {formatValue(result.design?.bottom_width_ft)} ft; total depth: {formatValue(result.design?.total_depth_with_freeboard_ft)} ft.</Text>}
						style={{ marginBottom: 16 }}
					/>
					<Tabs
						items={[
							{ key: 'geometry', label: 'Geometry', children: <WaterwayGeometry design={result.design} channelType={result.inputs?.channel_type} /> },
							{ key: 'design', label: 'Design', children: <ResultSection title="Design" values={result.design} /> },
							{ key: 'stability', label: 'Stability', children: <ResultSection title="Stability" values={result.stability} /> },
							{ key: 'checks', label: 'Checks', children: <ResultSection title="Checks" values={result.checks} digits={0} /> },
						]}
					/>
				</div>
			)}
		</Space>
	);
}

GrassedWaterwayCalc.propTypes = {
	apiBase: PropTypes.string,
};
