import { useState, useRef, useEffect, useCallback } from 'react';
import { Row, Col, Select, Card, Table, message, Collapse, Checkbox } from 'antd';

import PageRating from '../../components/page_rating/PageRating';

//import PropTypes from 'prop-types';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import "@arcgis/map-components/components/arcgis-search"; // Import ArcGIS Search component
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, ReferenceLine, BarChart, Bar, LineChart } from 'recharts';
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import 'leaflet/dist/leaflet.css';
import { secrets } from "../../secrets";
import './OregonCropWaterUse.css';

/* DEPENDENCIES:

Update this               <-- when this variable is changed
------------------------  <-- ------------------------------  
geoJSONData               <-- selectedGeoJsonFile (from layer <Select> component)
map GeoJSON layer         <-- geoJsonData
crop <Select> component   <-- selectedFeatureID
crop charts and tables    <-- selectedCrop
selectedCropLabel (for chart title) <-- selectedCrop
cardTitle                 <--- selectedFeatureID (from map click)
latlng                    <--- selectedFeatureID (from map click, get centroid of selected feature)
cropSelectItems (for crop <Select> options) <-- selectedFeatureID (from map click, fetch crops for selected feature)
*/


const CropWaterUse = () => {
    const [selectedGeoJsonFile, setSelectedGeoJsonFile] = useState('Watermaster_District.json');
    const [geoJsonData, setGeoJsonData] = useState(null);

    const [cropData, setCropData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState([]); // State for line chart data

    const [selectedCrop, setSelectedCrop] = useState('-1');
    const [selectedCropLabel, setSelectedCropLabel] = useState('Corn');

    const [selectedFeatureID, setSelectedFeatureID] = useState(null);   //  this is the ID of the selected feature in the geometry layer 
    //  (e.g. district number, HUC8 code, or county name depending on the selected geometry)
    const cardTitle = useRef('Location not selected');
    const samples = useRef(-1); // number of samples used to calculate the crop water use data for the selected crop and feature.  This information is avaiable in the featureCropsData which was fetched for the selected feature (district) and contains the crop options for the crop <Select> component

    const featureCropsData = useRef(null)

    const [activePanel, setActivePanel] = useState('cwu'); // Changed from ref to state

    const [latlng, setLatlng] = useState(null);

    const [visibleTraces, setVisibleTraces] = useState({
        et: true,
        eto: true,
        ppt: true,
        niwr: true
    });

    // used to populate crop select items based on district selection
    const [cropSelectItems, setCropSelectItems] = useState([]);

    const tableData = useRef(null)

    const tableCols = [
        { title: 'Month', dataIndex: 'month', key: 'month', align: 'center' },
        { title: 'Actual ET (in)', dataIndex: 'et', key: 'et', align: 'center' },
        { title: 'Reference ET (in)', dataIndex: 'eto', key: 'eto', align: 'center' },
        { title: 'Kc', dataIndex: 'etfraction', key: 'etfraction', align: 'center' },
        { title: 'Precipitation (in)', dataIndex: 'ppt', key: 'ppt', align: 'center' },
        { title: 'Net Irrigation Water Requirement (in)', dataIndex: 'niwr', key: 'niwr', align: 'center' },
    ];


    const resolveGeometryFile = (file) => (file === 'Watermaster_District.json' ? 'Watermaster_Districts' : file);

    const getGeometryType = (file) => {
        if (file === 'Watermaster_District.json') {
            return 'WMD';
        } else if (file === 'OR_HUC8s.geojson') {
            return 'HUC8';
        } else if (file === 'OR_Counties.geojson') {
            return 'County';
        } else {
            return null;
        }
    }

    const fetchGeometry = useCallback(async (file) => {
        setLoading(true);
        setSelectedFeatureID(null); // Clear selected feature when geometry changes

        try {
            const apiUrl = `https://agwater.org:5556/json?path=oregon_crop_water_use&file=${resolveGeometryFile(file)}`;
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    "X-API-Key": secrets.agwater_api_key
                }
            });

            if (!response.ok) {
                console.error('Failed to fetch geometry data, status:', response.status);
                throw new Error('Failed to fetch geometry data');
            }

            const data = await response.json();

            if (data.error) {
                console.error('Error fetching geometry data:', data.error);
                throw new Error('Failed to fetch geometry data');
            }
            setLoading(false);
            console.log(`Fetched geometry data for ${file}: Found ${data.data.features.length} features`);
            setGeoJsonData(data.data);
            return data.data;
        } catch (error) {
            setLoading(false);
            console.error('Error fetching geometry data:', error);
            message.error('Unable to load geometry data');
            return null;
        }
    }, []);

    const fetchFeatureCrops = useCallback(async (featureID) => {
        if (!featureID) {
            console.log('No feature ID selected, skipping fetchFeatureCrops');
            setCropSelectItems([]);
            setSelectedCrop(null);
            setSelectedCropLabel('');
            return;
        }

        const MIN_LEVEL = 24; // Minimum level to include a crop in the analysis (at least 5% of fields in the feature
                              //  and at least 10 inches of seasonal ET)
        const geometryType = getGeometryType(selectedGeoJsonFile);

        console.log('Fetching crops for geometry ', geometryType, ', feature: ', featureID );
        setLoading(true);

        try {
            const apiUrl = `https://agwater.org:5556/crop_management/crops?geometry=${geometryType}&featureID=${featureID}&min_level=${MIN_LEVEL}`;
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    "X-API-Key": secrets.agwater_api_key
                }
            });

            if (!response.ok) {
                console.error('Failed to fetch crops data, status:', response.status);
                throw new Error('Failed to fetch crops data');
            }

            const data = await response.json();

            if (data.error) {
                console.error('Error fetching crops data:', data.error);
                throw new Error('Failed to fetch crops data');
            }

            const _cropData = data.crops;
            // sort the crops by seasonal_et_total in descending order
            _cropData.sort((a, b) => b.seasonal_et_total - a.seasonal_et_total);

            const _cropSelectItems = _cropData.map(crop => ({
                value: crop.code,
                label: crop.name
            }));
            featureCropsData.current = _cropData;
            setCropSelectItems(_cropSelectItems);
            setSelectedCrop(_cropSelectItems.length > 0 ? _cropSelectItems[0].value : '-1');
            setSelectedCropLabel(_cropSelectItems.length > 0 ? _cropSelectItems[0].label : '');
            //(_cropSelectItems.length > 0 ? _cropSelectItems[0].value : null);
            console.log('Fetched crops data for geometry ', geometryType, ', feature: ', featureID, 'Crops:', _cropData);
            setLoading(false);
            return data;
        } catch (error) {
            setLoading(false);
            console.error('Error fetching crops data:', error);
            message.error('Unable to load crops data');
            return null;
        }
    }, [selectedGeoJsonFile]);

    const fetchCropData = useCallback(async (featureID, crop) => {
        setLoading(true);
        console.log('Fetching crop water use data for geometry ', selectedGeoJsonFile, ', feature:', featureID, 'and crop:', crop);

        if (!featureID || !crop || crop === -1) {
            console.warn('Feature ID or crop not selected, skipping data fetch');
            setLoading(false);
            return;
        }

        try {
            const geometryType = getGeometryType(selectedGeoJsonFile);
            if (!geometryType) {
                console.error('Invalid geometry type');
                setLoading(false);
                return;
            }
            
            const apiUrl = `https://agwater.org:5556/crop_management/crops/cwu_summary_data?geometry=${geometryType}&featureID=${featureID}&crop=${crop}`;

            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    "X-API-Key": secrets.agwater_api_key
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch crop water use data');
            }

            const data = await response.json();
            setCropData(data);

            // Transform the response data into a format suitable for Recharts
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const _chartData = [];
            if (data && data.monthly_data && data.monthly_data.length === 12) {

                months.forEach((month, index) => {
                    const etValue = data.monthly_data[index].et_stats.weighted_mean;
                    const etoValue = data.monthly_data[index].eto_stats.weighted_mean;
                    const pptValue = data.monthly_data[index].ppt_stats.weighted_mean;
                    const niwrValue = data.monthly_data[index].niwr_stats.weighted_mean;
                    const etfrac = data.monthly_data[index].etfraction_stats.weighted_mean;

                    const etCiValues = data.monthly_data[index].et_stats.ci;
                    const pptCiValues = data.monthly_data[index].ppt_stats.ci;
                    const etoCiValues = data.monthly_data[index].eto_stats.ci;
                    const niwrCiValues = data.monthly_data[index].niwr_stats.ci;
                    const etfracCiValues = data.monthly_data[index].etfraction_stats.ci;

                    _chartData.push({
                        Month: month,
                        "Actual ET (in)": etValue,
                        "Reference ET (in)": etoValue,
                        "Precipitation (in)": pptValue,
                        "NIWR (in)": niwrValue,
                        "ET Fraction": etfrac,
                        et_ci: etCiValues,
                        ppt_ci: pptCiValues,
                        eto_ci: etoCiValues,
                        niwr_ci: niwrCiValues,
                        etfrac_ci: etfracCiValues
                    });
                });
                setChartData(_chartData);

                const _tableData = months.map((month, index) => ({
                    month: month,
                    et: `${data.monthly_data[index].et_stats.weighted_mean.toFixed(2)}` + " ( " + data.monthly_data[index].et_stats.ci[0].toFixed(2) + " - " + data.monthly_data[index].et_stats.ci[1].toFixed(2) + " )",
                    eto: `${data.monthly_data[index].eto_stats.weighted_mean.toFixed(2)}` + " ( " + data.monthly_data[index].eto_stats.ci[0].toFixed(2) + " - " + data.monthly_data[index].eto_stats.ci[1].toFixed(2) + " )",
                    ppt: `${data.monthly_data[index].ppt_stats.weighted_mean.toFixed(2)}` + " ( " + data.monthly_data[index].ppt_stats.ci[0].toFixed(2) + " - " + data.monthly_data[index].ppt_stats.ci[1].toFixed(2) + " )",
                    niwr: `${data.monthly_data[index].niwr_stats.weighted_mean.toFixed(2)}` + " ( " + data.monthly_data[index].niwr_stats.ci[0].toFixed(2) + " - " + data.monthly_data[index].niwr_stats.ci[1].toFixed(2) + " )",
                    etfraction: `${data.monthly_data[index].etfraction_stats.weighted_mean.toFixed(3)}` + " ( " + data.monthly_data[index].etfraction_stats.ci[0].toFixed(3) + " - " + data.monthly_data[index].etfraction_stats.ci[1].toFixed(3) + " )"
                }));

                tableData.current = _tableData;

                // set the number of samples for this crop.  This imformation is avaiable in the featureCropsData 
                // which was fetched for the selected feature (district) and contains the crop options for the 
                // crop <Select> component
                samples.current = featureCropsData.current?.find(c => c.code === crop)?.counts ?? 0;
                console.log('Finished fetching and processing crop water use data:');
            }
            setLoading(false);

        } catch (error) {
            console.error('Error processing chart data:', error);
            message.error('Unable to process crop water use data for chart');
            setLoading(false);
            return;
        }
    }, [selectedGeoJsonFile]);

    const handleCropChange = (value) => {
        setSelectedCropLabel(cropSelectItems.find(item => item.value === value)?.label || '');
        setSelectedCrop(value);
    };

    // Function to handle search result
    const handleSearchResult = useCallback((event) => {
        const result = event.detail.results;
        if (result && result.length > 0) {
            setSelectedFeatureID(null); // Clear selected district
        }
    }, []);

    const handlePanelChange = (key) => {
        setActivePanel(key);
    };

    const handleTraceToggle = (traceKey) => {
        setVisibleTraces(prev => ({
            ...prev,
            [traceKey]: !prev[traceKey]
        }));
    };

    const handleMapChange = async (value) => {  // value is the filename (*.geojson) of the geometry to load
        setSelectedGeoJsonFile(value);        
    };

    // initialization
    useEffect(() => {
        const initialize = async () => {
            console.log('Component mounted, fetching initial data');

            // Initialize ArcGIS components
            await window.customElements.whenDefined('arcgis-search');
            const arcgisSearch = document.querySelector('arcgis-search');
            if (arcgisSearch) {
                arcgisSearch.addEventListener('arcgis-search-result', handleSearchResult);
            }
            console.log('Finished initializing ArcGIS components and fetching initial data');
        };

        initialize();

        // Cleanup event listener on unmount
        return () => {
            const arcgisSearch = document.querySelector('arcgis-search');
            if (arcgisSearch) {
                arcgisSearch.removeEventListener('arcgis-search-result', handleSearchResult);
            }
        };

    }, [handleSearchResult]);

    useEffect(() => {
        fetchCropData(selectedFeatureID, selectedCrop);
    }, [fetchCropData, selectedCrop, selectedFeatureID]);

    useEffect(() => {
        fetchGeometry(selectedGeoJsonFile);
    }, [fetchGeometry, selectedGeoJsonFile]);

    useEffect(() => {
        fetchFeatureCrops(selectedFeatureID);
    }, [fetchFeatureCrops, selectedFeatureID]);

    const getDistrictStyle = (feature) => {
        const isSelected = `${feature?.properties?.district_nbr}` === `${selectedFeatureID}`;

        return {
            weight: isSelected ? 3 : 1,
            color: isSelected ? '#ffd400' : '#0000ff',
            fill: false,
            opacity: 1
        };
    };


    const onEachFeature = (feature, layer) => {
        let label = "";
        if (selectedGeoJsonFile === 'Watermaster_District.json') {
            label = `District ${feature.properties.district_nbr}`;
        } else if (selectedGeoJsonFile === 'OR_HUC8s.geojson') {
            label = `HUC 8 Watershed: ${feature.properties.HUC8_name} (${feature.properties.HUC8_code})`;
        } else if (selectedGeoJsonFile === 'OR_Counties.geojson') {
            label = `County: ${feature.properties.COUNTY_NAME}`;
        } else {
            label = feature.properties.name || 'Unknown';
        }

        layer.bindTooltip(label, {
            direction: 'top',
            sticky: true,
            opacity: 0.95
        });

        layer.on({
            click: async (e) => {
                if (selectedGeoJsonFile === 'Watermaster_District.json') {
                    setSelectedFeatureID(feature.properties.district_nbr);
                    cardTitle.current = `Crop Water Use for Water Master District ${feature.properties.district_nbr}`;
                }
                else if (selectedGeoJsonFile === 'OR_HUC8s.geojson') {
                    setSelectedFeatureID(feature.properties.HUC8_code);
                    cardTitle.current = `Crop Water Use for ${feature.properties.HUC8_name} (HUC8: ${feature.properties.HUC8_code})`;
                }
                else if (selectedGeoJsonFile === 'OR_Counties.geojson') {
                    const cobCode = parseInt(feature.properties.COBCODE.slice(2));   // remote OR prefix and convert remaining string to int
                    setSelectedFeatureID(cobCode);
                    cardTitle.current = `Crop Water Use for ${feature.properties.COUNTY_NAME} County`;
                }

                const centroid = feature.properties.centroid;
                setLatlng(centroid ? [centroid[1], centroid[0]] : null); // GeoJSON format is [longitude, latitude]
                console.log('Selected: ', label);
            },
            mouseover: (e) => {
                const layer = e.target;
                layer.openTooltip();
                layer.setStyle({
                    weight: 3,
                    color: '#0000ff',
                    fillOpacity: 0.1
                });
                //console.log('Mouseover District:', feature.properties.district_nbr);
            },
            mouseout: (e) => {
                const layer = e.target;
                layer.closeTooltip();
                layer.setStyle({
                    weight: 1,
                    color: '#0000ff',
                    fillOpacity: 0.0
                });
                //console.log('Mouseout District:', feature.properties.district_nbr);
            }
        });
    };

    const getCurrentDayOfYear = () => {
        const start = new Date(new Date().getFullYear(), 0, 0);
        const diff = new Date() - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay) + 1;
        return day;
    };

    //const ratioData = chartData?.map(d => ({
    //    Month: d.Month,
    //    ratio: (d["Actual ET (in)"] && d["Reference ET (in)"])
    //        ? Number((d["Actual ET (in)"] / d["Reference ET (in)"]).toFixed(3))
    //        : null
    //}));


    return (
        <>
            <PageRating pageID='/apps/oregon_crop_water_use'/>

            <div>
                <h3 style={{ marginLeft: '0.4em' }}>Crop Water Use in Oregon</h3>

                <p>
                    This tool provides insights into the water use of various crops across different Water Master districts in Oregon.
                    By selecting a district and crop of interest, users can visualize localized average monthly crop water use data,
                    including actual and reference evapotranspiration (ET, ET0), precipitation, and net irrigation water
                    requirement (NIWR) for the selected crop. This information can help farmers and water managers make informed
                    decisions about irrigation scheduling and water resource management based on the expected water use of crops
                    throughout the growing season.
                </p>
                <br />

                <Row gutter={16}>
                    <Col xs={24} sm={6}>
                        <Card title="My Location" size="small">
                                <Select
                                    value={selectedGeoJsonFile}
                                    style={{ width: '100%', marginBottom: '8px' }}
                                    placeholder="Select a location layer"
                                    options={[
                                        { value: 'Watermaster_District.json', label: 'Water Master Districts' },
                                        { value: 'OR_HUC8s.geojson', label: 'HUC 8 Watersheds' },
                                        { value: 'OR_Counties.geojson', label: 'Counties' },
                                    ]}
                                    onChange={handleMapChange}
                                />
                            <div style={{ height: '500px', width: '100%', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
                                <MapContainer
                                    center={[44.0, -120.5]}
                                    zoom={6}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={true}
                                    dragging={false}
                                    touchZoom={false}
                                    doubleClickZoom={false}
                                    scrollWheelZoom={false}
                                    boxZoom={false}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                                    />

                                    {geoJsonData && (
                                        <GeoJSON
                                            key={`${geoJsonData}-${geoJsonData?.features?.length ?? 0}`}
                                            data={geoJsonData}
                                            onEachFeature={onEachFeature}
                                            style={(feature) => ({
                                                color: feature.properties.stroke ?? '#0000ff',
                                                weight: feature.properties.strokeWidth ?? 1,
                                                fillOpacity: feature.properties.fillOpacity ?? 0,

                                            })}

                                        />
                                    )}
                                    <arcgis-search
                                        placeholder="Search for a location"
                                        style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}
                                    ></arcgis-search>
                                </MapContainer>
                                <span style={{ fontSize: '12px' }}> Location: {selectedGeoJsonFile}</span>
                            </div>
                        </Card>
                    </Col>
                    <Col className="ocwu-page" xs={24} sm={18}>
                        <Card title={cardTitle.current} size="small">

                            {selectedFeatureID ? (
                                <>

                            <Select
                                placeholder="Select a crop"
                                value={selectedCrop}
                                onChange={handleCropChange}
                                options={cropSelectItems}
                                style={{ width: '20em', marginBottom: '16px' }}
                            />
                            {loading && <span> Loading data...</span>}

                            {!loading && chartData && selectedFeatureID && (
                                <>
                                    <div>{samples.current > 0 ? `Samples: ${samples.current}` : null}</div>
                                    <Collapse
                                        accordion={true}
                                        activeKey={activePanel}
                                        onChange={handlePanelChange}
                                        items={[{
                                            key: 'cwu', label: 'Crop Water Use Chart', children: (<>
                                                <span style={{ paddingLeft: "10%", fontSize: "20px" }}>{`Monthly Crop Water Use for ${selectedCropLabel}`}</span>

                                                <Row style={{ marginTop: '12px', marginBottom: '12px', paddingLeft: '10%' }} gutter={16}>
                                                    <Col>
                                                        <Checkbox
                                                            checked={visibleTraces.et}
                                                            onChange={() => handleTraceToggle('et')}
                                                        >
                                                            Actual ET (in)
                                                        </Checkbox>
                                                    </Col>
                                                    <Col>
                                                        <Checkbox
                                                            checked={visibleTraces.eto}
                                                            onChange={() => handleTraceToggle('eto')}
                                                        >
                                                            Reference ET (in)
                                                        </Checkbox>
                                                    </Col>
                                                    <Col>
                                                        <Checkbox
                                                            checked={visibleTraces.ppt}
                                                            onChange={() => handleTraceToggle('ppt')}
                                                        >
                                                            Precipitation (in)
                                                        </Checkbox>
                                                    </Col>
                                                    <Col>
                                                        <Checkbox
                                                            checked={visibleTraces.niwr}
                                                            onChange={() => handleTraceToggle('niwr')}
                                                        >
                                                            NIWR (in)
                                                        </Checkbox>
                                                    </Col>
                                                </Row>

                                                {chartData.some(d => d["Actual ET (in)"] !== null) ? (
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <ComposedChart
                                                            data={chartData}
                                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" fill='#181818' />
                                                            <XAxis dataKey="Month" />
                                                            <XAxis xAxisId="date" hide={true} type="number" domain={[15, 350]} />
                                                            <YAxis />

                                                            <Legend />

                                                            <ReferenceLine
                                                                x={getCurrentDayOfYear()}
                                                                xAxisId="date"
                                                                stroke="yellow"
                                                                label={{ value: 'Today', position: 'left', fill: 'yellow' }}
                                                            />

                                                            {visibleTraces.et && (
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="et_ci"
                                                                    stroke="none"
                                                                    fill="rgba(44, 162, 236, 0.4)"
                                                                    legendType="none"
                                                                />
                                                            )}

                                                            {visibleTraces.ppt && (
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="ppt_ci"
                                                                    stroke="none"
                                                                    fill="rgba(29, 204, 37, 0.4)"
                                                                    legendType="none"
                                                                />
                                                            )}

                                                            {visibleTraces.eto && (
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="eto_ci"
                                                                    stroke="none"
                                                                    fill="rgba(255, 238, 0, 0.6)"
                                                                    legendType="none"
                                                                />
                                                            )}

                                                            {visibleTraces.niwr && (
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="niwr_ci"
                                                                    stroke="none"
                                                                    fill="rgba(20, 61, 242, 0.4)"
                                                                    legendType="none"
                                                                />
                                                            )}

                                                            {visibleTraces.et && (
                                                                <Line type="monotone" dataKey="Actual ET (in)" stroke="#8884d8" strokeWidth={2} />
                                                            )}
                                                            {visibleTraces.eto && (
                                                                <Line type="monotone" dataKey="Reference ET (in)" stroke="#ff7300" strokeWidth={2} />
                                                            )}
                                                            {visibleTraces.ppt && (
                                                                <Line type="monotone" dataKey="Precipitation (in)" stroke="#82ca9d" strokeWidth={2} />
                                                            )}
                                                            {visibleTraces.niwr && (
                                                                <Line type="monotone" dataKey="NIWR (in)" stroke="#143df2ff" strokeWidth={2} />
                                                            )}
                                                        </ComposedChart>
                                                    </ResponsiveContainer>
                                                ) : <p style={{ color: 'red', paddingLeft: "10%" }}>No crop water use data available for this crop in this district.</p>}


                                                <p>This chart shows the actual and reference evapotranspiration (ET, ETO) along with precipitation over time.
                                                    Actual ET (in) is a measure of the water a crop needs to grow optimally.
                                                    Reference ET (in) represents the maximum possible water use under ideal conditions, while
                                                    Precipitation (in) indicates the amount of water received from rainfall.
                                                    The shaded areas represent the 95% confidence intervals for each variable, providing insight into the variability and uncertainty in the measurements.
                                                </p>
                                                <p>This information can help farmers and water managers make informed decisions about irrigation scheduling and water resource management based on the expected water use of crops throughout the growing season.
                                                    By comparing these variables, users can assess whether additional irrigation may be necessary to meet crop water needs.
                                                </p>
                                                <p>Source: Agwater API -
                                                    <a href={`https://agwater.org:5556/crop_management/crops/cwu_summary_data?district=${selectedFeatureID}&crop=${selectedCrop}`} target="_blank" rel="noopener noreferrer">
                                                        Crop Water Use
                                                    </a>
                                                </p>
                                            </>
                                            )
                                        }, {
                                            key: 'kc', label: 'Crop Coefficient (Kc) Chart', children: (<>
                                                <span style={{ paddingLeft: "10%", fontSize: "20px" }}>{`Monthly Kc (ET Fraction) for ${selectedCropLabel}`}</span>
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <LineChart
                                                        data={chartData}
                                                        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="Month" />
                                                        <XAxis xAxisId="date" hide={true} type="number" domain={[0, 365]} />
                                                        <YAxis />
                                                        <ReferenceLine
                                                            x={getCurrentDayOfYear()}
                                                            xAxisId="date"
                                                            stroke="yellow"
                                                            label={{ value: 'Today', position: 'left', fill: 'yellow' }}
                                                        />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="ET Fraction" name="Kc" stroke="#ffd54f" strokeWidth={2} dot={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>

                                                <p>This chart shows the ratio of actual crop evapotranspiration (AET) to reference evapotranspiration (ET0), oftern referred to as a crop coefficient (Kc).
                                                    This ratio can be used to estimate the water requirements of a crop when estimates of ET0 are available.
                                                    ET0 is generally calculated based on meteorological data at a site.   The Kc value, along with information about precipitation rates,
                                                    can be used to estimate irrigation requirement to meet crop water demand according to:
                                                </p>
                                                <p style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', fontStyle: 'italic' }}>
                                                    Irrigation Requirement = (Kc * PET) - Precipitation
                                                </p>

                                                <p>
                                                    Source: Agwater API -
                                                    <a href={`https://agwater.org:5556/crop_management/crops/cwu_summary_data?district=${selectedFeatureID}&crop=${selectedCrop}`} target="_blank" rel="noopener noreferrer">
                                                        Crop Water Use
                                                    </a>
                                                </p>
                                            </>
                                            ),
                                        }, {
                                            key: 'ccwu', label: 'Comparative Crop Water Use', children: (

                                                <Row>
                                                    <Col xs={24} sm={24}>
                                                        <span style={{ paddingLeft: "10%", fontSize: "20px" }}>{`Seasonal Crop Water Use for District Crops`}</span>

                                                        <ResponsiveContainer width="100%" height={featureCropsData && featureCropsData.current ? 60 * featureCropsData.current.length : 300}>
                                                            <BarChart
                                                                data={featureCropsData.current}
                                                                layout="vertical"
                                                                margin={{ top: 20, right: 20, left: 100, bottom: 20 }}
                                                            >
                                                                <XAxis type="number" stroke='white' label={{ value: 'Seasonal Actual Crop Water Use (in)', position: 'insideBottom', offset: -5, stroke: 'white' }} />
                                                                <YAxis type="category" dataKey="name" stroke='white' />
                                                                <Bar dataKey="seasonal_et_total" fill="#1f3db4b8" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </Col>
                                                    <Col xs={24} sm={12}>
                                                        <p>
                                                            Source: Agwater API -
                                                            <a  href={`https://agwater.org:5556/crop_management/crops/cwu_summary_data?district=${selectedFeatureID}&crop=${selectedCrop}`} target="_blank" rel="noopener noreferrer">
                                                                Crop Water Use
                                                            </a>
                                                        </p>

                                                    </Col>
                                                </Row>
                                            ),
                                        }, {
                                            key: 'mlta', label: 'Monthly Long-term Averages Table', children: (
                                                <>
                                                    <Table dataSource={tableData.current} pagination={{ pageSize: 13, placement: ['none'] }} columns={tableCols} />
                                                    <p>
                                                        Source: Agwater API -
                                                        <a href={`https://agwater.org:5556/crop_management/crops/cwu_summary_data?district=${selectedFeatureID}&crop=${selectedCrop}`} target="_blank" rel="noopener noreferrer">
                                                            Crop Water Use
                                                        </a>
                                                    </p>
                                                </>
                                            )
                                        },
                                        {
                                            key: 'methods', label: 'Methods', children: (<>
                                                <p>
                                                    The crop water use data presented in this tool is derived a state-wide effort to collect and analyze agricultural water use data involving OSU, DRI, OpenET and OWRD.
                                                    This information is available in <a href="https://www.dri.edu/project/owrd-et/" target="_blank" rel="noopener noreferrer">this report</a>.  This analysis characterized
                                                    cropping patterns and associated water use and related variables (precipitation rates, irrigation rates, etc.) for approximately 260,000 agricultural fields across the state,
                                                    The source dataset described above contains roughly 115 million individual records of monthly field-scale crop water
                                                    use data across the state, which serves as the basis for the analysis presented in this tool.
                                                </p>
                                                <p>
                                                    This field-scale data, covering the period 1983 to 2022, was aggregated within each Water Master district.
                                                    Crops grown in each district were included in the analysis if there were at least 500 monthly samples for that crop
                                                    in a given region were present in the datasets were present in dataset.  The number and type of crops included in a given district
                                                    varied based on cropping patterns, but typically include around 10-20 crops per district.  Crop specific water use data was then
                                                    summarized by calculating the average monthly actual ET, reference ET (ET0, grass reference), precipitation, and net irrigation water and other Parameters
                                                    affecting crop water use for each crop in each district.  The average monthly values were calculated by taking the weighted mean
                                                    of the field-scale data for each crop in each district, where the weights were based on the number of observations available for
                                                    each month over the 1983-2022 period. 95% confidence intervals were also calculated for each monthly variable to provide
                                                    insight into the variability and uncertainty in the measurements.
                                                </p>
                                                <p>
                                                    For more information, please contact: {" "}
                                                    <a href="mailto:john.bolte@oregonstate.edu">John Bolte</a> at Oregon State University.
                                                </p>
                                                <p>
                                                    References:
                                                    <ul>
                                                        <li style={{ textAlign: 'left' }}>
                                                            <a href="https://www.dri.edu/project/owrd-et/" target="_blank"
                                                                rel="noopener noreferrer">Crop Evapotranspiration, Consumptive Use, and Open Water Evaporation for Oregon</a>.  2024.
                                                            J Huntington,B Minor, M Bromley, C Pearson, J Beamer, K Ingwersen, K Carrara, J Atkin, J Brito,
                                                            C Morton, C Dunkerly, J Volk, T Ott, P ReVelle, A Fellows, M Hoskinson.
                                                            Report prepared by Desert Research Institute for the Oregon Water Resources Department.
                                                        </li>
                                                        <li style={{ textAlign: 'left' }}>
                                                            <a href='https://extension.oregonstate.edu/sites/extd8/files/documents/em8530.pdf' target="_blank" rel="noopener noreferrer">
                                                                Oregon Crop Water Use and Irrigation </a>Requirements. 1992. R. Cuenca, J. Nuss, A. Martinez-Cob, and G. Katul.
                                                            Extension Miscellaneous Publication 8530. Oregon State University Extension Service.
                                                        </li>
                                                    </ul>
                                                </p>
                                            </>
                                            )
                                        }]}
                                    />
                                </>
                            )}
                            </>) :
                            ( <span>Selected a location on the map to view crop water use data for that location</span>)
                            }
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

CropWaterUse.propTypes = {
    //forecast: PropTypes.object,
    //showForecast: PropTypes.bool,
};

export default CropWaterUse;
