import { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Select, Space, Typography } from 'antd';

import GrassedWaterwayCalc from './GrassedWaterwayCalc';

const { Text, Title } = Typography;

const calculatorOptions = [
	{
		label: 'Grassed Waterway',
		value: 'grassed_waterway',
		component: GrassedWaterwayCalc,
	},
];

export default function WQCalculators({ apiBase = 'https://agwater.org:5556' }) {
	const [selectedCalculator, setSelectedCalculator] = useState();
	const selectedOption = calculatorOptions.find(({ value }) => value === selectedCalculator);
	const Calculator = selectedOption?.component;

	return (
		<Space direction="vertical" size="large" style={{ display: 'flex' }}>
			<Card>
				<Title level={4}>Water Quality Calculators</Title>
				<Text type="secondary">Select a calculator to begin.</Text>
				<Select
					allowClear
					placeholder="Select a calculator"
					value={selectedCalculator}
					onChange={setSelectedCalculator}
					options={calculatorOptions.map(({ label, value }) => ({ label, value }))}
					style={{ display: 'block', marginTop: 16, maxWidth: 360, width: '100%' }}
				/>
			</Card>

			{Calculator && <Calculator apiBase={apiBase} />}
		</Space>
	);
}

WQCalculators.propTypes = {
	apiBase: PropTypes.string,
};
