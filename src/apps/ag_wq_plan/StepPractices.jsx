import { useMemo, useRef, useState } from 'react';

import PropTypes from 'prop-types';
import { Alert, Button, Card, Collapse, Divider, Typography, Checkbox, Carousel, Tag } from 'antd';
import ComplianceInfo from './ComplianceInfo';
import ValidationError from './ValidationError';
import ChatResponse from '../../components/chat_response/ChatReponse';
const { Title, Paragraph, Text } = Typography;

const displayValue = (value, fallback = 'Not provided') => {
	if (value === null || value === undefined || value === '') return fallback;
	if (typeof value === 'string' || typeof value === 'number') return String(value);
	if (Array.isArray(value)) return value.map((item) => displayValue(item)).join(', ');
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
};


// Step 4: Select and review recommended agricultural water quality practices
// Props:
//   - userRole: Current user role (for compliance/TMDL display)
//   - recommendedPractices: Array of Practice objects recommended based on conditions
//   - selectedPracticeIds: Array of selected practice IDs
//   - setSelectedPracticeIds: Function to update selected practice IDs
const StepPractices = ({
	currentPlan,
	setCurrentPlan,
	userRole,
	areaRulesData,
	concernQuestionsData,
	practicesData,
	setError,
	savePlan,
	isDirty,
}) => {

	const [showSummary, setShowSummary] = useState(false);
	const prompt = useRef('');

	// Recommend practices based on selected questions
	const recommendedPractices = useMemo(() => {
		const questionTags = new Set(
			concernQuestionsData
				.filter((q) => currentPlan?.report_data?.selected_questions.includes(q.id))
				.map((q) => q.concern),
		);
		return practicesData.filter((p) =>
			p.tags.some((t) =>
				questionTags.has(t)));
	}, [currentPlan, concernQuestionsData, practicesData]);



	// Toggle a practice's selection state
	const togglePractice = (id) => {
		setCurrentPlan((previousPlan) => {
			const selectedPractices = previousPlan?.report_data?.selected_practices || [];
			const nextSelectedPractices = selectedPractices.includes(id)
				? selectedPractices.filter((practiceId) => practiceId !== id)
				: [...selectedPractices, id];

			return {
				...previousPlan,
				report_data: {
					...previousPlan.report_data,
					selected_practices: nextSelectedPractices,
				},
			};
		});
	};

	const carouselContentStyle = {
		width: '100%',
		height: '100%',
	};

	async function generatePlainLanguageSummary(matchingRules) {
		let _prompt = 'Generate a plain language summary of the following agricultural water quality rules: ';

		for (const rule of matchingRules) {
			_prompt += displayValue(rule.CATEGORY);
			_prompt += ': ';
			_prompt += displayValue(rule['Oregon Administrative Rules (OAR)']);
			_prompt += '\n';
		}

		prompt.current = _prompt;
		setShowSummary(true);
	};

	const applicableAreaRules = () => {
		if (!areaRulesData || areaRulesData.length === 0) {
			return null;
		}
		const matchingRules = areaRulesData.filter((rule) => {
			return rule.MA_Index && rule.MA_Index === currentPlan?.report_data?.agwqm_area;
		});
		return matchingRules.length > 0 ? (
			<>
				<Paragraph>
					{"Area-specific rules or TMDL requirements may apply in this management area (" + currentPlan?.report_data?.agwqm_area
						+ "). Please review the information for each practice carefully."}
					<Button type="primary" style={{ marginTop: '0.5em', marginLeft: '4em' }}
						onClick={() => generatePlainLanguageSummary(matchingRules)} >
						Plain Language Summary (AI generated)
					</Button>
				</Paragraph>
				{showSummary && (
					<>
					<ChatResponse prompt={prompt.current} />
					</>
				)}
				<Collapse items={matchingRules.map((rule, index) => ({
					key: "rule_" + index,
					label: displayValue(rule.CATEGORY),
					children: <p>{displayValue(rule['Oregon Administrative Rules (OAR)'])}</p>
				}))} />
			</>
		) : null;
	};

	if (currentPlan?.report_data?.selected_practices?.length === 0) {
		setError('error');
	}

	if (currentPlan?.report_data?.selected_practices?.length > 0) {
		setError('finish');
	}

	return (
		<>
			{applicableAreaRules() && (<>
				<Title level={5}>Area Specific Rules Apply</Title>
				<Alert
					style={{ marginBottom: 16 }}
					title={"Area-specific rules or TMDL requirements may apply in this management area (" + currentPlan?.report_data?.agwqm_area + "). Please review the information for each practice carefully."}
					description={applicableAreaRules()}
					type="info"
					showIcon
					closable={{ closeIcon: true, 'aria-label': 'close' }}
				/>
			</>
			)}

			{/* Accordion list of API-backed recommended practices with detailed information */}

			<Title level={3}>Recommended practices</Title>
			<Paragraph>
				Based on your conditions, these practices may help protect water quality and meet
				rules and TMDL expectations. Select any that you are interested in implementing to see more details and
				to include them in your plan.
			</Paragraph>



			{currentPlan?.report_data?.selected_practices?.length === 0 && (
				<Paragraph style={{ marginTop: 16 }}>
					<ValidationError message="Please select at least one practice to proceed." />
				</Paragraph>
			)}

			<Collapse accordion>
				{recommendedPractices.map((p) => (
					<Collapse.Panel
						key={p.id}
						header={
							<span>
								<span
									onClick={(event) => event.stopPropagation()}
									onKeyDown={(event) => event.stopPropagation()}
									role="presentation"
								>
									<Checkbox
										checked={currentPlan?.report_data?.selected_practices?.includes(p.id) || false}
										onChange={() => togglePractice(p.id)}
										style={{ marginRight: 8 }}
									/>
								</span>
								{/* <Text strong>{p.id}</Text> – {p.title} */}
								<Text strong style={{ color: 'yellow' }}>{displayValue(p.title)}</Text>
							</span>
						}
					>
						<Card style={{ width: '100%' }}>
							<Paragraph>
								<Text strong>Category:</Text> {displayValue(p.category)}
							</Paragraph>
							<Paragraph>
								<Text strong>Helps water quality:</Text>{' '}
								{(p.helps || []).map((help, index) => (
									<Tag key={`${p.id}-help-${index}`}>{displayValue(help)}</Tag>
								))}
							</Paragraph>
							<Paragraph>
								<Text strong>How it helps (ecosystem benefit):</Text> {displayValue(p.ecosystem_benefits)}
							</Paragraph>
							<Paragraph>
								<Text strong>Costs (potential):</Text> {displayValue(p.costs)}
							</Paragraph>
							<Paragraph>
								<Text strong>Benefits (potential):</Text> {displayValue(p.benefits)}
							</Paragraph>
							<Paragraph>
								<Text strong>References:</Text>
								<ul style={{ paddingLeft: 20, margin: 0 }}>
									{(p.links || []).map((link, index) => (
										<li key={link.url || `${p.id}-link-${index}`}>
											<a href={typeof link.url === 'string' ? link.url : '#'} target="_blank" rel="noreferrer">
												{displayValue(link.label)}
											</a>
										</li>
									))}
								</ul>
							</Paragraph>
							<ComplianceInfo practice={p} userRole={userRole} />

							<Carousel arrows infinite={false} style={{ width: 400, height: 400 }}>
								<div>
									<img src="/images/AgWqPlan/OIP-1912167953.jpg" alt="Practice image 1" style={carouselContentStyle} />
									<h3 style={carouselContentStyle}>1</h3>
								</div>
								<div>
									<h3 style={carouselContentStyle}>2</h3>
								</div>
								<div>
									<h3 style={carouselContentStyle}>3</h3>
								</div>
								<div>
									<h3 style={carouselContentStyle}>4</h3>
								</div>
							</Carousel>



						</Card>
					</Collapse.Panel>
				))}
			</Collapse>

			<Divider />
			<Button type="primary" style={{ marginBottom: 16, marginLeft: 16 }}
				onClick={() => { savePlan(); }}
				disabled={(currentPlan === null
					|| (currentPlan?.report_data?.selected_practices.length === 0)
					|| isDirty.current === false)}
			>
				Save Plan Updates
			</Button>
		</>
	);
};

StepPractices.propTypes = {
	currentPlan: PropTypes.shape({
		report_data: PropTypes.shape({
			selected_questions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
			selected_practices: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
			agwqm_area: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		}).isRequired,
	}).isRequired,
	setCurrentPlan: PropTypes.func.isRequired,
	userRole: PropTypes.string,
	areaRulesData: PropTypes.arrayOf(PropTypes.object),
	concernQuestionsData: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
			concern: PropTypes.string,
		}),
	),
	practicesData: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
			title: PropTypes.string,
			tags: PropTypes.arrayOf(PropTypes.string),
			help: PropTypes.arrayOf(PropTypes.string),
			helps: PropTypes.arrayOf(PropTypes.string),
			category: PropTypes.string,
			ecosystem_benefits: PropTypes.string,
			costs: PropTypes.string,
			benefits: PropTypes.string,
			links: PropTypes.arrayOf(PropTypes.object),
		}),
	),
	setError: PropTypes.func.isRequired,
	savePlan: PropTypes.func.isRequired,
	isDirty: PropTypes.shape({ current: PropTypes.bool }).isRequired,
};

export default StepPractices;
