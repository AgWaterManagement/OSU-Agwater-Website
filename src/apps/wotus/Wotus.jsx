import { useRef, useState, useEffect } from 'react';
import { Popover, Typography, Row, Col, Radio, Divider, Checkbox, Select, Tabs, InputNumber, Button, Image } from 'antd';

import { QuestionCircleTwoTone } from '@ant-design/icons';

import WotusMap from './WotusMap';
import WotusStats from './WotusStats';
import './wotus.css'; // Import your custom CSS file

//import ValuePicker from '@arcgis/core/widgets/ValuePicker';

const { Title, Text } = Typography;
const { Option } = Select;

const US_STATES = [
    { abbr: 'AL', name: 'Alabama' },
    //{ abbr: 'AK', name: 'Alaska' },
    { abbr: 'AZ', name: 'Arizona' },
    { abbr: 'AR', name: 'Arkansas' },
    { abbr: 'CA', name: 'California' },
    { abbr: 'CO', name: 'Colorado' },
    { abbr: 'CT', name: 'Connecticut' },
    { abbr: 'DE', name: 'Delaware' },
    { abbr: 'FL', name: 'Florida' },
    { abbr: 'GA', name: 'Georgia' },
    //{ abbr: 'HI', name: 'Hawaii' },
    { abbr: 'ID', name: 'Idaho' },
    { abbr: 'IL', name: 'Illinois' },
    { abbr: 'IN', name: 'Indiana' },
    { abbr: 'IA', name: 'Iowa' },
    { abbr: 'KS', name: 'Kansas' },
    { abbr: 'KY', name: 'Kentucky' },
    { abbr: 'LA', name: 'Louisiana' },
    { abbr: 'ME', name: 'Maine' },
    { abbr: 'MD', name: 'Maryland' },
    { abbr: 'MA', name: 'Massachusetts' },
    { abbr: 'MI', name: 'Michigan' },
    { abbr: 'MN', name: 'Minnesota' },
    { abbr: 'MS', name: 'Mississippi' },
    { abbr: 'MO', name: 'Missouri' },
    { abbr: 'MT', name: 'Montana' },
    { abbr: 'NE', name: 'Nebraska' },
    { abbr: 'NV', name: 'Nevada' },
    { abbr: 'NH', name: 'New Hampshire' },
    { abbr: 'NJ', name: 'New Jersey' },
    { abbr: 'NM', name: 'New Mexico' },
    { abbr: 'NY', name: 'New York' },
    { abbr: 'NC', name: 'North Carolina' },
    { abbr: 'ND', name: 'North Dakota' },
    { abbr: 'OH', name: 'Ohio' },
    { abbr: 'OK', name: 'Oklahoma' },
    { abbr: 'OR', name: 'Oregon' },
    { abbr: 'PA', name: 'Pennsylvania' },
    { abbr: 'RI', name: 'Rhode Island' },
    { abbr: 'SC', name: 'South Carolina' },
    { abbr: 'SD', name: 'South Dakota' },
    { abbr: 'TN', name: 'Tennessee' },
    { abbr: 'TX', name: 'Texas' },
    { abbr: 'UT', name: 'Utah' },
    { abbr: 'VT', name: 'Vermont' },
    { abbr: 'VA', name: 'Virginia' },
    { abbr: 'WA', name: 'Washington' },
    { abbr: 'WV', name: 'West Virginia' },
    { abbr: 'WI', name: 'Wisconsin' },
    { abbr: 'WY', name: 'Wyoming' }
];

const streamTypes = {
'Connector': [33400],
'Canal/Ditch': [33600, 33601, 33603],
'Underground Conduit': [42000, 42001, 42002, 42003],
'Pipeline': [42800, 42801, 42802, 42803, 42804, 42805, 42806, 42807, 42808, 42809, 42810, 42811, 42812, 42813, 42814, 42815, 42816, 44820, 44821, 44822, 44823, 44824],
'Stream/River': [46000],
'Stream/River intermittent': [46003],
'Stream/River perennial': [46006],
'Stream/River ephemeral': [46007],
'Drainageway': [46800],
'Artificial Path': [55800],
'Coastline': [56600]
}


const Wotus = () => {
    const [domain, setDomain] = useState('streams');
    const [streamLens, setStreamLens] = useState('stats');
    const [wetlandLens, setWetlandLens] = useState('stats');
    //const [queryParams, setQueryParams] = useState('stream_order=1');  // Default is for state=OR, and for stream_order=1
    const [wetlandQueryParams, setWetlandQueryParams] = useState('wetland_type=freshwater_emergent');  // Default is for state=OR, and for freshwater emergent wetlands
    const [streamQueryParams, setStreamQueryParams] = useState('near_order=1');  // Default is for state=OR, and for near_order=1
    const [showIntro, setShowIntro] = useState(false);

    const [currentState, setCurrentState] = useState('OR');
    const [currentStateLabel, setCurrentStateLabel] = useState('Oregon');
    const mapViewState = useRef({ center: '-98.5795, 39.8283', zoom: 3 });
    const handleMapViewStateChange = (state) => { mapViewState.current = state; };


    const st_connector = useRef(false);
    const st_canalDitch = useRef(false);
    const st_undergroundConduit = useRef(false);
    const st_pipeline = useRef(false);
    const st_streamRiver = useRef(true);
    const st_streamRiverIntermittent = useRef(true);
    const st_streamRiverPerennial = useRef(true);
    const st_streamRiverEphemeral = useRef(false);
    const st_drainageway = useRef(false);
    const st_artificialPath = useRef(false);
    const st_coastline = useRef(false);


    // stream order/drainage area protection criteria
    const [useStreamOrder, setUseStreamOrder] = useState(true);
    const useDrainageArea = useRef(false);
    //const streamOrderThreshold = useRef(0);
    const [streamOrderThreshold, setStreamOrderThreshold] = useState(1);
    const [wetlandStreamOrderThreshold, setWetlandStreamOrderThreshold] = useState(1);

    const drainageAreaThreshold = useRef(0);
    const [streamOrderPopoverVisible, setStreamOrderPopoverVisible] = useState(false);
    const [drainageAreaPopoverVisible, setDrainageAreaPopoverVisible] = useState(false);

    // wetland types checkboxes
    const [wetlandTypePopoverVisible, setWetlandTypePopoverVisible] = useState(false);
    const wt_estuarineMarineDeepwater = useRef(false);
    const wt_estuarineMarineWetland = useRef(false);
    const wt_freshwaterEmergentWetland = useRef(true);
    const wt_freshwaterForestedShrubWetland = useRef(true);
    const wt_freshwaterPond = useRef(true);
    const wt_lake = useRef(true);
    const wt_other = useRef(true);
    const wt_riverine = useRef(true);

    // hydrologic regime
    const [useHydroRegime, setUseHydroRegime] = useState(true);
    const [hydroRegimePopoverVisible, setHydroRegimePopoverVisible] = useState(false);
    const hr_tempFlooded = useRef(true);
    const hr_seasonallySaturated = useRef(true);
    const hr_seasonallyFlooded = useRef(true);
    const hr_continuouslySaturated = useRef(true);
    const hr_seasonallyFloodedSaturated = useRef(true);
    const hr_semipermanentlyFlooded = useRef(true);
    const hr_intermittentlyExposed = useRef(true);
    const hr_permanentlyFlooded = useRef(true);

    const [useWetlandDistance, setUseWetlandDistance] = useState(true);
    const [wetlandDistancePopoverVisible, setWetlandDistancePopoverVisible] = useState(false);
    const wetlandDistanceThreshold = useRef(1000);

    const includeArtificialWetlands = useRef(false);
    const [includeArtificialWetlandsPopoverVisible, setIncludeArtificialWetlandsPopoverVisible] = useState(false);

    // initialization
    useEffect(() => {
        BuildQueryParams(domain);
    }, []);


    useEffect(() => {
        BuildQueryParams(domain);
    }, [currentState, domain, useStreamOrder, streamOrderThreshold, wetlandStreamOrderThreshold, useWetlandDistance, useHydroRegime, includeArtificialWetlands.current]);


    const onChangeUseStreamOrder = (value) => {
        setUseStreamOrder(value);
        useDrainageArea.current = !value;
        BuildQueryParams(domain);
    };

    const onChangeDomain = (key) => {
        setDomain(key);
        BuildQueryParams(key);
    };


    // a state is selected, load the layer
    const handleSelectState = (stateAbbr) => {
        setCurrentState(stateAbbr);

        const state = US_STATES.find((s) => s.abbr === stateAbbr);
        setCurrentStateLabel(state ? state.name : null);
    };

    const BuildQueryParams = (domain) => {
        let _queryParams = ''
        if (currentState != 'conus')
            _queryParams += `state=${currentState}`;

        if (domain === 'streams') {
            _queryParams += `&stream_type_code=`
            _queryParams += st_streamRiver.current ? `46000,` : '';
            _queryParams += st_streamRiverIntermittent.current ? `46003,` : '';
            _queryParams += st_streamRiverPerennial.current ? `46006,` : '';
            _queryParams += st_streamRiverEphemeral.current ? `46007,` : '';
            _queryParams += st_drainageway.current ? `46800,` : '';
            _queryParams += st_connector.current ? `33400,` : '';
            _queryParams += st_canalDitch.current ? `33600,33601,33603,` : '';
            _queryParams += st_undergroundConduit.current ? `42000,42001,42002,42003,` : '';
            _queryParams += st_pipeline.current ? `42800,42801,42802,42803,42804,42805,42806,42807,42808,42809,42810,42811,42812,42813,42814,42815,42816,44820,44821,44822,44823,44824,` : '';
            _queryParams += st_artificialPath.current ? `55800,` : '';
            _queryParams += st_coastline.current ? `56600,` : '';
            _queryParams = _queryParams.replace(/,$/, ''); // remove trailing comma
            
            if (useStreamOrder)
                _queryParams += `&stream_order=${streamOrderThreshold}`;
            else
                _queryParams += `&drainage_area_threshold=${drainageAreaThreshold.current}`;

            console.log(`Built stream query params: ${_queryParams}`);
            setStreamQueryParams(_queryParams);

        } else if (domain === 'wetlands') {

            _queryParams += `&wetland_type_code=`
            _queryParams += wt_estuarineMarineDeepwater.current ? `1,` : '';
            _queryParams += wt_estuarineMarineWetland.current ? `2,` : '';
            _queryParams += wt_freshwaterEmergentWetland.current ? `3,` : '';
            _queryParams += wt_freshwaterForestedShrubWetland.current ? `4,` : '';
            _queryParams += wt_freshwaterPond.current ? `5,` : '';
            _queryParams += wt_lake.current ? `6,` : '';
            _queryParams += wt_other.current ? `7,` : '';
            _queryParams += wt_riverine.current ? `8,` : '';
            _queryParams = _queryParams.replace(/,$/, ''); // remove trailing comma

            if (useStreamOrder) {
                //_queryParams += `&stream_order=${wetlandStreamOrderThreshold}`;
                _queryParams += `&near_order=${wetlandStreamOrderThreshold}`;
                //_queryParams += `&drainage_area_threshold=${drainageAreaThreshold.current}`;
                _queryParams += `&near_distance_threshold=${wetlandDistanceThreshold.current}`;
            }

            // 'include_human_impacted'=0 for only wetlands with NO human impact
            // 'include_human_impacted'=1 for ALL wetlands, including those impacted by humans.
            _queryParams += `&include_human_impacted=${includeArtificialWetlands.current ? 1 : 0}`;

            if (useHydroRegime) {
                _queryParams += `&water_regime_code=`;
                if (hr_tempFlooded.current) _queryParams += `2,`;
                if (hr_seasonallySaturated.current) _queryParams += `3,`;
                if (hr_continuouslySaturated.current) _queryParams += `4,`;
                if (hr_seasonallyFlooded.current) _queryParams += `5,`;
                if (hr_seasonallyFloodedSaturated.current) _queryParams += `6,`;
                if (hr_semipermanentlyFlooded.current) _queryParams += `7,`;
                if (hr_intermittentlyExposed.current) _queryParams += `8,`;
                if (hr_permanentlyFlooded.current) _queryParams += `9,`;
                _queryParams = _queryParams.replace(/,$/, ''); // remove trailing comma
            }

            if (useWetlandDistance)
                _queryParams += `&near_dist_threshold=${wetlandDistanceThreshold.current}`;

            console.log(`Built wetland query params: ${_queryParams}`);
            setWetlandQueryParams(_queryParams);
        }
    }


    //console.log(`Rendering Wotus component: currentState=${currentState}, domain=${domain}, lens=${lens}, queryParams=${queryParams}`); 
    return (
        <>
            <div style={{ padding: '10px' }}>
                <Title level={2}>Protected Streams and Wetlands of the Conterminous United States</Title>

                <p>This application explores protection levels provided to streams and wetlands associated with Waters of the United States (WOTUS).
                    Stream/Wetland protection is provided through various conservation programs and land management practices aimed at preserving water quality
                    and ecosystem health.  Setting various criteria specified below, you can get a sense of what streams and wetland would be protected by using those criteria.
                </p>

                {showIntro ? (<>

                    <p>
                        At the federal level, the Clean Water Act (CWA) plays a crucial role in regulating discharges into WOTUS, including streams and wetlands.
                        State-level programs may also contribute to the protection of these water bodies through additional regulations, conservation easements, and habitat restoration initiatives.</p>
                    <p>
                        For <b>streams</b>, protection status of a stream reach under the Clean Water Act is largely based on the <i>stream order</i> -
                        a classification system that ranks streams based on their upstream connectivity.  Headwater streams (with no upstream reaches) are designated
                        as Stream Order 1;  as you move down a stream network from headwaters to discharge into receiving water, the stream order increases.
                        Higher-order streams (e.g., Order 4 and above) typically represent larger stream reaches with greater flow volumes. </p>
                    <p>
                        For <b>wetlands</b>, protection status is influenced by their association with streams of different orders.
                        Wetlands connected to higher-order streams often receive greater protection due to their significant role in maintaining water quality,
                        providing habitat for diverse species, and supporting overall ecosystem health.
                    </p>
                    <p>A complete <a href='https://www.fws.gov/sites/default/files/documents/Classification-of-Wetlands-and-Deepwater-Habitats-of-the-United-States-2013.pdf'>
                        description of classification systems used to characterize wetlands</a> is available from the US Fish and Wildlife Service. A <a href='https://www.fws.gov/sites/default/files/documents/wetlands-and-deepwater-map-code-diagram.pdf'>Wetlands and Deepwater Habitats code diagram</a> is also available.</p>

                    <Button type="link" onClick={() => setShowIntro(false)}>Show Less Information</Button>
                </>) : (
                    <Button type="link" onClick={() => setShowIntro(true)}>Show More Information</Button>

                )}
                <hr />
                <Row gutter={16} style={{}}>
                    <Col xs={24} md={24}>

                        <div style={{ marginBottom: '0.5em', paddingLeft: '0.5em' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'yellow' }}>Select a State:</span>&nbsp;&nbsp;
                            <Select
                                placeholder="Select a state..."
                                style={{ width: '32em', marginBottom: '10px' }}
                                onChange={handleSelectState}
                                value={currentState}
                            >
                                <Option key='conus' value="conus">Contiguous US</Option>
                                {US_STATES.map((state) => (
                                    <Option key={state.abbr} value={state.abbr}>
                                        {state.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                    </Col>
                </Row>

                <Tabs defaultActiveKey='streams' items={[
                    { key: 'streams', label: 'Streams', children: (<span>Select desired levels of stream protection below; results will be updated to reflect selection(s)</span>), },
                    { key: 'wetlands', label: 'Wetlands', children: (<span>Select desired levels of wetland protection below; results will be updated to reflect selection(s)</span>), }]}
                    onChange={onChangeDomain} 
                />

                {domain === 'streams' && (
                    <Row gutter={16} style={{}}>
                        <Col xs={24} md={6} style={{ border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px' }}>
                            <div style={{ marginTop: '1.0em', marginBottom: '0.5em', paddingLeft: '0.5em' }}>

                                <span style={{ color: 'yellow', fontSize: 'medium', fontWeight: 500 }}>Include the following Stream Types: </span>

                                <Popover open={wetlandTypePopoverVisible} onOpenChange={setWetlandTypePopoverVisible} content={
                                    <>
                                        <p><b>Stream/River</b> are dominated by herbaceous plants such as grasses, sedges, cattails, and rushes that grow in shallow water or saturated soils. Water is present at or above the soil surface for at least part of the year, but trees and shrubs are sparse or absent. These wetlands include marshes and wet meadows and are important for flood storage, nutrient cycling, and wildlife habitat.</p>
                                        <p><b>Freshwater forested/shrub wetlands</b> are dominated by woody vegetation, including trees (forested) or shrubs (scrub-shrub). They occur on saturated or flooded soils and include swamps, bottomland hardwood forests, and shrub wetlands. These systems play a key role in flood attenuation, groundwater recharge, and providing complex habitat structure.</p>
                                        <p><b>Freshwater ponds</b> are small, shallow, non-tidal water bodies with standing water, often surrounded by emergent or aquatic vegetation. They are deeper than marshes but smaller than lakes and may be natural or man-made. Ponds provide aquatic habitat, sediment storage, and localized water retention.</p>
                                        <p><b>Lakes</b> are larger, deeper inland freshwater bodies with standing water and relatively stable water levels. They typically have open water zones that may support submerged or floating vegetation, with emergent wetlands along their margins. Lakes influence regional hydrology and support diverse aquatic ecosystems.</p>
                                        <p><b>Riverine</b> systems consist of flowing freshwater channels such as rivers and streams, including their beds, banks, and associated in-channel wetlands. Water movement is primarily unidirectional, driven by watershed runoff. Riverine areas are shaped by current, erosion, and sediment transport and are critical for longitudinal connectivity.</p>
                                        <p><b>Estuarine and marine deepwater systems</b> are permanently flooded areas below the low-tide line in estuaries or the open ocean. They lack emergent vegetation and include subtidal channels, bays, and nearshore marine waters. These areas support fish, invertebrates, and submerged aquatic vegetation.</p>
                                        <p><b>Estuarine and marine wetlands</b> are tidal areas influenced by saline or brackish water where vegetation is present. They include salt marshes, tidal flats with vegetation, and mangrove forests. These wetlands buffer storm surge, improve water quality, and provide essential coastal habitat.</p>
                                        <p>The “<b>Other</b>” category includes water or wetland features that do not clearly fit into the standard classifications or represent highly altered systems. Examples may include wastewater treatment wetlands, drainage features, or mixed or transitional areas. This category is often used when classification uncertainty exists or when features serve specialized or artificial functions.</p>
                                        <br />
                                        <a onClick={() => setWetlandTypePopoverVisible(false)}>Close</a>
                                    </>} title="Wetland Class Definitions" trigger="click">
                                    <QuestionCircleTwoTone />
                                </Popover>
                                <p style={{ paddingLeft: '0px' }}>Only the stream types checked below will be included in this analysis.</p>
                                <div style={{ marginTop: '1em', marginBottom: '10px' }}>

                                    <Checkbox defaultChecked={st_streamRiver.current} onChange={(e) => { st_streamRiver.current = e.target.checked; BuildQueryParams('streams'); }}>Stream/River</Checkbox>
                                    <Checkbox defaultChecked={st_streamRiverIntermittent.current} onChange={(e) => { st_streamRiverIntermittent.current = e.target.checked; BuildQueryParams('streams'); }}>Stream/River Intermittent</Checkbox>
                                    <Checkbox defaultChecked={st_streamRiverPerennial.current} onChange={(e) => { st_streamRiverPerennial.current = e.target.checked; BuildQueryParams('streams'); }}>Stream/River Perennial</Checkbox>
                                    <Checkbox defaultChecked={st_streamRiverEphemeral.current} onChange={(e) => { st_streamRiverEphemeral.current = e.target.checked; BuildQueryParams('streams'); }}>Stream/River Ephemeral</Checkbox>
                                    <Checkbox defaultChecked={st_drainageway.current} onChange={(e) => { st_drainageway.current = e.target.checked; BuildQueryParams('streams'); }}>Drainageway</Checkbox>
                                    <Checkbox defaultChecked={st_connector.current} onChange={(e) => { st_connector.current = e.target.checked; BuildQueryParams('streams'); }}>Connector</Checkbox>
                                    <Checkbox defaultChecked={st_canalDitch.current} onChange={(e) => { st_canalDitch.current = e.target.checked; BuildQueryParams('streams'); }}>Canal/Ditch</Checkbox>
                                    <Checkbox defaultChecked={st_undergroundConduit.current} onChange={(e) => { st_undergroundConduit.current = e.target.checked; BuildQueryParams('streams'); }}>Underground Conduit</Checkbox>
                                    <Checkbox defaultChecked={st_pipeline.current} onChange={(e) => { st_pipeline.current = e.target.checked; BuildQueryParams('streams'); }}>Pipeline</Checkbox>
                                    <Checkbox defaultChecked={st_artificialPath.current} onChange={(e) => { st_artificialPath.current = e.target.checked; BuildQueryParams('streams'); }}>Artificial Path</Checkbox>
                                    <Checkbox defaultChecked={st_coastline.current} onChange={(e) => { st_coastline.current = e.target.checked; BuildQueryParams('streams'); }}>Coastline</Checkbox>
                                </div>
                                <Divider />


                                <p style={{ color: 'yellow', paddingLeft: '0px' }}>Below, specify the protection criteria you would like to apply to streams.
                                </p>
                                <Divider />


                                <Radio checked={useStreamOrder} onChange={(e) => { onChangeUseStreamOrder(e.target.checked); }}>
                                    <span style={{ color: 'yellow', fontSize: 'medium', fontWeight: 500 }}>Stream Orders to Protect:</span>
                                </Radio>
                                <Popover open={streamOrderPopoverVisible} onOpenChange={setStreamOrderPopoverVisible} content={(
                                    <>
                                        <div style={{ textAlign: 'center', width: '50%', float: 'right' }}>
                                            <Image width={400} alt="basic" src="https://upload.wikimedia.org/wikipedia/commons/e/e6/Flussordnung_%28Strahler%29.svg" />
                                            <br />
                                            <span>By <a href="//commons.wikimedia.org/wiki/User:Kilom691" title="User:Kilom691">Kilom691</a>,
                                                <a href="https://creativecommons.org/licenses/by-sa/3.0" title="Creative Commons Attribution-Share Alike 3.0">CC BY-SA 3.0</a>, <a href="https://commons.wikimedia.org/w/index.php?curid=15757078">Link</a>
                                            </span>
                                        </div>
                                        <div>

                                            <p>Rivers of the first order are the outermost (headwater) tributaries.
                                                If two streams of the same order merge, the resulting stream is given a number that is one higher.
                                                If two rivers with different stream orders merge, the resulting stream is given the higher of the two numbers.
                                            </p>

                                            <p>For example, if two first-order streams merge, they form a second-order stream. If a first-order stream merges with a second-order stream,
                                                the resulting stream remains a second-order stream. This system continues downstream, with the stream order increasing as tributaries of the same order merge.
                                            </p>
                                            <br />
                                            <a onClick={() => setStreamOrderPopoverVisible(false)}>Close</a>
                                        </div>
                                    </>)} title="Stream Order Definition" trigger="hover">
                                    <QuestionCircleTwoTone />
                                </Popover>
                                <br />
                                <br />
                                <Radio.Group
                                    value={streamOrderThreshold}
                                    onChange={(e) => {
                                        setStreamOrderThreshold(e.target.value);
                                        setWetlandStreamOrderThreshold(e.target.value);
                                        onChangeUseStreamOrder(true);
                                    }}
                                >
                                    <Radio value={1}>All Streams</Radio><br />
                                    <Radio value={2}>2nd-Order Streams and Larger Only</Radio><br />
                                    <Radio value={3}>3rd-Order Streams and Larger Only</Radio><br />
                                    <Radio value={4}>4th-Order Streams and Larger Only</Radio>
                                </Radio.Group>

                                <Divider>OR</Divider>

                                <div style={{ marginTop: '0.5em' }}>
                                    <Radio checked={useDrainageArea.current} onChange={() => onChangeUseStreamOrder(false)}>
                                        <span style={{ color: 'yellow', fontSize: 'medium', fontWeight: 500 }}>Minimum Drainage Area to Protect:</span>
                                    </Radio>

                                    <Popover open={drainageAreaPopoverVisible} onOpenChange={setDrainageAreaPopoverVisible} content={(
                                        <>
                                            <p>In stream protection, minimum drainage area refers to the smallest contributing watershed size required for a wetland
                                                to be considered hydrologically connected to downstream waters. In plain terms, it’s a threshold used to
                                                decide whether enough land drains into a wetland for it to meaningfully collect, store, and move water as part
                                                of a larger surface-water system. Wetlands that meet or exceed this minimum drainage area are more likely to influence
                                                streamflow, flood attenuation, groundwater recharge, and water quality beyond their immediate footprint.
                                            </p>
                                            <p>From a regulatory and planning perspective, minimum drainage area helps agencies distinguish between wetlands that function as part
                                                of an integrated drainage network and those that are more isolated or ephemeral. Wetlands above the threshold are often afforded
                                                stronger protection because their alteration could affect downstream flooding, sediment transport, nutrient loading, or habitat
                                                connectivity. While the exact drainage area cutoff varies by region and regulatory program, the concept provides a science-based
                                                way to prioritize wetland protection based on hydrologic function rather than wetland size alone.
                                            </p>
                                            <br />
                                            <a open={drainageAreaPopoverVisible} onClick={() => setDrainageAreaPopoverVisible(false)}>Close</a>
                                        </>)}
                                        title="Minimum Drainage Areas for Wetlands Protection" trigger="click">
                                        <QuestionCircleTwoTone />
                                    </Popover>

                                    <br />
                                    <br />
                                    <InputNumber
                                        placeholder="Select area threshold"
                                        min={0}
                                        max={10000}
                                        style={{ width: '8em', marginBottom: '10px' }}
                                        value={drainageAreaThreshold.current}
                                        onChange={(value) => { drainageAreaThreshold.current = value; onChangeUseStreamOrder(false); }}
                                    />&nbsp;acres
                                    <div><span>(smaller numbers result in more protection)</span></div>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} md={18} style={{ border: '1px solid #ccc', borderLeft: 'none', borderRight: 'none' }}>

                            <Tabs defaultActiveKey="stats" items={[
                                { key: 'stats', label: 'Stats', },
                                { key: 'maps', label: 'Map' }]}
                                onChange={setStreamLens} />

                            {streamLens === 'maps' && (
                                <WotusMap domain="streams" streamQuery={streamQueryParams} wetlandQuery="" currentState={currentState} usStates={US_STATES} setCurrentState={handleSelectState} initialCenter={mapViewState.current.center} initialZoom={mapViewState.current.zoom} onViewStateChange={handleMapViewStateChange} />
                            )}

                            {streamLens === 'stats' && (
                                <WotusStats domain="streams" streamQuery={streamQueryParams} wetlandQuery={wetlandQueryParams} currentState={currentState} currentStateLabel={currentStateLabel} />
                            )}
                        </Col>
                    </Row>
                )}

                {domain === 'wetlands' && (
                    <Row gutter={16} style={{}}>
                        <Col xs={24} md={6} style={{ border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px' }}>
                            <div style={{ marginBottom: '0.5em', marginTop: '1.0em', paddingLeft: '0.5em' }}>

                                <span style={{ color: 'yellow', fontSize: 'medium', fontWeight: 500 }}>Include the following Wetland Types: </span>

                                <Popover open={wetlandTypePopoverVisible} onOpenChange={setWetlandTypePopoverVisible} content={
                                    <>
                                        <p><b>Freshwater emergent wetlands</b> are dominated by herbaceous plants such as grasses, sedges, cattails, and rushes that grow in shallow water or saturated soils. Water is present at or above the soil surface for at least part of the year, but trees and shrubs are sparse or absent. These wetlands include marshes and wet meadows and are important for flood storage, nutrient cycling, and wildlife habitat.</p>
                                        <p><b>Freshwater forested/shrub wetlands</b> are dominated by woody vegetation, including trees (forested) or shrubs (scrub-shrub). They occur on saturated or flooded soils and include swamps, bottomland hardwood forests, and shrub wetlands. These systems play a key role in flood attenuation, groundwater recharge, and providing complex habitat structure.</p>
                                        <p><b>Freshwater ponds</b> are small, shallow, non-tidal water bodies with standing water, often surrounded by emergent or aquatic vegetation. They are deeper than marshes but smaller than lakes and may be natural or man-made. Ponds provide aquatic habitat, sediment storage, and localized water retention.</p>
                                        <p><b>Lakes</b> are larger, deeper inland freshwater bodies with standing water and relatively stable water levels. They typically have open water zones that may support submerged or floating vegetation, with emergent wetlands along their margins. Lakes influence regional hydrology and support diverse aquatic ecosystems.</p>
                                        <p><b>Riverine</b> systems consist of flowing freshwater channels such as rivers and streams, including their beds, banks, and associated in-channel wetlands. Water movement is primarily unidirectional, driven by watershed runoff. Riverine areas are shaped by current, erosion, and sediment transport and are critical for longitudinal connectivity.</p>
                                        <p><b>Estuarine and marine deepwater systems</b> are permanently flooded areas below the low-tide line in estuaries or the open ocean. They lack emergent vegetation and include subtidal channels, bays, and nearshore marine waters. These areas support fish, invertebrates, and submerged aquatic vegetation.</p>
                                        <p><b>Estuarine and marine wetlands</b> are tidal areas influenced by saline or brackish water where vegetation is present. They include salt marshes, tidal flats with vegetation, and mangrove forests. These wetlands buffer storm surge, improve water quality, and provide essential coastal habitat.</p>
                                        <p>The “<b>Other</b>” category includes water or wetland features that do not clearly fit into the standard classifications or represent highly altered systems. Examples may include wastewater treatment wetlands, drainage features, or mixed or transitional areas. This category is often used when classification uncertainty exists or when features serve specialized or artificial functions.</p>
                                        <br />
                                        <a onClick={() => setWetlandTypePopoverVisible(false)}>Close</a>
                                    </>} title="Wetland Class Definitions" trigger="click">
                                    <QuestionCircleTwoTone />
                                </Popover>
                                <p style={{ paddingLeft: '0px' }}>Only the wetland types checked below will be included in this analysis.</p>
                                <div style={{ marginTop: '1em', marginBottom: '10px' }}>
                                    <Checkbox defaultChecked={wt_freshwaterEmergentWetland.current} onChange={(e) => { wt_freshwaterEmergentWetland.current = e.target.checked; BuildQueryParams('wetlands'); }}>Freshwater Emergent Wetland</Checkbox>
                                    <Checkbox defaultChecked={wt_freshwaterForestedShrubWetland.current} onChange={(e) => { wt_freshwaterForestedShrubWetland.current = e.target.checked; BuildQueryParams('wetlands'); }}>Freshwater Forested/Shrub Wetland</Checkbox>
                                    <Checkbox defaultChecked={wt_freshwaterPond.current} onChange={(e) => { wt_freshwaterPond.current = e.target.checked; BuildQueryParams('wetlands'); }}>Freshwater Pond</Checkbox>
                                    <Checkbox defaultChecked={wt_lake.current} onChange={(e) => { wt_lake.current = e.target.checked; BuildQueryParams('wetlands'); }}>Lake</Checkbox>
                                    <Checkbox defaultChecked={wt_riverine.current} onChange={(e) => { wt_riverine.current = e.target.checked; BuildQueryParams('wetlands'); }}>Riverine</Checkbox>
                                    <Checkbox defaultChecked={wt_estuarineMarineDeepwater.current} onChange={(e) => { wt_estuarineMarineDeepwater.current = e.target.checked; BuildQueryParams('wetlands'); }}>Estuarine Marine Deepwater</Checkbox>
                                    <Checkbox defaultChecked={wt_estuarineMarineWetland.current} onChange={(e) => { wt_estuarineMarineWetland.current = e.target.checked; BuildQueryParams('wetlands'); }}>Estuarine Marine Wetland</Checkbox>
                                    <Checkbox defaultChecked={wt_other.current} onChange={(e) => { wt_other.current = e.target.checked; BuildQueryParams('wetlands'); }}>Other</Checkbox>
                                </div>
                                <Divider />
                                <p style={{ color: 'yellow', paddingLeft: '0px' }}>Below, specify the protection criteria you would like to apply to wetlands.
                                    Wetlands must satisfy ALL selected criteria to be considered protected.
                                </p>
                                <Divider />

                                <Checkbox checked={useWetlandDistance} onChange={(e) => { setUseWetlandDistance(e.target.checked); BuildQueryParams('wetlands'); }}>
                                    <span style={{ color: 'yellow', fontSize: 'medium', fontWeight: 500 }}>Protect Based on Stream Proximity:</span>
                                </Checkbox>

                                <Popover open={wetlandDistancePopoverVisible} onOpenChange={setWetlandDistancePopoverVisible} content={
                                    <>
                                        <p>Wetlands and streams are closely linked through hydrology, ecology, and geomorphology, and a wetland’s proximity to a stream often determines how it functions and how strongly it influences downstream waters. Wetlands located adjacent to or within stream corridors—such as floodplain wetlands—are regularly connected to streams during high flows. These wetlands store floodwater, slow runoff, trap sediment, and absorb nutrients before water reenters the channel, reducing flood peaks and improving water quality. Because of this direct connection, nearby wetlands often play an outsized role in protecting stream health.</p>
                                        <p>Wetlands farther from streams may appear isolated on the landscape, but many still maintain episodic or subsurface connections through shallow groundwater flow or overland flow during storms. These wetlands can regulate the timing and amount of water that eventually reaches streams, helping sustain baseflow during dry periods or moderating flashy runoff after rain. Ecologically, proximity to streams enhances habitat connectivity for fish, amphibians, and riparian wildlife, allowing wetlands and streams to function as an integrated network rather than separate features. As a result, wetlands closer to streams are often prioritized for protection, but more distant wetlands can still provide important indirect support to stream systems.</p>
                                        <br />
                                        <a onClick={() => setWetlandDistancePopoverVisible(false)}>Close</a>
                                    </>} title="Wetland Class Definitions" trigger="click">
                                    <QuestionCircleTwoTone />
                                </Popover>
                                <br />

                                <Radio.Group
                                    value={wetlandStreamOrderThreshold}
                                    onChange={(e) => {
                                        setStreamOrderThreshold(e.target.value);
                                        setWetlandStreamOrderThreshold(e.target.value);
                                        onChangeUseStreamOrder(true);
                                    }}
                                >
                                    <Radio value={1}>All Streams</Radio><br />
                                    <Radio value={2}>2nd-Order Streams and Larger Only</Radio><br />
                                    <Radio value={3}>3rd-Order Streams and Larger Only</Radio><br />
                                    <Radio value={4}>4th-Order Streams and Larger Only</Radio>
                                </Radio.Group>

                                <br />
                                <div style={{ marginTop: '0.5em' }}>
                                    Minimum distance to stream:&nbsp;
                                    <InputNumber
                                        onChange={(value) => { wetlandDistanceThreshold.current = value; setUseWetlandDistance(true); BuildQueryParams('wetlands'); }}
                                        placeholder="Select distance threshold"
                                        min={0}
                                        max={100000}
                                        style={{ width: '6em', marginBottom: '10px' }}
                                        defaultValue={wetlandDistanceThreshold.current}
                                    />
                                    <span> meters. (Note that larger distances result in higher levels of protection)</span>
                                </div>
                                <Divider />

                                <Checkbox checked={useHydroRegime} onChange={(e) => { setUseHydroRegime(e.target.checked); BuildQueryParams('wetlands'); }}>
                                    <span style={{ color: 'yellow', fontSize: 'medium', fontWeight: 500 }}>Protect based on Hydrologic Regimes:</span>
                                </Checkbox>
                                <Popover open={hydroRegimePopoverVisible} onOpenChange={setHydroRegimePopoverVisible} content={
                                    <>
                                        <p><b>Temporarily Flooded (J, A, S)</b>: Areas where surface water is present for brief periods during the growing season, typically after heavy rains or snowmelt. Flooding is infrequent and short-lived, with water usually receding within a few days to weeks. These wetlands may support opportunistic vegetation that can tolerate occasional inundation.</p>
                                        <p><b>Seasonally Saturated (B)</b>: Areas where the soil is saturated to the surface for extended periods during the growing season, but standing water is typically absent. Saturation usually occurs during wetter parts of the year and recedes as evapotranspiration increases. Vegetation is adapted to wet soils rather than prolonged inundation.</p>
                                        <p><b>Continuously Saturated (D)</b>: Areas where soils remain saturated to the surface throughout most or all of the year, with little seasonal drying. Standing water may be present briefly, but the dominant condition is persistent soil saturation. These sites support hydrophytic vegetation that tolerates long-term anaerobic soil conditions.</p>
                                        <p><b>Seasonally Flooded (C, R)</b>: Areas where surface water is present for extended periods during the growing season, but water is absent for much of the remainder of the year. Flooding is predictable and often tied to seasonal precipitation, snowmelt, or stream overbank flow. Soils typically dry at the surface between flooding periods.</p>
                                        <p><b>Seasonally Flooded / Saturated (E, P)</b>: Areas that experience seasonal surface flooding followed by prolonged periods of soil saturation after floodwaters recede. Water levels fluctuate around the soil surface, alternating between shallow inundation and saturation during the wet season. This regime supports vegetation adapted to both flooding and saturated soil conditions.</p>
                                        <p><b>Semipermanently Flooded (F, N, Q)</b>: Areas where surface water persists through most of the growing season in most years, with only brief or infrequent periods of exposure. Water depths may fluctuate but rarely drop below the soil surface. These wetlands often support emergent, floating, or submerged aquatic vegetation.</p>
                                        <p><b>Intermittently Exposed (G, M, T)</b>: Areas that are usually covered by shallow surface water but periodically exposed due to seasonal drawdown, drought, or tidal cycles. Exposure is irregular or short-lived relative to flooding duration. Vegetation and substrate are adapted to alternating wet and exposed conditions.</p>
                                        <p><b>Permanently Flooded (H, L, V)</b>: Areas where surface water is present year-round in all years, except during extreme drought. Water depths are generally stable and consistently above the soil surface. These systems support submerged or floating aquatic vegetation or may be unvegetated open water.</p>
                                        <br />
                                        <a onClick={() => setHydroRegimePopoverVisible(false)}>Close</a>
                                    </>} title="Wetland Water Regime Definitions" trigger="click">
                                    <QuestionCircleTwoTone />
                                </Popover>
                                <br />
                                <p style={{ paddingLeft: '0px' }}>Specify the hydrologic regimes to protect below</p>
                                <p>Drier</p>

                                <Checkbox defaultChecked={hr_tempFlooded.current} onChange=
                                    {(e) => { hr_tempFlooded.current = e.target.checked; BuildQueryParams('wetlands') }
                                    }>Temporarily Flooded (J,A,S)</Checkbox>
                                <Checkbox defaultChecked={hr_seasonallySaturated.current} onChange={(e) => { hr_seasonallySaturated.current = e.target.checked; BuildQueryParams('wetlands') }}>Seasonally Saturated (B)</Checkbox>
                                <Checkbox defaultChecked={hr_continuouslySaturated.current} onChange={(e) => { hr_continuouslySaturated.current = e.target.checked; BuildQueryParams('wetlands') }}>Continuously Saturated (D)</Checkbox>
                                <Checkbox defaultChecked={hr_seasonallyFlooded.current} onChange={(e) => { hr_seasonallyFlooded.current = e.target.checked; BuildQueryParams('wetlands') }}>Seasonally Flooded (C, R)</Checkbox>
                                <Checkbox defaultChecked={hr_seasonallyFloodedSaturated.current} onChange={(e) => { hr_seasonallyFloodedSaturated.current = e.target.checked; BuildQueryParams('wetlands') }}>Seasonally Flooded/Saturated (E, P)</Checkbox>
                                <Checkbox defaultChecked={hr_semipermanentlyFlooded.current} onChange={(e) => { hr_semipermanentlyFlooded.current = e.target.checked; BuildQueryParams('wetlands') }}>Semipermanently Flooded (F,N,Q)</Checkbox>
                                <Checkbox defaultChecked={hr_intermittentlyExposed.current} onChange={(e) => { hr_intermittentlyExposed.current = e.target.checked; BuildQueryParams('wetlands') }}>Intermittently Exposed (G,M,T)</Checkbox>
                                <Checkbox defaultChecked={hr_permanentlyFlooded.current} onChange={(e) => { hr_permanentlyFlooded.current = e.target.checked; BuildQueryParams('wetlands') }}>Permanently Flooded (H,L,V)</Checkbox>

                                <p>Wetter</p>

                                <Divider />

                                <Checkbox style={{ marginBottom: '10px' }} defaultChecked={includeArtificialWetlands.current}
                                    onChange={(e) => { includeArtificialWetlands.current = e.target.checked; BuildQueryParams('wetlands'); }}>
                                    <span style={{ color: 'yellow', fontSize: 'medium', fontWeight: 500 }}>Include Artificial Wetlands</span>
                                </Checkbox>
                                <Popover open={includeArtificialWetlandsPopoverVisible} onOpenChange={setIncludeArtificialWetlandsPopoverVisible} content={
                                    <>
                                        <p>An <b>artificial wetland</b> generally describes a wetland that was created or substantially modified by human activity rather than formed by natural hydrologic and geomorphic processes. In regulatory terms, an artificial wetland is an area where wetland hydrology, hydric soils, and hydrophytic vegetation developed as a result of actions such as excavation, impoundment, grading, drainage alteration, or construction (for example, borrow pits, stormwater ponds, irrigation ditches, or wastewater treatment areas).</p>
                                        <p>From a permitting and protection standpoint, artificial wetlands may or may not receive the same level of regulatory protection as natural wetlands, depending on the governing authority. Many regulations distinguish artificial wetlands from natural ones by considering factors such as intent of creation, degree of human maintenance, connection to waters of the state or United States, and ecological function. Some artificial wetlands—particularly those that provide significant water quality, flood control, or habitat benefits—can still be regulated, while others that serve primarily as engineered or temporary features may be exempt or subject to reduced protection.</p>
                                        <br />
                                        <a onClick={() => setIncludeArtificialWetlandsPopoverVisible(false)}>Close</a>
                                    </>} title="Artificial Wetlands Definition" trigger="click">
                                    <QuestionCircleTwoTone />
                                </Popover>
                            </div>
                        </Col>

                        <Col xs={24} md={18} style={{ border: '1px solid #ccc', borderLeft: 'none', borderRight: 'none' }}>

                            <Tabs defaultActiveKey="stats" items={[
                                { key: 'stats', label: 'Stats', },
                                { key: 'maps', label: 'Map' }]}
                                onChange={setWetlandLens} />

                            {wetlandLens === 'maps' && (
                                <WotusMap domain="wetlands" streamQuery="" wetlandQuery={wetlandQueryParams} currentState={currentState} usStates={US_STATES} setCurrentState={handleSelectState} initialCenter={mapViewState.current.center} initialZoom={mapViewState.current.zoom} onViewStateChange={handleMapViewStateChange} />
                            )}

                            {wetlandLens === 'stats' && (
                                <WotusStats domain="wetlands" streamQuery={streamQueryParams} wetlandQuery={wetlandQueryParams} currentState={currentState} currentStateLabel={currentStateLabel} />
                            )}
                        </Col>
                    </Row>
                )}
            </div>
        </>
    )
};


export default Wotus;