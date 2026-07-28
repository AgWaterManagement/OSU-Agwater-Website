import {useState, useRef} from 'react';

import PropTypes from 'prop-types';
import { Alert, Button, Card, Collapse, Tag, Typography, Checkbox, Carousel, Modal } from 'antd';
import ComplianceInfo from './ComplianceInfo';
import ValidationError from './ValidationError';

import ChatResponse from '../../components/chat_response/ChatReponse';


const { Title, Paragraph, Text } = Typography;


// Step 4: Select and review recommended agricultural water quality practices
// Props:
//   - userRole: Current user role (for compliance/TMDL display)
//   - recommendedPractices: Array of Practice objects recommended based on conditions
//   - selectedPracticeIds: Array of selected practice IDs
//   - setSelectedPracticeIds: Function to update selected practice IDs
const StepPractices = ({
	userRole,
	areaRules,
	agwqmArea,
	recommendedPractices,
	selectedPracticeIds,
	setSelectedPracticeIds,
	setError
}) => {

	const [showSummary, setShowSummary] = useState(false);
	const prompt = useRef('');


	// Toggle a practice's selection state
	const togglePractice = (id) => {
		setSelectedPracticeIds(
			selectedPracticeIds.includes(id)
				? selectedPracticeIds.filter((p) => p !== id)
				: [...selectedPracticeIds, id],
		);
	};

	const carouselContentStyle = {
		/*
		margin: 0,
		height: '160px',
		color: '#fff',
		lineHeight: '160px',
		textAlign: 'center',
		background: '#364d79',*/
		width: '100%',
		height: '100%',
	};

	async function generatePlainLanguageSummary(matchingRules) {
		let _prompt = 'Generate a plain language summary of the following agricultural water quality rules: ';

		for (const rule of matchingRules) {
			_prompt += rule.CATEGORY;
			_prompt += ': ';
			_prompt += rule['Oregon Administrative Rules (OAR)'];
			_prompt += '\n';
		}

		prompt.current = _prompt;
		setShowSummary(true);
	};

	const applicableAreaRules = () => {
		if (!areaRules || areaRules.length === 0) {
			return null;
		}
		const matchingRules = areaRules.filter((rule) => {
			return rule.MA_Index && rule.MA_Index === agwqmArea;
		});
		return matchingRules.length > 0 ? (
			<>
				<Paragraph>
					{"Area-specific rules or TMDL requirements may apply in this management area (" + agwqmArea
						+ "). Please review the information for each practice carefully."}
					<Button type="primary" style={{ marginLeft: '4em' }} onClick={() => generatePlainLanguageSummary(matchingRules)} >Plain Language Summary</Button>
				</Paragraph>
				<br />
				{showSummary && (
					{/* <ChatResponse prompt={prompt.current} /> */}
					
				)}
				<Collapse items={matchingRules.map((rule, index) => ({
					key: "rule_" + index,
					label: rule.CATEGORY,
					children: <p>{rule['Oregon Administrative Rules (OAR)']}</p>
				}))} />
			</>
		) : null;
	};

	if (selectedPracticeIds.length === 0) {
		setError('error');
	}

	if (selectedPracticeIds.length > 0) {
		setError('finish');
	}

	return (
		<>


			{applicableAreaRules() && ( <>
			<Title level={5}>Area Specific Rules Apply</Title>
				<Alert
					style={{ marginBottom: 16 }}
					title={"Area-specific rules or TMDL requirements may apply in this management area (" + agwqmArea + "). Please review the information for each practice carefully."}
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


			{selectedPracticeIds.length === 0 && (
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
										checked={selectedPracticeIds.includes(p.id)}
										onChange={() => togglePractice(p.id)}
										style={{ marginRight: 8 }}
									/>
								</span>
								{/* <Text strong>{p.id}</Text> – {p.title} */}
								<Text strong style={{ color: 'yellow' }}>{p.title}</Text>
							</span>
						}
					>
						<Card style={{ width: '100%' }}>
							<Paragraph>
								<Text strong>Category:</Text> {p.category}
							</Paragraph>
							<Paragraph>
								<Text strong>Helps water quality:</Text>{' '}
								{p.helps.map((h) => (
									<Tag key={h}>{h}</Tag>
								))}
							</Paragraph>
							<Paragraph>
								<Text strong>How it helps (ecosystem benefit):</Text> {p.ecosystem_benefits}
							</Paragraph>
							<Paragraph>
								<Text strong>Costs (potential):</Text> {p.costs}
							</Paragraph>
							<Paragraph>
								<Text strong>Benefits (potential):</Text> {p.benefits}
							</Paragraph>
							<Paragraph>
								<Text strong>References:</Text>
								<ul style={{ paddingLeft: 20, margin: 0 }}>
									{p.links.map((l) => (
										<li key={l.url}>
											<a href={l.url} target="_blank" rel="noreferrer">
												{l.label}
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
		</>
	);
};

StepPractices.propTypes = {
	userRole: PropTypes.string.isRequired,
	areaRules: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
		})
	).isRequired,
	agwqmArea: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	recommendedPractices: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
			title: PropTypes.string.isRequired,
			category: PropTypes.string.isRequired,
			helps: PropTypes.arrayOf(PropTypes.string).isRequired,
			ecosystemBenefits: PropTypes.string.isRequired,
			costs: PropTypes.string.isRequired,
			benefits: PropTypes.string.isRequired,
			links: PropTypes.arrayOf(
				PropTypes.shape({
					url: PropTypes.string.isRequired,
					label: PropTypes.string.isRequired,
				})
			).isRequired,
			tmdls: PropTypes.arrayOf(PropTypes.string),
			complianceNotes: PropTypes.string,
		})
	).isRequired,
	selectedPracticeIds: PropTypes.arrayOf(
		PropTypes.oneOfType([PropTypes.string, PropTypes.number])
	).isRequired,
	setSelectedPracticeIds: PropTypes.func.isRequired,
	setError: PropTypes.func.isRequired,
};

export default StepPractices;
