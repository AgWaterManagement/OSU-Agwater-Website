import { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Select, Space, Row, Col, Typography } from 'antd';

import LocatorMap from './LocatorMap';
import GrassedWaterwayCalc from './GrassedWaterwayCalc';

const { Text, Title } = Typography;



export default function WQCalculators({ apiBase = 'https://agwater.org:5556' }) {
    const calculatorOptions = [
        {
            label: 'Grassed Waterway',
            value: 'grassed_waterway',
            component: GrassedWaterwayCalc,
        },
    ];

    const [selectedCalculator, setSelectedCalculator] = useState();
    const selectedOption = calculatorOptions.find(({ value }) => value === selectedCalculator);
    const Calculator = selectedOption?.component;

    const onChange = key => {
        console.log(key);
    };

    const tabs = [
        {
            key: '1',
            label: '1. Specify Site',
            children: <LocatorMap />,
        },
        {
            key: '2',
            label: '2. Select a Calculator',
            children: (
                <>
                    <Text type="secondary">Select a calculator to begin.</Text>
                    <Select
                        allowClear
                        placeholder="Select a calculator"
                        value={selectedCalculator}
                        onChange={setSelectedCalculator}
                        options={calculatorOptions.map(({ label, value }) => ({ label, value }))}
                        style={{ display: 'block', marginTop: 16, maxWidth: 360, width: '100%' }}
                    />
                    {Calculator && <Calculator apiBase={apiBase} />}
                </>
            ),
        },
    ];

    return (
        <Space direction="vertical" size="large" style={{ display: 'flex' }}>
            <Card>
                <Title level={4}>Water Quality Calculators</Title>

                <Row>
                    <Col sm={24} md={12} style={{ padding: '1em'}}>
                        <LocatorMap />
                    </Col>
                    <Col sm={24} md={12} style={{ padding: '1em'}}>

                        <Text type="secondary">Select a calculator to begin.</Text>
                        <Select
                            allowClear
                            placeholder="Select a calculator"
                            value={selectedCalculator}
                            onChange={setSelectedCalculator}
                            options={calculatorOptions.map(({ label, value }) => ({ label, value }))}
                            style={{ display: 'block', marginTop: 16, maxWidth: 360, width: '100%' }}
                        />
                        {Calculator && <Calculator apiBase={apiBase} />}

                    </Col>
                </Row>

            </Card>

        </Space>
    );
}

WQCalculators.propTypes = {
    apiBase: PropTypes.string,
};
