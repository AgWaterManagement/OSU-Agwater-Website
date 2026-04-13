import React from "react";
import { Select, Typography } from "antd";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from "recharts";

const { Title } = Typography;

const CropWaterUseChart = ({
    chartData,
    selectedCrop,
    selectCropOptions,
    onSelectedCropChange
}) => {
    return (
        <div style={{ marginLeft: '1em' }}>
            <label htmlFor='selectCrop'>Select a crop from the list for crop-specific water use information: </label>
            <Select
                id='selectCrop'
                style={{ width: '20em' }}
                showSearch
                placeholder="Select a crop"
                optionFilterProp="label"
                onChange={onSelectedCropChange}
                options={selectCropOptions}
                value={selectedCrop}
            />
            <br />

            <ResponsiveContainer width="100%" height={360} style={{ backgroundColor: '#fefefe' }}>
                {selectedCrop && selectedCrop !== '' ? (
                    <Title level={4} style={{ color: 'black', textAlign: 'center' }}>Crop Water Use - {selectedCrop}</Title>
                ) : (
                    <Title level={4} style={{ color: 'black', textAlign: 'center' }}>Crop Water Use</Title>
                )}
                <LineChart
                    width='100%'
                    data={chartData}
                    margin={{
                        top: 5,
                        right: 45,
                        left: 20,
                        bottom: 50,
                    }}
                >
                    {chartData && chartData.length > 0 && 'Evapotranspiration ASCE-EWRI Alfalfa (in)' in chartData[0] && (
                        <Line key='ETr' name='Reference ET' type="monotone" dataKey='Evapotranspiration ASCE-EWRI Alfalfa (in)'
                            formatter={(value, name, props) => value.toFixed(2)}  unit=' in/day' stroke={"#202020"} />
                    )}
                    {chartData && chartData.length > 0 && selectedCrop && ("ETc (" + selectedCrop + ")" in chartData[0]) && (
                        <Line key='ETc' type="monotone" dataKey={"ETc (" + selectedCrop + ")"}
                            formatter={(value, name, props) => value.toFixed(2)} unit=' in/day' stroke={"#2020EE"} />
                    )}
                    {chartData && chartData.length > 0 && selectedCrop && (selectedCrop + " (historical)" in chartData[0]) && (
                        <Line key='ETc' type="monotone" dataKey={selectedCrop + " (historical)"} formatter={(value, name, props) => value.toFixed(2)}
                            unit=' in/day' stroke={"#EE2020"} />
                    )}

                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Date" type="category" allowDuplicatedCategory={false} name='Days' />
                    <YAxis label={{
                        value: `Crop Water Use - in/day`,
                        style: { textAnchor: 'middle' },
                        angle: -90,
                        position: 'left',
                        offset: 0,
                    }}
                    />
                    <Tooltip />
                    <Legend />
                </LineChart>
            </ResponsiveContainer>
            <br />
        </div>
    );
};

export default CropWaterUseChart;