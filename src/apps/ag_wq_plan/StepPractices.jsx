import PropTypes from 'prop-types';
import { Alert, Button, Card, Collapse, Tag, Typography, Checkbox, Carousel } from 'antd';
import ComplianceInfo from './ComplianceInfo';
import { secrets } from '../../secrets';
import ValidationError from './ValidationError';

const { Title, Paragraph, Text } = Typography;


const getChatResponse = async (_prompt, selectedModel) => {
	let response;
	try {
		const CHAT_API_URL = "https://agwater.org:5556/llm/chat";

		// console.log("input: ", _prompt);
		response = await fetch(CHAT_API_URL, {
			method: 'POST',
			headers: {
				'X-API-Key': secrets.agwater_api_key,
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: _prompt,
				//additional_data: {},
				//model: selectedModel,
				stream: false,
				use_RAG: true,
				//chat_history: history
			})
		});
		if (!response.ok) {
			console.error('HTTP error response:', response);
			return null;
		}
	} catch (fetchError) {
		console.error('Network error:', fetchError);
		return null;
	}

	// --- Stream reading phase ---
	// Manually decode UTF-8 bytes and parse newline-delimited JSON so we control
	// exactly when each chunk is flushed to the DOM.
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let currentAnswer = '';
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });

			// Drain every complete JSON line from the buffer.
			let newlineIndex;
			while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
				const line = buffer.slice(0, newlineIndex).trim();
				buffer = buffer.slice(newlineIndex + 1);
				if (!line) continue;

				let json;
				try {
					json = JSON.parse(line);
				} catch (parseError) {
					console.warn('Failed to parse JSON line:', line, parseError);
					continue;
				}

				// console.log('LLM Streamed Data Received', json);

				if (json.content_type && json.content_type[0] === 'l') {
					// LLM response chunk — append and flush to DOM immediately.
					currentAnswer += json['llm_response'];
					//flushSync(() => setCurrentMarkdown(currentAnswer.current));
				} else if (json.content_type) {
					// Final message — collect referenced document links.
					//const refs = json['referenced_documents'] || [];
					//const titles = json['referenced_titles'] || [];
					//if (refs.length > 0) {
					//	let contentStr = '\n\n#### References:\n';
					//	refs.forEach((ref, index) => {
					//		const title = titles.length > 0 ? titles[index] : null;
					//		contentStr += title
					//			? `${index + 1}. [${title}](<https://agwater.org:5556/llm/source?filename=${ref}>)\n`
					//			: `${index + 1}. ${ref}\n`;
					//	});
					//	references.current = contentStr;
					//}
				}
			}
		}
	} catch (streamError) {
		console.error('Error reading response stream:', streamError);
	} finally {
		reader.releaseLock();
	}

	// Append references to the final answer, then move everything into history.
	//currentAnswer.current += references.current;
	//const _currentAnswer = currentAnswer.current;
//
	//setIsStreaming(false);
	//currentQuestion.current = '';
	//currentAnswer.current = '';
	//references.current = '';
//
	//// Append a question mark if the prompt looks like a question.
	//if (!_prompt.endsWith('?') && (_prompt[0] === 'w' || _prompt[0] === 'W' || _prompt[0] === 'h' || _prompt[0] === 'H'))
	//	_prompt = `${_prompt}?`;
	//setHistory([...history, { question: _prompt, answer: _currentAnswer }]);
	return currentAnswer;
}


// Step 4: Select and review recommended agricultural water quality practices
// Props:
//   - userType: Current user type (for compliance/TMDL display)
//   - recommendedPractices: Array of Practice objects recommended based on conditions
//   - selectedPracticeIds: Array of selected practice IDs
//   - setSelectedPracticeIds: Function to update selected practice IDs
const StepPractices = ({
	userType,
	areaRules,
	agwqmArea,
	recommendedPractices,
	selectedPracticeIds,
	setSelectedPracticeIds,
	setError
}) => {

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
		let prompt = 'Generate a plain language summary of the following agricultural water quality rules: ';

		for (const rule of matchingRules) {
			prompt += rule.CATEGORY;
			prompt += ': ';
			prompt += rule['Oregon Administrative Rules (OAR)'];
			prompt += '\n';
		}
		
		response = await getChatResponse(prompt);
		console.log(response);
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
					<Button type="primary" style={{ marginLeft: '4em' }} onClick={generatePlainLanguageSummary(matchingRules)} >Plain Language Summary</Button>
				</Paragraph>
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
			<Title level={4}>Recommended practices</Title>
			<Paragraph>
				Based on your conditions, these practices may help protect water quality and meet
				rules and TMDL expectations. Select any that you are interested in implementing to see more details and
				to include them in your plan.
			</Paragraph>


			{applicableAreaRules() && (
				<Alert
					style={{ marginBottom: 16 }}
					title={"Area-specific rules or TMDL requirements may apply in this management area (" + agwqmArea + "). Please review the information for each practice carefully."}
					description={applicableAreaRules()}
					type="info"
					showIcon
					closable={{ closeIcon: true, 'aria-label': 'close' }}
				/>
			)}

			{/* Accordion list of API-backed recommended practices with detailed information */}

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

							<ComplianceInfo practice={p} userType={userType} />

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
	userType: PropTypes.string.isRequired,
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
};

export default StepPractices;
