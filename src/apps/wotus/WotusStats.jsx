import { useEffect, useState, useRef } from 'react';

import { Typography, Statistic, Table, Row, Col, Radio, Spin, Button, Card, Tag, Divider } from 'antd';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, Legend, Tooltip, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { useMediaQuery } from 'react-responsive';
import { secrets } from '../../secrets';


const { Title, Text } = Typography;


//import wetlandSummaryData from './All_States_Wetlands_area_summary.json';

const WotusStats = ({ domain, streamQuery, wetlandQuery, currentState, currentStateLabel }) => {

    const [totalResult, setTotalResult] = useState('-');
    const [queryResult, setQueryResult] = useState('-');
    const [tableData, setTableData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [radarData, setRadarData] = useState([]);
    const [showProtected, setShowProtected] = useState(true);
    const [showPieChart, setShowPieChart] = useState(false);
    const [showFractionChart, setShowFractionChart] = useState(true);

    const [loading, setLoading] = useState(false);

    const fraction = useRef(0);
    let maxValue = 100;

    const wetlandTypes = ['Estuarine Marine Deepwater',
        'Estuarine Marine Wetland',
        'Freshwater Emergent Wetland',
        'Freshwater Forested Shrub Wetland',
        'Freshwater Pond',
        'Lake',
        'Other',
        'Riverine'];

    // fetch data from the API when the componet loads
    // and when the currentState prop changes
    useEffect(() => {
        if (domain == 'wetlands')
            GetWetlandsData();
        else if (domain == 'streams')
            GetStreamsData();

    }, [domain, streamQuery, wetlandQuery, currentState, showProtected]);

    useEffect(() => {
        if (domain == 'wetlands')
            GetWetlandsData();
        else if (domain == 'streams')
            GetStreamsData();
    }, []);

    const GetStreamsData = () => {
        // State=OR&Near_Order=3&Drainage_Area_Threshold=1.0
        // Streams with an order less than or equal to this value will be included. The default value is 3.
        // Drainage_Area_Threshold is the minimum total upstream drainage area
        // (in square kilometers) to filter the data. Streams with a drainage area greater than or equal to this
        // threshold will be included. The default value is 1.0 square kilometers.
        if (!streamQuery || streamQuery.length == 0)
            return;

        console.log(`Fetching stream data with query: ${streamQuery}`);
        setLoading(true);
        const url = `https://agwater.org:5556/wotus/streams?${streamQuery}`;
        fetch(url, {
            headers: {
                "X-API-Key": secrets.agwater_api_key
            }
        })
            .then(response => response.json())
            .then(result => {
                if (!result.success) {
                    console.error('Error fetching data:', result.message);
                    return;
                }

                console.log('Stream data fetched successfully:', result.data);
                setTotalResult((result.data.total_stream_length / 1.609).toFixed(0));
                setQueryResult((result.data.query_stream_length / 1.609).toFixed(0));
                fraction.current = result.data.total_stream_length > 0 ? (result.data.query_stream_length / result.data.total_stream_length) * 100 : 0;
                fraction.current = fraction.current.toFixed(1);
                console.log(`Fetch results: Total stream length: ${result.data.total_stream_length}, Query stream length: ${result.data.query_stream_length}, Fraction: ${fraction.current}%`);

                // get totals across stats
                let totalLength = 0;
                let totalNetworkFraction = 0;
                let totalLengthProtected = 0;
                maxValue = 0;
                for (const [order, values] of Object.entries(result.data.by_stream_order)) {
                    values.network_fraction = result.data.total_stream_length > 0 ? (values.total_stream_order_length / result.data.total_stream_length) * 100 : 0;
                    totalLength += values.total_stream_order_length;
                    totalNetworkFraction += values.network_fraction;
                    totalLengthProtected += values.query_stream_order_length;
                    if (totalLength > maxValue) {
                        maxValue = totalLength;
                    }
                }

                let _chartData = [];
                let _tableData = [];
                let _radarData = []
                let aggVal = 0;

                // populate chart data for each stream order 
                for (const [order, values] of Object.entries(result.data.by_stream_order)) {
                    if (order < 4) {
                        _chartData.push({
                            name: `Order ${order}`,
                            value: showProtected ? values.query_stream_order_length : values.total_stream_order_length,
                        });
                    } else {
                        aggVal += showProtected ? values.query_stream_order_length : values.total_stream_order_length;
                    }

                    _radarData.push({
                        order: `Order ${order}`,
                        total: values.total_stream_order_length,
                        protected: values.query_stream_order_length,
                        fractionProtected: values.total_stream_order_length > 0 ? (values.query_stream_order_length / values.total_stream_order_length) * 100 : 0,
                        maxValue: maxValue
                    });

                    // if last key, push agg chart data
                    if (order == Object.keys(result.data.by_stream_order).slice(-1)[0]) {
                        _chartData.push({
                            name: `Order 4+`,
                            value: aggVal
                        });
                    }

                    // populate table data
                    _tableData.push({
                        key: order,  // e.g. 1, 2, 3, 4
                        order: order,
                        networkFraction: totalNetworkFraction > 0 ? ((values.total_stream_order_length / result.data.total_stream_length) * 100).toFixed(1) + '%' : '0%',
                        total: values.total_stream_order_length.toFixed(0),
                        protected: values.query_stream_order_length.toFixed(0),
                        fractionProtected: result.data.total_stream_length > 0 ? ((values.query_stream_order_length / values.total_stream_order_length) * 100).toFixed(1) + '%' : '0%'
                    });
                }
                _tableData.push({
                    key: 'total',
                    order: 'Total',
                    networkFraction: totalNetworkFraction > 0 ? totalNetworkFraction.toFixed(1) + '%' : '0%',
                    total: totalLength.toFixed(0),
                    protected: totalLengthProtected.toFixed(0),
                    fractionProtected: fraction.current + '%'
                });
                //console.log('Chart/Table data is being updated');
                //console.log(_chartData);
                //console.log(_tableData);
                setChartData(_chartData);
                setTableData(_tableData);
                setRadarData(_radarData);
            })
            .catch(error => console.error('Error fetching data:', error))
            .finally(() => setLoading(false));

        return;
    }


    const GetWetlandsData = () => {
        //State (str): The US state code (e.g., 'CA' for California) to filter wetlands data. If no state is provided,
        //    data for all states will be returned. However, returning data for all states is very time-consuming,
        //    so it is recommended to specify a state. The default value is 'OR' (Oregon).
        //Wetland_Class (list[str], optional): A list of wetland classes to filter the data, with each wetland class represented
        //    as a character. If not provided, all wetland classes will be included.
        //Wetland_Type_Code (list[int], optional): A list of wetland type codes to filter the data. Each code is an integer representing a specific
        //    wetland type. If not provided, all wetland types will be included.
        //Human_Impact (int, optional): An integer value representing if human activity has an impact on the wetlands to filter the data.
        //    The values are 0 for no human impact, and 1 for human impact. If not provided, wetlands with any level of human impact will be included.
        //Water_Regime_Code (list[int], optional): A list of water regime codes to filter the data. Each code is an integer representing a specific
        //    water regime. If not provided, all water regimes will be included.
        //State_Wetland_Protection (list[int], optional): A list of integers representing the level of state wetland protection to filter the data.
        //    The values are 1, 2, and 3. If not provided, wetlands with any protection status will be included.
        //Near_Order (int, optional): An integer value representing the order of the nearest stream to consider a wetland as potentially protected. The default value is 1.
        //Near_Dist_Threshold (int, optional): An integer value representing the distance threshold (in meters) to consider a wetland as
        //    potentially protected based on its proximity to the nearest PROTECTED stream. The default value is 150 meters.

        // State=OR&Wetland_Class=[list strs]&Wetland_Type_Code=[list ints]&Human_Impact=1&Water_Regime_Code=[list ints]&
        // State_Wetland_Protection=[list ints]&Near_Dist_Threshold=[int]

        setLoading(true);
        console.log(`Fetching wetland data with query: ${wetlandQuery}`);
        const url = `https://agwater.org:5556/wotus/wetlands?${wetlandQuery}`;
        fetch(url, {
            headers: {
                "X-API-Key": secrets.agwater_api_key
            }
        })
            .then(response => response.json())
            .then(result => {
                if (!result.success) {
                    console.error('Error fetching data:', result.message);
                    return;
                }
                setTotalResult(result.data.total_wetlands_area.toFixed(0));
                setQueryResult(result.data.query_wetlands_area.toFixed(0));
                fraction.current = result.data.total_wetlands_area > 0 ? (result.data.query_wetlands_area / result.data.total_wetlands_area) * 100 : 0;
                fraction.current = fraction.current.toFixed(1);
                console.log(`Fetch results: Total wetlands area: ${result.data.total_wetlands_area}, Query wetlands area: ${result.data.query_wetlands_area}, Fraction: ${fraction.current}%`);

                // parse results to generate data used for charting
                let _chartData = [];
                let _tableData = [];
                let _radarData = [];

                // compute the fraction of the total wetlands area that is of the given type

                let totalArea = 0;
                let totalLandscapeFraction = 0;
                let totalAreaProtected = 0;
                maxValue = 0;
                //let totalFractionProtected = 0;
                for (const [type, values] of Object.entries(result.data.by_wetland_type)) {
                    values.landscape_fraction = result.data.total_wetlands_area > 0 ? (values.total_wetlands_type_area / result.data.total_wetlands_area) * 100 : 0;
                    totalArea += values.total_wetlands_type_area;
                    totalLandscapeFraction += values.landscape_fraction;
                    totalAreaProtected += values.query_wetlands_type_area;
                    if (values.total_wetlands_type_area > maxValue) {
                        maxValue = values.total_wetlands_type_area;
                    }
                    //totalFractionProtected += result.data.total_wetlands_area > 0 ? (values.query_wetlands_type_area / values.total_wetlands_type_area) * 100 : 0;
                }

                for (const [type, values] of Object.entries(result.data.by_wetland_type)) {
                    const value = showProtected ? values.query_wetlands_type_area : values.total_wetlands_type_area;

                    if (value > 10000) { // only include types with > 10000 acres for clarity

                        _chartData.push({
                            name: wetlandTypes[parseInt(type) - 1],
                            value: showProtected ? values.query_wetlands_type_area : values.total_wetlands_type_area
                        });

                        _radarData.push({
                            type: wetlandTypes[parseInt(type) - 1],
                            total: values.total_wetlands_type_area,
                            protected: values.query_wetlands_type_area,
                            fractionProtected: values.total_wetlands_type_area > 0 ? (values.query_wetlands_type_area / values.total_wetlands_type_area) * 100 : 0,
                            maxValue: maxValue
                        });

                    }

                    _tableData.push({
                        key: wetlandTypes[parseInt(type) - 1],
                        type: wetlandTypes[parseInt(type) - 1],
                        landscapeFraction: totalLandscapeFraction > 0 ? ((values.total_wetlands_type_area / totalArea) * 100).toFixed(1) + '%' : '0%',
                        total: values.total_wetlands_type_area.toFixed(0),
                        protected: values.query_wetlands_type_area.toFixed(0),
                        fractionProtected: result.data.total_wetlands_area > 0 ? ((values.query_wetlands_type_area / values.total_wetlands_type_area) * 100).toFixed(1) + '%' : '0%'
                    });
                }

                _tableData.push({
                    key: 'Total',
                    type: 'Total',
                    landscapeFraction: result.data.total_wetlands_area > 0 ? '100%' : '0%',
                    total: totalArea.toFixed(0),
                    protected: totalAreaProtected.toFixed(0),
                    fractionProtected: fraction.current + '%'
                });

                setChartData(_chartData);
                setTableData(_tableData);
                setRadarData(_radarData);
            })
            .catch(error => console.error('Error fetching data:', error))
            .finally(() => setLoading(false));

        return;
    }

    let totalAreaTitle = `Total Wetland Area`;
    let protectedAreaTitle = `Protected Wetland Area`;
    let protectedFractionTitle = `Fraction of Wetland Area Protected`;

    if (domain == 'streams') {
        totalAreaTitle = `Total Stream Length`;
        protectedAreaTitle = `Protected Stream Length`;
        protectedFractionTitle = `Fraction of Stream Reaches Protected`;
    }

    let stateLabel = currentState == 'conus' ? 'Contiguous US' : currentStateLabel;
    const title = (domain == 'streams' ? 'Stream Protection Summary' : 'Wetland Protection Summary') + ': ' + stateLabel;

    const formatter = new Intl.NumberFormat('en-US');
    
    // Media queries for responsive design
    //const isMobile = useMediaQuery({ maxWidth: 768 });
    //const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });
    const isLargeDesktop = useMediaQuery({ minWidth: 1600 });

    return (
        <Spin spinning={loading} tip="Fetching data...">
        <Row gutter={[16, 16]} align="start">
            {/* ── Main stats content ── */}
            <Col xs={24} xl={24} style={{ transition: 'all 0.3s' }}>

            <Row gutter={[8, 8]} style={{ marginBottom: '2em' }}>
                <Col xs={24} md={10}>

                    <Title level={4} style={{  marginTop: 0 }}>{title}</Title>

                    <Statistic
                        style={{ marginBottom: '1em' }}
                        title={<Text>{totalAreaTitle}</Text>}
                        value={formatter.format(totalResult) + (domain == 'streams' ? ' miles' : ' acres')} />

                    <Statistic
                        style={{ marginBottom: '1em' }}
                        title={<Text>{protectedAreaTitle}</Text>}
                        value={formatter.format(queryResult) + (domain == 'streams' ? ' miles' : ' acres')} />
                    <Statistic
                        style={{ marginBottom: '1em' }}
                        title={<Text>{protectedFractionTitle}</Text>}
                        value={`${fraction.current}%`} />
                </Col>
                <Col xs={24} md={14} style={{}}>
                    <Row style={{ width: '100%' }}>
                        {(showPieChart || isLargeDesktop) && (
                            <Col xs={24} xxl={12} >
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            label={({ name, value }) => `${name}: ${value.toFixed(0)} ${domain == 'streams' ? 'mi' : 'ac'}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            <Cell fill="#cbb0eaff" />
                                            <Cell fill="#82ca9d" />
                                            <Cell fill="#ffc658" />
                                            <Cell fill="#5887ffda" />
                                            <Cell fill="#ff5858ff" />
                                            <Cell fill="#145f08d5" />
                                            <Cell fill="#ffff58ff" />
                                            <Cell fill="#970bf4ff" />
                                        </Pie>
                                        <Tooltip labelStyle={{backgroundColor: '#1e88e5' }} formatter={(value) => `${value.toFixed(0)} ${domain == 'streams' ? 'mi' : 'ac'}`} />
                                    </PieChart>
                                    <Radio.Group style={{ marginTop: '1em', textAlign: 'center', width: '100%' }} defaultValue="protected"
                                                 onChange={e => setShowProtected(e.target.value === 'protected')}>
                                        <Radio.Button value="protected">Protected {domain == 'streams' ? 'Length' : 'Area'} </Radio.Button>
                                        <Radio.Button value="total">Total {domain == 'streams' ? 'Length' : 'Area'}</Radio.Button>
                                    </Radio.Group>
                                </ResponsiveContainer>
                                {!isLargeDesktop && (
                                    <div style={{
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '3em',
                                        textAlign: 'center', width: '100%'
                                    }}>
                                        <Button type="link" onClick={() => setShowPieChart(false)} >Show Radar Chart</Button>
                                    </div>
                                )}
                            </Col>
                        )}

                        {(!showPieChart || isLargeDesktop) && (
                            <Col xs={24} xxl={12}>
                                <ResponsiveContainer width="100%" height={280} style={{ marginBottom: '1em' }}>
                                    <RadarChart
                                        responsive
                                        outerRadius="80%"
                                        data={radarData}
                                    >
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey={domain === "streams" ? "order" : "type"} />

                                        { showFractionChart ? (
                                            <Radar name="Fraction Protected (%)" dataKey="fractionProtected" stroke="#059c14ff" fill="#059c14ff" fillOpacity={0.6} />
                                        ) : ( <>
                                            <Radar name={domain === "streams" ? "Total Length" : "Total Area"} dataKey="total" stroke="#b03d0cff" fill="#b03d0cff" fillOpacity={0.6} />
                                            <Radar name={domain === "streams" ? "Protected Length" : "Protected Area"} dataKey="protected" stroke="#059c14ff" fill="#059c14ff" fillOpacity={0.6} />
                                            </>
                                        )}

                                        <Legend />
                                        <Tooltip labelStyle={{backgroundColor: '#1e88e5' }} formatter={(value) => `${value.toFixed(0)} ${showFractionChart ? '' : (domain == 'streams' ? 'mi' : 'ac') }`} />

                                    </RadarChart>
                                    <Radio.Group style={{ marginTop: '1em', textAlign: 'center', width: '100%' }} defaultValue="fraction" 
                                                 onChange={e => setShowFractionChart(e.target.value === 'fraction')}>
                                        <Radio.Button value="fraction">Fraction</Radio.Button>
                                        <Radio.Button value="area">{domain == 'streams' ? 'Lengths' : 'Area'}</Radio.Button>
                                    </Radio.Group>
                                </ResponsiveContainer>

                                {!isLargeDesktop && (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2em', textAlign: 'center', width: '100%' }}>
                                        <Button type="link" onClick={() => setShowPieChart(true)} >Show Pie Chart</Button>
                                    </div>
                                )}

                            </Col>
                        )}
                        <br />
                    </Row>
                </Col>
            </Row>

            <hr />

            {domain == 'streams' && (
                <Table columns={[
                    { title: 'Stream Order', dataIndex: 'order', key: 'order', align: 'center' },
                    { title: 'Network Fraction', dataIndex: 'networkFraction', key: 'networkFraction', align: 'center' },
                    { title: 'Total Length', dataIndex: 'total', key: 'total', align: 'center' },
                    { title: 'Miles Protected', dataIndex: 'protected', key: 'protected', align: 'center' },
                    { title: 'Fraction Protected', dataIndex: 'fractionProtected', key: 'fractionProtected', align: 'center' },]}
                    dataSource={tableData}
                />
            )}

            {domain == 'wetlands' && (
                <Table columns={[
                    { title: 'Wetlands Type', dataIndex: 'type', key: 'type', },
                    { title: 'Landscape Fraction', dataIndex: 'landscapeFraction', key: 'landscapeFraction', align: 'center' },
                    { title: 'Total Acres', dataIndex: 'total', key: 'total', align: 'center' },
                    { title: 'Acres Protected', dataIndex: 'protected', key: 'protected', align: 'center' },
                    { title: 'Fraction Protected', dataIndex: 'fractionProtected', key: 'fractionProtected', align: 'center' },]}
                    dataSource={tableData}
                />
            )}

            </Col>

        </Row>
        </Spin>
    );
};

WotusStats.propTypes = {
    domain: PropTypes.string.isRequired,
    streamQuery: PropTypes.string.isRequired,
    wetlandQuery: PropTypes.string.isRequired,
    currentState: PropTypes.string.isRequired,
    currentStateLabel: PropTypes.string.isRequired
};



export default WotusStats;