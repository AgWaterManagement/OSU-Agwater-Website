import { useState, useRef, useEffect, useCallback } from 'react';
import { Row, Col, Select, Card, Table, message, Collapse } from 'antd';
//import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import "@arcgis/map-components/components/arcgis-search"; // Import ArcGIS Search component
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, BarChart, Bar, LineChart } from 'recharts';
//import { LocateControl } from "leaflet.locatecontrol";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import 'leaflet/dist/leaflet.css';
//import L from 'leaflet';



const CropWaterUse = () => {
    const districtData = useRef(null);
    const [cropData, setCropData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState([]); // State for line chart data

    const [selectedCrop, setSelectedCrop] = useState(-1); // Default to Corn
    const selectedCropLabel = useRef('Corn');

    const [selectedDistrict, setSelectedDistrict] = useState('7');
    const districtCropsData = useRef(null)

    const [activePanel, setActivePanel] = useState('cwu'); // Changed from ref to state

    const [latlng, setLatlng] = useState(null);
    //const sampleSize = useRef(0);
    //const cumulativeET = useRef(0);
    //const cumulativePPT = useRef(0);
    //const cumulativeET0 = useRef(0);

    // used to populate crop select items based on district selection
    const [cropSelectItems, setCropSelectItems] = useState([]);

    const tableData = useRef(null)

    const tableCols = [
        { title: 'Month', dataIndex: 'month', key: 'month', align: 'center' },
        { title: 'Actual ET (in)', dataIndex: 'et', key: 'et', align: 'center' },
        { title: 'Potential ET (in)', dataIndex: 'eto', key: 'eto', align: 'center' },
        { title: 'Kc', dataIndex: 'etfraction', key: 'etfraction', align: 'center' },
        { title: 'Precipitation (in)', dataIndex: 'ppt', key: 'ppt', align: 'center' },
        { title: 'Net Irrigation Water Requirement (in)', dataIndex: 'niwr', key: 'niwr', align: 'center' },
    ];


    
    const fetchGeometry = useCallback(async (file) => {
        setLoading(true);
        
        try {
            const apiUrl = `https://agwater.org:5556/json?path=oregon_crop_water_use&file=${file}`;
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    "X-API-Key": "agwater-web-app"
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
            return data.data;
        } catch (error) {
            setLoading(false);
            console.error('Error fetching geometry data:', error);
            message.error('Unable to load geometry data');
            return null;
        }
    }, []);

    const fetchDistrictCrops = useCallback(async (district) => {
        const MIN_LEVEL = 50; // Minimum level to include a crop in the analysis (at least 5% of fields in the district and at least 10 inches of seasonal ET)
        console.log('Fetching crops for district:', district);
        setLoading(true);
        
        try {
            const apiUrl = `https://agwater.org:5556/crop_management/crops/district_crops?district=${district}&min_level=${MIN_LEVEL}`;

            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    "X-API-Key": "agwater-web-app"
                }
            });

            if (!response.ok) {
                console.error('Failed to fetch district crops data, status:', response.status);
                throw new Error('Failed to fetch district crops data');
            }

            const data = await response.json();

            if (data.error) {
                console.error('Error fetching district crops data:', data.error);
                throw new Error('Failed to fetch district crops data');
            }   

            const _cropData = data.crops;
            // sort the crops by seasonal_et_total in descending order
            _cropData.sort((a, b) => b.seasonal_et_total - a.seasonal_et_total);

            const _cropSelectItems = _cropData.map(crop => ({
                value: crop.code,
                label: crop.name
            }));
            districtCropsData.current = _cropData;
            setCropSelectItems(_cropSelectItems);
            setSelectedCrop(_cropSelectItems.length > 0 ? _cropSelectItems[0].value : null);
            console.log('Fetched district crops data for district:', district, 'Crops:', _cropData );
            setLoading(false);
            return data;
        } catch (error) {
            setLoading(false);
            console.error('Error fetching district crops data:', error);
            message.error('Unable to load district crops data');
            return null;
        }
    }, []);

    const fetchCropData = useCallback(async (district, crop) => {
        setLoading(true);
        console.log('Fetching crop water use data for district:', district, 'and crop:', crop);

        if (!district || !crop || crop === -1) {
            console.warn('District or crop not selected, skipping data fetch');
            setLoading(false);
            return;
        }
        
        try {
            const apiUrl = `https://agwater.org:5556/crop_management/crops/cwu_summary_data?district=${district}&crop=${crop}`;

            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    "X-API-Key": "agwater-web-app"
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
                    "Potential ET (in)": etoValue, 
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
            console.log('Finished fetching and processing crop water use data:');
            setLoading(false);

        } catch (error) {
            console.error('Error processing chart data:', error);
            message.error('Unable to process crop water use data for chart');
            setLoading(false);
            return;
        }       
    }, []);

    const handleCropChange = (value) => {
        setSelectedCrop(value);
        selectedCropLabel.current = cropSelectItems.find(item => item.value === value)?.label || '';
    };

    // Function to handle search result
    const handleSearchResult = (event) => {
        const result = event.detail.results;
        if (result && result.length > 0) {
            const { latitude, longitude } = result[0].location;
            setSelectedDistrict(null); // Clear selected district
        }
    };

    const handlePanelChange = (key) => {
        setActivePanel(key);
    };

    // initialization
    useEffect(() => {
        let active = true;

        const initialize = async () => {
            console.log('Component mounted, fetching initial data');
            districtData.current = await fetchGeometry('Watermaster_Districts');
            if (!active) return;

            await fetchDistrictCrops(selectedDistrict);

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
            active = false;
            const arcgisSearch = document.querySelector('arcgis-search');
            if (arcgisSearch) {
                arcgisSearch.removeEventListener('arcgis-search-result', handleSearchResult);
            }
        };

    }, [fetchDistrictCrops, fetchGeometry, selectedDistrict]);

    useEffect(() => {
        fetchCropData(selectedDistrict, selectedCrop);
    }, [fetchCropData, selectedCrop, selectedDistrict]);

    useEffect(() => {
        fetchDistrictCrops(selectedDistrict);
    }, [fetchDistrictCrops, selectedDistrict]);

    const getDistrictStyle = (feature) => {
        const isSelected = `${feature?.properties?.district_nbr}` === `${selectedDistrict}`;

        return {
            weight: isSelected ? 3 : 1,
            color: isSelected ? '#ffd400' : '#0000ff',
            fill: false,
            opacity: 1
        };
    };
    const onEachDistrict = (feature, layer) => {
        layer.bindTooltip(`District ${feature.properties.district_nbr}`, {
            direction: 'top',
            sticky: true,
            opacity: 0.95
        });

        layer.on({
            click: async (e) => {
                setSelectedDistrict(feature.properties.district_nbr);
                const centroid = feature.properties.centroid;
                setLatlng(centroid ? [centroid[1], centroid[0]] : null); // GeoJSON format is [longitude, latitude]
                console.log('Selected District:', feature.properties.district_nbr);
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
                    fillOpacity: 0.1
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
    //    ratio: (d["Actual ET (in)"] && d["Potential ET (in)"])
    //        ? Number((d["Actual ET (in)"] / d["Potential ET (in)"]).toFixed(3))
    //        : null
    //}));

    return (
        <>
            <div>
                <h3 style={{ marginLeft: '0.4em' }}>Crop Water Use in Oregon</h3>

                <p>
                    This tool provides insights into the water use of various crops across different Water Master districts in Oregon.
                    By selecting a district and crop of interest, users can visualize localized average monthly crop water use data,
                    including actual and potential evapotranspiration (ET), precipitation, and net irrigation water
                    requirement (NIWR) for the selected crop. This information can help farmers and water managers make informed
                    decisions about irrigation scheduling and water resource management based on the expected water use of crops
                    throughout the growing season.
                </p>
                <br/>

                <Row gutter={16}>
                    <Col xs={24} sm={6}>
                        <Card title="My Location" size="small">
                            <div style={{ height: '500px', width: '100%', marginBottom: '16px' }}>
                                <Select
                                    style={{width: '100%', marginBottom: '8px'}}
                                    placeholder="Select a location layer"
                                    options={[
                                        { value: 'water_master_districts', label: 'Water Master Districts' },
                                        { value: 'huc8_watersheds', label: 'HUC 8 Watersheds' },
                                        { value: 'counties', label: 'Counties' },
                                    ]}
                                />
                                <MapContainer
                                    center={[44.0, -120.5]}
                                    zoom={6}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
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
                                   
                                    { districtData.current && (
                                        <GeoJSON 
                                            data={districtData.current} 
                                            onEachFeature={onEachDistrict}
                                            style={{ getDistrictStyle }}
                                        />
                                    )}
                                    {/* <DistrictLabels districtData={districtData} onEachDistrict={onEachDistrict} /> */}
                                    <arcgis-search
                                        placeholder="Search for a location"
                                        style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}
                                    ></arcgis-search>
                                </MapContainer>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={18}>
                        <Card title={`Crop Water Use Data${selectedDistrict ? ` - District ${selectedDistrict}` : ''}`} size="small">

                            <Select
                                placeholder="Select a crop"
                                value={selectedCrop}
                                onChange={handleCropChange}
                                options={cropSelectItems}
                                style={{ width: '20em', marginBottom: '16px' }}
                            />
                            {loading && <span>Loading data...</span>}
                            {!loading && chartData && (
                                <>
                                    <Collapse
                                        accordion={true}
                                        activeKey={activePanel}
                                        onChange={handlePanelChange}
                                        items={[{
                                            key: 'cwu', label: 'Crop Water Use Chart', children: (<>
                                                <span style={{ paddingLeft: "10%", fontSize: "20px" }}>{`Monthly Crop Water Use for ${selectedCropLabel.current}`}</span>
                                            
                                                { chartData.some(d => d["Actual ET (in)"] !== null) ? (
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

                                                        <Area
                                                            type="monotone"
                                                            dataKey="et_ci"
                                                            stroke="none"
                                                            fill="rgba(44, 162, 236, 0.4)"
                                                            legendType="none"
                                                        />

                                                        <Area
                                                            type="monotone"
                                                            dataKey="ppt_ci"
                                                            stroke="none"
                                                            fill="rgba(29, 204, 37, 0.4)"
                                                            legendType="none"
                                                        />

                                                        <Area
                                                            type="monotone"
                                                            dataKey="eto_ci"
                                                            stroke="none"
                                                            fill="rgba(255, 238, 0, 0.6)"
                                                            legendType="none"
                                                        />

                                                        <Area
                                                            type="monotone"
                                                            dataKey="niwr_ci"
                                                            stroke="none"
                                                            fill="rgba(20, 61, 242, 0.4)"
                                                            legendType="none"
                                                        />

                                                        <Line type="monotone" dataKey="Actual ET (in)" stroke="#8884d8" strokeWidth={2} />
                                                        <Line type="monotone" dataKey="Potential ET (in)" stroke="#ff7300" strokeWidth={2} />
                                                        <Line type="monotone" dataKey="Precipitation (in)" stroke="#82ca9d" strokeWidth={2} />
                                                        <Line type="monotone" dataKey="NIWR (in)" stroke="#143df2ff" strokeWidth={2} />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                                ) : <p style={{ color: 'red', paddingLeft: "10%" }}>No crop water use data available for this crop in this district.</p>}
                                                

                                                <p>This chart shows the actual and potential evapotranspiration (ET) along with precipitation over time.
                                                    Actual ET (in) is a measure of the water a crop needs to grow optimally.
                                                    Potential ET (in) represents the maximum possible water use under ideal conditions, while
                                                    Precipitation (in) indicates the amount of water received from rainfall.
                                                    The shaded areas represent the 95% confidence intervals for each variable, providing insight into the variability and uncertainty in the measurements.
                                                </p>
                                                <p>This information can help farmers and water managers make informed decisions about irrigation scheduling and water resource management based on the expected water use of crops throughout the growing season.
                                                    By comparing these variables, users can assess whether additional irrigation may be necessary to meet crop water needs.
                                                </p>
                                            </>
                                            )
                                        }, {
                                            key: 'kc', label: 'Crop Coefficient (Kc) Chart', children: (<>
                                                <span style={{ paddingLeft: "10%", fontSize: "20px" }}>{`Monthly Kc (ET Fraction) for ${selectedCropLabel.current}`}</span>
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
                                            </>
                                            ),
                                        }, {
                                            key: 'ccwu', label: 'Comparative Crop Water Use', children: (
                                                <Row>
                                                    <Col xs={24} sm={24}>
                                                        <span style={{ paddingLeft: "10%", fontSize: "20px" }}>{`Seasonal Crop Water Use for District Crops`}</span>

                                                        <ResponsiveContainer width="100%" height={districtCropsData && districtCropsData.current ? 60 * districtCropsData.current.length : 300}>
                                                            <BarChart
                                                                data={districtCropsData.current}
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
                                                    </Col>
                                                </Row>
                                            ),
                                        }, {
                                            key: 'mlta', label: 'Monthly Long-term Averages Table', children: (
                                                <Table dataSource={tableData.current} pagination={{ pageSize: 13, placement: ['none'] }} columns={tableCols} />
                                            )},
                                            {
                                            key: 'methods', label: 'Methods', children: ( <>
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
                                                    summarized by calculating the average monthly actual ET, potential ET, precipitation, and net irrigation water and other Parameters
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
                                                    <li style={{textAlign: 'left', color: 'white'}}>
                                                       <a href="https://www.dri.edu/project/owrd-et/" target="_blank"
                                                        rel="noopener noreferrer">Crop Evapotranspiration, Consumptive Use, and Open Water Evaporation for Oregon</a>.  2024.
                                                       J Huntington,B Minor, M Bromley, C Pearson, J Beamer, K Ingwersen, K Carrara, J Atkin, J Brito,
                                                       C Morton, C Dunkerly, J Volk, T Ott, P ReVelle, A Fellows, M Hoskinson.                                                       
                                                       Report prepared by Desert Research Institute for the Oregon Water Resources Department.  
                                                    </li>
                                                    <li style={{textAlign: 'left', color: 'white'}}>
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
