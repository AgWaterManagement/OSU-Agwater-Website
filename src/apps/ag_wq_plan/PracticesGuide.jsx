import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Card, Collapse, Empty, Input, Select, Space, Tag, Typography, Divider } from 'antd';

const { Search } = Input;
const { Paragraph, Text, Title } = Typography;

const normalizeText = (value) => String(value ?? '').toLowerCase();

const flattenPracticeText = (practice) => {
	if (!practice || typeof practice !== 'object') {
		return '';
	}

	const parts = [
		practice.id,
		practice.title,
		practice.category,
		practice.ecosystemBenefits,
		practice.ecosystem_benefits,
		practice.costs,
		practice.benefits,
		practice.complianceNotes,
		practice.compliance_notes,
		...(Array.isArray(practice.helps) ? practice.helps : []),
		...(Array.isArray(practice.tags) ? practice.tags : []),
		...(Array.isArray(practice.tmdls) ? practice.tmdls : []),
	];

	return parts.map(normalizeText).join(' ');
};

const getPracticeDescription = (practice, camelKey, snakeKey) => {
	return practice?.[camelKey] ?? practice?.[snakeKey] ?? '';
};

const PracticesGuide = ({ practicesData, title = 'Practices Guide', description }) => {
	const [searchText, setSearchText] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');

	const categoryOptions = useMemo(() => {
		const categories = new Set();
		(Array.isArray(practicesData) ? practicesData : []).forEach((practice) => {
			if (practice?.category) {
				categories.add(practice.category);
			}
		});
		return Array.from(categories).sort((a, b) => a.localeCompare(b));
	}, [practicesData]);

	const filteredPractices = useMemo(() => {
		const source = Array.isArray(practicesData) ? practicesData : [];
		const query = normalizeText(searchText).trim();

		return source.filter((practice) => {
			const matchesCategory = selectedCategory === 'all' || practice?.category === selectedCategory;
			if (!matchesCategory) {
				return false;
			}

			if (!query) {
				return true;
			}

			return flattenPracticeText(practice).includes(query);
		});
	}, [practicesData, searchText, selectedCategory]);

	const renderPracticeBody = (practice) => {
		const helps = Array.isArray(practice?.helps) ? practice.helps : [];
		const links = Array.isArray(practice?.links) ? practice.links : [];
		const tags = Array.isArray(practice?.tags) ? practice.tags : [];
		const tmdls = Array.isArray(practice?.tmdls) ? practice.tmdls : [];
        
		return (
			<Card size="small" style={{ marginTop: 8 }}>
				<Paragraph style={{ marginBottom: 8 }}>
					<Text strong>Category:</Text> {practice?.category || 'Uncategorized'}
				</Paragraph>

				{helps.length > 0 && (
					<Paragraph style={{ marginBottom: 8 }}>
						<Text strong>Helps with:</Text>{' '}
						<Space wrap>
							{helps.map((item) => (
								<Tag key={item}>{item}</Tag>
							))}
						</Space>
					</Paragraph>
				)}

				{tags.length > 0 && (
					<Paragraph style={{ marginBottom: 8 }}>
						<Text strong>Tags:</Text>{' '}
						<Space wrap>
							{tags.map((item) => (
								<Tag color="blue" key={item}>{item}</Tag>
							))}
						</Space>
					</Paragraph>
				)}

				{tmdls.length > 0 && (
					<Paragraph style={{ marginBottom: 8 }}>
						<Text strong>TMDLs:</Text>{' '}
						<Space wrap>
							{tmdls.map((item) => (
								<Tag color="geekblue" key={item}>{item}</Tag>
							))}
						</Space>
					</Paragraph>
				)}

                <br/>
                <Row>
                    <Col sm={12} md={6} style={{ padding: 8 }}>
                        <div> <Title level={5}>How it helps</Title> </div>
                        <div>{getPracticeDescription(practice, 'ecosystemBenefits', 'ecosystem_benefits') || 'No description available.'}</div>
                    </Col>

                    <Col sm={12} md={6} style={{ padding: 8 }}>
    	    			<div><Title level={5}>Costs</Title></div>
                        <div> {practice?.costs || 'No cost details available.'}</div>
	                </Col>
 
                    <Col sm={12} md={6} style={{ padding: 8 }}>
        				<div><Title level={5}>Benefits</Title></div>
                        <div> {practice?.benefits || 'No benefit details available.'}</div>
	                </Col>

                    <Col sm={12} md={6} style={{ padding: 8 }}>
    					<div><Title level={5    }>Compliance notes</Title></div>
    					<div> {practice?.complianceNotes ?? practice?.compliance_notes}</div>
	                </Col>
                </Row>    

				{links.length > 0 && (
					<Paragraph style={{ marginBottom: 0 }}>
                        <Divider />
						<Text strong>References:</Text>
						<ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18 }}>
							{links.map((link) => (
								<li key={link.url}>
									<a href={link.url} target="_blank" rel="noreferrer">
										{link.label || link.url}
									</a>
								</li>
							))}
						</ul>
					</Paragraph>
				)}
			</Card>
		);
	};

	return (
		<div style={{ width: '100%' }}>
			<Space direction="vertical" size="middle" style={{ width: '100%' }}>
				<div>
					<Typography.Title level={3} style={{ marginBottom: 8 }}>
						{title}
					</Typography.Title>
					<Paragraph style={{ marginBottom: 0 }}>
						{description || 'Search and filter agricultural water quality practices to find the right fit for a plan or recommendation.'}
					</Paragraph>
				</div>

				<Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
					<Search
						allowClear
						placeholder="Search practices, tags, benefits, or TMDLs"
						value={searchText}
						onChange={(event) => setSearchText(event.target.value)}
						onSearch={(value) => setSearchText(value)}
						style={{ width: 'min(32rem, 100%)' }}
					/>

					<Select
						value={selectedCategory}
						onChange={setSelectedCategory}
						style={{ width: 280 }}
						options={[
							{ label: 'All categories', value: 'all' },
							...categoryOptions.map((category) => ({ label: category, value: category })),
						]}
					/>
				</Space>

				<Paragraph style={{ marginBottom: 0 }}>
					<Text strong>{filteredPractices.length}</Text> practice{filteredPractices.length === 1 ? '' : 's'} match your search.
				</Paragraph>

				{filteredPractices.length === 0 ? (
					<Empty description="No practices match your search." />
				) : (
					<Collapse
						accordion={false}
						items={filteredPractices.map((practice) => ({
							key: practice.id,
							label: (
								<span>
									<Text strong>{practice.title || practice.id || 'Untitled practice'}</Text>
									{practice.category ? (
										<Tag style={{ marginLeft: 12 }}>{practice.category}</Tag>
									) : null}
								</span>
							),
							children: renderPracticeBody(practice),
						}))}
					/>
				)}
			</Space>
		</div>
	);
};

PracticesGuide.propTypes = {
	practicesData: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		title: PropTypes.string,
		category: PropTypes.string,
		helps: PropTypes.arrayOf(PropTypes.string),
		ecosystemBenefits: PropTypes.string,
		ecosystem_benefits: PropTypes.string,
		costs: PropTypes.string,
		benefits: PropTypes.string,
		complianceNotes: PropTypes.string,
		compliance_notes: PropTypes.string,
		links: PropTypes.arrayOf(PropTypes.shape({
			label: PropTypes.string,
			url: PropTypes.string,
		})),
		tags: PropTypes.arrayOf(PropTypes.string),
		tmdls: PropTypes.arrayOf(PropTypes.string),
	})),
	title: PropTypes.string,
	description: PropTypes.string,
};



export default PracticesGuide;
