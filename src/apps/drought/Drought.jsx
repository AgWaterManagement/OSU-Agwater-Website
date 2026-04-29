import { useState, useEffect } from 'react';

import { Divider, Row, Col, Tabs, Button, Card, message, Typography, Collapse, Modal, Select } from 'antd';
import { MapContainer, TileLayer, WMSTileLayer, GeoJSON, useMapEvents } from 'react-leaflet';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, BarChart, Bar, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

import PropTypes from 'prop-types';
import { secrets } from '../../secrets';
import WeatherForecast from './WeatherForecast';
import SummaryPanel from '../../components/drought/SummaryPanel';
import "@arcgis/map-components/components/arcgis-search"; // Import ArcGIS Search component

const { Title} = Typography;

//import './IrrigWaterUse.css';

const droughtCategories = [
	{ level: 'D0', label: 'Abnormally Dry', color: '#FFFF00', description: 'Going into drought: short-term dryness slowing planting, growth of crops or pastures' },
	{ level: 'D1', label: 'Moderate Drought', color: '#FCD37F', description: 'Some damage to crops, pastures; streams, reservoirs, or wells low' },
	{ level: 'D2', label: 'Severe Drought', color: '#FFAA00', description: 'Crop or pasture losses likely; water shortages common; water restrictions imposed' },
	{ level: 'D3', label: 'Extreme Drought', color: '#E60000', description: 'Major crop/pasture losses; widespread water shortages or restrictions' },
	{ level: 'D4', label: 'Exceptional Drought', color: '#730000', description: 'Exceptional and widespread crop/pasture losses; shortages of water in reservoirs, streams, and wells creating water emergencies' }
];



const DroughtSummary = ({ countyDroughtData, countyName }) => {
    // Tooltip with formatted data as a pie chart
    const FormattedTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;

        // Transform payload into pie chart data
        const pieData = payload.map(entry => ({
            name: entry.name,
            value: entry.value,
            fill: entry.color
        }));

        const droughtColors = {
            'No Drought': 'white',
            'D0': '#FFFF00',
            'D1': '#FCD37F',
            'D2': '#FFAA00',
            'D3': '#E60000',
            'D4': '#730000'
        };

        return (
            <div style={{ backgroundColor: '#1a1a1a', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <p style={{ color: 'white', margin: '0 0 10px 0' }}>{`Date: ${new Date(label).toLocaleDateString()}`}</p>
                <ResponsiveContainer width={180} height={150}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                            labelStyle={{ fontSize: '12px', fill: 'white' }}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={droughtColors[entry.name] || entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        );
    };



    if (!countyDroughtData) {
        console.log('County drought data is not available');
        return <div style={{ textAlign: 'center', padding: '20px' }}>Drought severity data has not been loaded.</div>;
    }

    if (countyName == null) {
        console.log('County name is null');
        return <div style={{ textAlign: 'center', padding: '20px' }}>Drought severity data not available for this county.</div>;
    }

    countyName = countyName.replace(/ County$/, '').trim(); // Remove "County" from the name if it exists
    const data = countyDroughtData[countyName];

    if (!data) {
        console.log(`Drought data not available for county: ${countyName}`);
        return <div style={{ textAlign: 'center', padding: '20px' }}>This county was not found in the dataset.</div>;
    }

    // Prepare data for the AreaChart
    const chartData = data.validEnd.map((date, index) => ({
        date: date.split('T')[0].slice(5), // Format date to MM-DD
        D0: data.d0[index],
        D1: data.d1[index],
        D2: data.d2[index],
        D3: data.d3[index],
        D4: data.d4[index],
		"No Drought": 100-data.d0[index]-data.d1[index]-data.d2[index]-data.d3[index]-data.d4[index],
    }));

    return (
        <>
            <Title level={5}>Short-term Drought Forecast for {countyName} County </Title>
			<div>Colors represent the fraction of the county experiencing each drought level.</div>

			<ResponsiveContainer width="100%" height={300}>
	        <AreaChart			
         		margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
		        responsive
                data={chartData}
            >
				<CartesianGrid strokeDasharray="3 3" fill='white' />
                <XAxis dataKey="date" />
                <YAxis />
				<Legend />
                <Tooltip
				  content={<FormattedTooltip />}
				
				contentStyle={{ backgroundColor: '#ba2c2cff', border: '1px solid #ccc' }}/>
                <Area type="monotone" dataKey="No Drought" stackId="1" stroke="white" fill="white" />
                <Area type="monotone" dataKey="D0" stackId="1" stroke="#FFFF00" fill="#FFFF00" />
                <Area type="monotone" dataKey="D1" stackId="1" stroke="#FCD37F" fill="#FCD37F" />
				<Area type="monotone" dataKey="D2" stackId="1" stroke="#FFAA00" fill="#FFAA00" />
				<Area type="monotone" dataKey="D3" stackId="1" stroke="#E60000" fill="#E60000" />
				<Area type="monotone" dataKey="D4" stackId="1" stroke="#730000" fill="#730000" />
            </AreaChart>


			</ResponsiveContainer>
        </>
    );
};

DroughtSummary.propTypes = {
	countyDroughtData: PropTypes.object,
	countyName: PropTypes.string
}

const StatusBar = ({ level }) => {
	const droughtLevels = ['None', 'D0', 'D1', 'D2', 'D3', 'D4'];
	const droughtColors = ['white', '#FFFF00', '#FCD37F', '#FFAA00', '#E60000', '#730000'];

	const levelIndex = droughtLevels.indexOf(level);

	return (
		<div style={{ display: 'flex', gap: '0px', marginTop: '12px', marginBottom: '12px', borderRadius: '4px', }}>
			{droughtLevels.map((droughtLevel, index) => (
				<div
					key={droughtLevel}
					style={{
						display: 'block',
						height: '30px',
						width: '100%',
						backgroundColor: level > index ? droughtColors[index] : 'rgba(255, 255, 255, 0)',
						border: 'none',
						borderWidth: '0',
						borderRadius: '0',
						fontSize: '12px',
						fontWeight: 'bold',
						padding: '0',
						margin: '0',
						color: index <= levelIndex ? '#000' : '#ccc'
					}}
				>
					{level > index && droughtLevel}
				</div>
			))}
		</div>
	);
};

StatusBar.propTypes = {
	level: PropTypes.number
};

let countyDroughtData = {};


const Drought = () => {
	const usdmWMSURL = "https://ndmcgeodata.unl.edu/cgi-bin/mapserv.exe?map=%2Fms4w%2Fapps%2Fusdm%2Fmap%2Fusdm_current_wms.map";

	const countiesURL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Counties/FeatureServer/0/query";

	const [countiesData, setCountiesData] = useState(null);
	//const [countyDroughtInfo, setCountyDroughtInfo] = useState(null);
	const [loading, setLoading] = useState(false);
	const [selectedCounty, setSelectedCounty] = useState(null);
	const [droughtInfo, setDroughtInfo] = useState(null);
	const [showMoreInfo, setShowMoreInfo] = useState(false);
	const [currentTab, setCurrentTab] = useState('map');
	const [forecast, setForecast] = useState(null);
	const [searchResult, setSearchResult] = useState(null);
	const [streamForecast, setStreamForecast] = useState(null);
	const [snowForecast, setSnowForecast] = useState(null);
	const [reservoirForecast, setReservoirForecast] = useState(null);
	const [modalChart, setModalChart] = useState(null);
	const [hucConditions, setHucConditions] = useState(null);
	const [hucForecasts, setHucForecasts] = useState(null);
	const [hucNames, setHucNames] = useState({});
	const [currentHuc, setCurrentHuc] = useState(null);
	const [activeMapLayer, setActiveMapLayer] = useState('forecast_pct_normal');

	const countyCentroids = {
		"Baker": { latitude: 44.7661, longitude: -117.8334, zoneId: "ORZ001" },
		"Benton": { latitude: 44.6288, longitude: -123.3383, zoneId: "ORZ002" },
		"Clackamas": { latitude: 45.2027, longitude: -122.4087, zoneId: "ORZ003" },
		"Clatsop": { latitude: 46.1695, longitude: -123.1867, zoneId: "ORZ004" },
		"Columbia": { latitude: 45.7455, longitude: -122.8232, zoneId: "ORZ005" },
		"Coos": { latitude: 43.1890, longitude: -124.4335, zoneId: "ORZ006" },
		"Crook": { latitude: 44.2658, longitude: -120.8552, zoneId: "ORZ007" },
		"Curry": { latitude: 42.2025, longitude: -124.5700, zoneId: "ORZ008" },
		"Deschutes": { latitude: 43.8304, longitude: -121.7800, zoneId: "ORZ009" },
		"Douglas": { latitude: 43.2166, longitude: -123.3640, zoneId: "ORZ010" },
		"Gilliam": { latitude: 45.2060, longitude: -120.2240, zoneId: "ORZ011" },
		"Grant": { latitude: 44.3000, longitude: -118.8000, zoneId: "ORZ012" },
		"Harney": { latitude: 43.5900, longitude: -118.9620, zoneId: "ORZ013" },
		"Hood River": { latitude: 45.5000, longitude: -121.5000, zoneId: "ORZ014" },
		"Jackson": { latitude: 42.3000, longitude: -122.8000, zoneId: "ORZ015" },
		"Jefferson": { latitude: 44.6000, longitude: -121.1000, zoneId: "ORZ016" },
		"Josephine": { latitude: 42.4000, longitude: -123.3000, zoneId: "ORZ017" },
		"Klamath": { latitude: 42.2000, longitude: -121.8000, zoneId: "ORZ018" },
		"Lake": { latitude: 42.2000, longitude: -120.6000, zoneId: "ORZ019" },
		"Lane": { latitude: 43.9700, longitude: -123.1000, zoneId: "ORZ020" },
		"Lincoln": { latitude: 44.6000, longitude: -124.0000, zoneId: "ORZ021" },
		"Linn": { latitude: 44.5000, longitude: -122.8000, zoneId: "ORZ022" },
		"Malheur": { latitude: 43.6000, longitude: -117.2000, zoneId: "ORZ023" },
		"Marion": { latitude: 44.9000, longitude: -123.0000, zoneId: "ORZ024" },
		"Morrow": { latitude: 45.5000, longitude: -119.3000, zoneId: "ORZ025" },
		"Multnomah": { latitude: 45.5155, longitude: -122.6750, zoneId: "ORZ026" },
		"Polk": { latitude: 44.9000, longitude: -123.3000, zoneId: "ORZ027" },
		"Sherman": { latitude: 45.5000, longitude: -120.5000, zoneId: "ORZ028" },
		"Tillamook": { latitude: 45.4500, longitude: -123.8000, zoneId: "ORZ029" },
		"Umatilla": { latitude: 45.5000, longitude: -118.8000, zoneId: "ORZ030" },
		"Union": { latitude: 45.3000, longitude: -118.2000, zoneId: "ORZ031" },
		"Wallowa": { latitude: 45.4000, longitude: -117.2000, zoneId: "ORZ032" },
		"Wasco": { latitude: 45.5000, longitude: -121.2000, zoneId: "ORZ033" },
		"Washington": { latitude: 45.5000, longitude: -123.1000, zoneId: "ORZ034" },
		"Yamhill": { latitude: 45.2000, longitude: -123.2000, zoneId: "ORZ035" }
	};

	// process the data returned from the drought severity API to create a more usable structure for the charts.
	// The API returns an array of objects, each containing a county name, a valid end date, and the percentage
	//  of the county in each drought category (d0-d4). We want to transform this into an object where 
	// each key is a county name and the value is an object containing arrays of valid end dates
	// and corresponding drought percentages for each category. This will allow us to easily access 
	// the drought data for any given county and plot it over time.
	const reduce_county_json = (dataArray) => {
		countyDroughtData = {};

		dataArray.forEach(item => {
			let countyName = item.county;
			// if the county name has "county" in it, remove it
			if (countyName.toLowerCase().includes("county")) {
				countyName = countyName.replace(/county/i, '').trim();
			}

			// Initialize the county entry if it doesn't exist
			if (!countyDroughtData[countyName]) {
				countyDroughtData[countyName] = {
					validEnd: [],
					d0: [],
					d1: [],
					d2: [],
					d3: [],
					d4: []
				};
			}

			// Push the values into the respective arrays
			countyDroughtData[countyName].validEnd.push(item.validEnd);
			countyDroughtData[countyName].d0.push(item.d0);
			countyDroughtData[countyName].d1.push(item.d1);
			countyDroughtData[countyName].d2.push(item.d2);
			countyDroughtData[countyName].d3.push(item.d3);
			countyDroughtData[countyName].d4.push(item.d4);
		});

		// Sort the data by validEnd for each county
		Object.keys(countyDroughtData).forEach(county => {
			const indices = countyDroughtData[county].validEnd.map((date, index) => ({ date, index }));
			indices.sort((a, b) => new Date(a.date) - new Date(b.date));

			countyDroughtData[county].validEnd = indices.map(i => countyDroughtData[county].validEnd[i.index]);
			countyDroughtData[county].d0 = indices.map(i => countyDroughtData[county].d0[i.index]);
			countyDroughtData[county].d1 = indices.map(i => countyDroughtData[county].d1[i.index]);
			countyDroughtData[county].d2 = indices.map(i => countyDroughtData[county].d2[i.index]);
			countyDroughtData[county].d3 = indices.map(i => countyDroughtData[county].d3[i.index]);
			countyDroughtData[county].d4 = indices.map(i => countyDroughtData[county].d4[i.index]);
		});

		return countyDroughtData;
	};


	// Function to fetch drought severity data for all counties and populate the countyDroughtData object. 
	// We will fetch data for the past 60 days to have a good range of historical data for the charts. 
	// The API requires start and end dates in M/D/YYYY format, so we will calculate those based on the current date.
	// We will also handle errors gracefully and log them to the console, as well as display a message 
	// to the user if the data cannot be loaded.
	const PopulateCountyData = () => {

		// get current date in M/D/YYYY format, and date 60 days ago in same format
		const today = new Date();
		const pastDate = new Date(today);
		pastDate.setDate(pastDate.getDate() - 60);
		const formatDate = (date) => {
			const month = date.getMonth() + 1;
			const day = date.getDate();
			const year = date.getFullYear();
			return `${month}/${day}/${year}`;
		};
		const startDate = formatDate(pastDate);
		const endDate = formatDate(today);

		// fetch the data and populate countyDroughtData with the latest drought severity for each county
		const dataURL = `https://agwater.org:5556/crop_management/drought/data?area=CountyStatistics&statisticsType=GetDroughtSeverityStatisticsByAreaPercent&aoi=OR&startdate=${startDate}&enddate=${endDate}`;

		fetch(dataURL, {
			headers: {
				"X-API-Key": secrets.agwater_api_key
			}
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				reduce_county_json(data);
				console.log('County drought data:', countyDroughtData);
			})
			.catch(error => {
				console.error('Error fetching drought severity data:', error);
				message.error('Unable to load drought severity data');
			});
	}

	const GetNWSForcast = (latitude, longitude) => {
		// fetch the grid information for the given coordinates, then use that to fetch the forecast data from the NWS API. Handle errors gracefully and return informative messages if something goes wrong.

		const points_url = `https://api.weather.gov/points/${latitude},${longitude}`;
		const headers = {
			"User-Agent": "(AgWaterAPI, contact@agwater.org)"  // NWS requires a User-Agent
		};

		const FetchNWSForecast = async () => {
			try {
				const pointsResponse = await fetch(points_url, { headers });
				if (!pointsResponse.ok) {
					throw new Error('Failed to fetch grid information');
				}
				const pointsData = await pointsResponse.json();

				// Extract grid information
				const gridOffice = pointsData.properties.gridId;
				const gridX = pointsData.properties.gridX;
				const gridY = pointsData.properties.gridY;

				// Step 2: Get forecast data using grid information
				const forecastUrl = `https://api.weather.gov/gridpoints/${gridOffice}/${gridX},${gridY}/forecast`;
				const forecastResponse = await fetch(forecastUrl, { headers });
				if (!forecastResponse.ok) {
					throw new Error('Failed to fetch forecast data');
				}
				const forecastData = await forecastResponse.json();

				return {
					success: true,
					location: {
						latitude,
						longitude,
						gridOffice,
						gridX,
						gridY,
					},
					forecast: forecastData,
				};
			} catch (error) {
				console.error('Error fetching NWS forecast:', error);
				return { success: false, error: error.message };
			}
		};

		FetchNWSForecast()
			.then(result => {
				if (result.success) {
					console.log('NWS Forecast data:', result.forecast);
					setForecast(result.forecast.properties);
				} else {
					message.error(`Unable to load NWS forecast: ${result.error}`);
				}
			});
	};



	const GetWeatherAlerts = async (zoneId) => {
		const alertsUrl = `http://api.weather.gov/alerts/active/zone/ORZ001`  //${zoneId}`;
		const headers = {
			"User-Agent": "(AgWaterAPI, contact@agwater.org)"  // NWS requires a User-Agent
		};

		try {
			const response = await fetch(alertsUrl, { headers });
			if (!response.ok) {
				throw new Error('Failed to fetch weather alerts');
			}
			const alertsData = await response.json();
			return alertsData;
		} catch (error) {
			console.error('Error fetching weather alerts:', error);
			message.error('Unable to load weather alerts');
			return null;
		}
	};

	const parseSnowForecastHtml = (html, baseUrl) => {
		const doc = new DOMParser().parseFromString(html, "text/html");
		const keywordRegex = /(snow|swe|water supply|forecast|basin|streamflow|outlook)/i;

		const links = Array.from(doc.querySelectorAll("a[href]"))
			.map((a) => {
				const text = (a.textContent || "").trim().replace(/\s+/g, " ");
				const href = new URL(a.getAttribute("href"), baseUrl).toString();
				return { text, href };
			})
			.filter((x) => keywordRegex.test(`${x.text} ${x.href}`));

		// dedupe by href
		const unique = [];
		const seen = new Set();
		for (const item of links) {
			if (!seen.has(item.href)) {
				seen.add(item.href);
				unique.push(item);
			}
		}

		return unique.slice(0, 20);
	};

	const GetStreamForecast = async (countyName) => {
		try {
			// Use the AWDB stations metadata endpoint to find all stations in this county
			// that have SRVO forecast data (indicated by the forecastPoint metadata field).
			const stationsUrl = 'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/stations';
			const cleanCountyName = countyName ? countyName.replace(/ County$/i, '').trim() : null;
			
			const stationsParams = new URLSearchParams({
				stationTriplets: '*:OR:USGS',	// For now, we will stick with forecasts from US Geological Survey stations, which are the most common source of streamflow forecasts in the AWDB. This may be expanded in the future to include other station types if they have forecastPoint metadata.
				elements: 'SRVO',	// We are currently only forecasting streamflow volume (SRVO), but in the future we may want to include other forecasted elements such as SWE or water supply forecasts if they are available for stations in the selected county.
				activeOnly: 'true',
				returnForecastPointMetadata: 'true'	// This will be useful to filter for stations that have forecast data available, and to display metadata about the forecast points in the UI.
			});
			if (cleanCountyName) {
				stationsParams.append('countyNames', cleanCountyName);
			}

			//console.log(`Fetching stations with params: ${stationsParams.toString()}`);

			const stationsResponse = await fetch(`${stationsUrl}?${stationsParams}`, {
				headers: { 'Accept': 'application/json' }
			});
			if (!stationsResponse.ok) {
				throw new Error(`Failed to fetch stations (${stationsResponse.status})`);
			}

			const stations = await stationsResponse.json();

			// Only keep stations that have forecastPoint metadata — these have SRVO forecast data
			const forecastStations = (stations || []).filter(s => s.forecastPoint);

			if (forecastStations.length === 0) {
				setStreamForecast({
					source: 'USDA AWDB REST API',
					fetchedAt: new Date().toISOString(),
					stations: [],
					noStations: true
				});
				return;
			}

			const stationsToFetch = forecastStations.slice(0, 10);
			const streamData = [];

			for (const station of stationsToFetch) {
				console.log(`Fetching forecast for station ${station.name} (${station.stationId}) at ${station.stationTriplet}`);
				try {
					const forecastUrl = 'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/forecasts';

					// Determine the start month of the current quarter so we can select the
					// most relevant forecast period from whatever the station provides.
					const currentMonth = new Date().getMonth() + 1;
					const quarterStartMonth = currentMonth < 4 ? 1 : currentMonth < 7 ? 4 : currentMonth < 10 ? 7 : 10;
					const quarterStartPrefix = String(quarterStartMonth).padStart(2, '0');

					// Helper: compute duration in days for a forecastPeriod (array or legacy object).
					const periodDays = (fp) => {
						const toDate = (mmdd) => new Date(`2000-${mmdd}`);
						if (Array.isArray(fp)) return (toDate(fp[1]) - toDate(fp[0])) / 86400000;
						const start = fp?.beginDate || fp?.startDate;
						const end = fp?.endDate;
						return start && end ? (toDate(end) - toDate(start)) / 86400000 : Infinity;
					};

					// Fetch all available periods for this station — no forecastPeriods filter —
					// so stations with non-standard period lengths (e.g. 04-01 to 07-31 instead
					// of 04-01 to 06-30) are still returned.
					const forecastParams = new URLSearchParams({
						stationTriplets: station.stationTriplet,
						elementCodes: 'SRVO',
					});

					const forecastResponse = await fetch(`${forecastUrl}?${forecastParams}`, {
						headers: { 'Accept': 'application/json' }
					});

					console.log(`Response for station ${station.name}:`, forecastResponse);

					if (forecastResponse.ok) {
						const data = await forecastResponse.json();
						//console.log(`Forecast data for station ${station.name}:`, data);
						if (data && data.length > 0) {
							const stationForecast = data[0];

							// Filter to periods that start in the current quarter, then pick the
							// shortest one so stations with non-standard period lengths still show data.
							const allDataEntries = stationForecast?.data || [];
							const quarterEntries = allDataEntries.filter(d => {
								const fp = d.forecastPeriod;
								const startMM = Array.isArray(fp)
									? fp[0].slice(0, 2)
									: (fp?.beginDate || fp?.startDate || '').slice(0, 2);
								return startMM === quarterStartPrefix;
							});
							// Among matching entries pick the shortest period; fall back to all entries.
							const candidates = quarterEntries.length > 0 ? quarterEntries : allDataEntries;
							candidates.sort((a, b) => periodDays(a.forecastPeriod) - periodDays(b.forecastPeriod));
							const selectedEntries = candidates.length > 0 ? [candidates[0]] : [];

							const periods = selectedEntries.map(d => {
								// forecastPeriod: new API returns array ["MM-DD","MM-DD"],
								// legacy returns object {name, beginDate, endDate}
								let periodName;
								if (Array.isArray(d.forecastPeriod)) {
									periodName = `${d.forecastPeriod[0]}–${d.forecastPeriod[1]}`;
								} else {
									periodName = d.forecastPeriod?.name ||
										`${d.forecastPeriod?.beginDate}–${d.forecastPeriod?.endDate}`;
								}

								// forecastValues: new API returns plain object {"5": 110, "30": 82, ...},
								// legacy returns array [{exceedanceProbability, value}]
								let forecastValues;
								if (d.forecastValues && !Array.isArray(d.forecastValues)) {
									forecastValues = Object.entries(d.forecastValues)
										.filter(([, val]) => val !== null && val !== undefined)
										.map(([prob, val]) => ({ exceedanceProbability: prob, value: val }));
								} else {
									forecastValues = (d.forecastValues || d.values || []).filter(
										v => v.exceedanceProbability !== undefined && v.value !== null
									);
								}

								const rawUnit = d.unitCode || d.unit || 'kac_ft';
								const unit = (rawUnit === 'kac_ft' || rawUnit === 'kaf') ? 'KAF'
									: rawUnit === 'af' ? 'acre-ft'
									: rawUnit === 'cfs' ? 'CFS'
									: rawUnit.toUpperCase();

								return { periodName, forecastValues, unit };
							}).filter(p => p.forecastValues.length > 0);

							if (periods.length > 0) {
								streamData.push({
									stationName: station.name,
									stationId: station.stationId,
									stationTriplet: station.stationTriplet,
									periods
								});
							}
						}
					} else {
						console.warn(`Failed to fetch forecast for ${station.name}: ${forecastResponse.status}`);
					}
				} catch (err) {
					console.warn(`Error fetching forecast for ${station.name}:`, err);
				}
			}

			setStreamForecast({
				source: 'USDA AWDB REST API',
				fetchedAt: new Date().toISOString(),
				stations: streamData,
				noStations: streamData.length === 0
			});

			console.log('Stream forecast data:', streamData);

		} catch (error) {
			console.error('Error fetching stream forecast:', error);
			setStreamForecast(null);
			message.error('Stream forecast data could not be loaded.');
		}
	};


	const GetSnowForecast = async (countyName) => {
    try {
        // Use the AWDB REST API to get snow data for SNTL stations in the selected county
        const stationsUrl = "https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/stations";
        const cleanCountyName = countyName ? countyName.replace(/ County$/i, '').trim() : null;
        const stationsParams = new URLSearchParams({
			stationTriplets: '*:OR:SNTL',
            activeOnly: 'true'
        });
        if (cleanCountyName) {
            stationsParams.append('countyNames', cleanCountyName);
        }

        const stationsResponse = await fetch(`${stationsUrl}?${stationsParams}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!stationsResponse.ok) {
            throw new Error(`Failed to fetch stations (${stationsResponse.status})`);
        }

        const stations = await stationsResponse.json();

        if (!stations || stations.length === 0) {
            setSnowForecast({
                source: 'USDA AWDB REST API',
                fetchedAt: new Date().toISOString(),
                stations: [],
                totalStations: 0,
                noStations: true
            });
            return;
        }

        // Get current snow data for the first few stations
        const snowData = [];
        const stationsToFetch = stations.slice(0, 10); // Limit to first 10 stations

        // Calculate date range (last 7 days). Using the DAILY duration,
		// we can indicate the number of past days to fetch data for.
		// The API will return the most recent data within that range,
		// so we can set endDate to 0 (today) and beginDate to -365 (past calendar year).
        const endDate = 0;
        const beginDate = -365;

        for (const station of stationsToFetch) {
            try {
                // Get Snow Water Equivalent (SWE) data
                const dataUrl = `https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data`;
                const dataParams = new URLSearchParams({
                    stationTriplets: station.stationTriplet,
                    elements: 'WTEQ', // Snow Water Equivalent
                    duration: 'DAILY',
                    returnFlags: 'false',
                    beginDate: beginDate,
                    endDate: endDate,
                });

                const dataResponse = await fetch(`${dataUrl}?${dataParams}`, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (dataResponse.ok) {
                    const data = await dataResponse.json();
                    if (data && data.length > 0) {
                        const stationData = data[0];
                        const values = stationData?.data?.[0]?.values
                            ?.filter(v => v.value !== null && v.value !== undefined)
                            ?.map(v => ({ date: v.date, value: v.value }));
                        if (values && values.length > 0) {
                            snowData.push({
                                stationName: station.name,
                                stationId: station.stationId,
                                elevation: station.elevation,
                                values: values,
                                unit: 'inches'
                            });
                        }
                    }
                } else {
                    console.warn(`Failed to fetch data for station ${station.name}: ${dataResponse.status}`);
                }
            } catch (err) {
                console.warn(`Failed to fetch data for station ${station.name}:`, err);
            }
        }

        setSnowForecast({
            source: 'USDA AWDB REST API',
            fetchedAt: new Date().toISOString(),
            stations: snowData,
            totalStations: stations.length
        });

        console.log('Snow forecast data:', snowData);

    } catch (error) {
        console.error("Error fetching snow forecast:", error);
        setSnowForecast(null);
        message.error("Snow forecast data could not be loaded.");
    }
};

	const GetReservoirForecast = async (countyName) => {
	try {
		// Much like the GetSnowForecast function, we will use the AWDB REST API to get reservoir data for the selected county.
		// We will look for stations that measure reservoir storage and fetch the most recent data for those stations.
		// We will also handle errors gracefully and return informative messages if something goes wrong.
		const stationsUrl = "https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/stations";
		const cleanCountyName = countyName ? countyName.replace(/ County$/i, '').trim() : null;
		const stationsParams = new URLSearchParams({
			stationTriplets: '*:OR:BOR', // Look for reservoir stations, managed by the Beurau of Reclamation
			activeOnly: 'true'
		});

		if (cleanCountyName) {
			stationsParams.append('countyNames', cleanCountyName);
		}

		const stationsResponse = await fetch(`${stationsUrl}?${stationsParams}`, {
			headers: {
				'Accept': 'application/json'
			}
		});

		if (!stationsResponse.ok) {
			throw new Error(`Failed to fetch stations (${stationsResponse.status})`);
		}

		const stations = await stationsResponse.json();

		if (!stations || stations.length === 0) {
			setReservoirForecast({
				source: 'USDA AWDB REST API',
				fetchedAt: new Date().toISOString(),
				stations: [],
				totalStations: 0,
				noStations: true
			});
			return;
		}

		// Get current reservoir storage data for the first few stations
		const reservoirData = [];
		const stationsToFetch = stations.slice(0, 10); // Limit to first 10 stations

		// Calculate date range (past calendar year).
		// The API will return the most recent data within that range,
		// so we can set endDate to 0 (today) and beginDate to -365 (past calendar year).
        const endDate = 0;
        const beginDate = -365;

		for (const station of stationsToFetch) {
			try {
				// Get reservoir storage data
				const dataUrl = `https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data`;
				const dataParams = new URLSearchParams({
					stationTriplets: station.stationTriplet,
					elements: 'RESC', // Reservoir storage volume
					duration: 'DAILY',
					returnFlags: 'false',
					beginDate: beginDate,
					endDate: endDate,
				});

				const dataResponse = await fetch(`${dataUrl}?${dataParams}`, {
					headers: {
						'Accept': 'application/json'
					}
				});

				if (dataResponse.ok) {
					const data = await dataResponse.json();
					if (data && data.length > 0) {
						const stationData = data[0];
						const values = stationData?.data?.[0]?.values
							?.filter(v => v.value !== null && v.value !== undefined)
							?.map(v => ({ date: v.date, value: v.value }));
						if (values && values.length > 0) {
							reservoirData.push({
								stationName: station.name,
								stationId: station.stationId,
								values: values,
								unit: 'acre-ft'
							});
						}
					}
				} else {
					console.warn(`Failed to fetch data for station ${station.stationTriplet}: ${dataResponse.status}`);
				}
			} catch (err) {
				console.error(`Error fetching data for station ${station.stationTriplet}:`, err);
			}
		}

			setReservoirForecast({
				source: 'USDA AWDB REST API',
				fetchedAt: new Date().toISOString(),
				stations: reservoirData,
				totalStations: reservoirData.length
			});

		} catch (error) {
			console.error("Error fetching reservoir forecast:", error);
			setReservoirForecast(null);
			message.error("Reservoir forecast data could not be loaded.");
		}
	};

	// Transforms huc8_current_conditions.json field names to match SummaryPanel's LATEST_API_KEY_MAP
	const adaptConditions = (raw) => {
		const out = {};
		for (const [huc, v] of Object.entries(raw)) {
			out[huc] = {
				usdm: v.usdm,
				pdsi: v.pdsi,
				spi: v.spi,
				eddi: v.eddi,
				cmi_raw: v.cmi,
				vci_raw: v.vci,
				vhi_raw: v.vhi,
				ssmi_raw: v.ssmi,
				streamflow_pctile: v.streamflow,
				swe_pct_normal: v.swe,
				spi_1yr: v.spi1yr,
			};
		}
		return out;
	};

	const getActiveLayer = (mapLayer) => {
		if (['usdm', 'pdsi', 'spi', 'eddi'].includes(mapLayer)) return 'met';
		if (['cmi_raw', 'vci_raw', 'vhi_raw', 'ssmi_raw'].includes(mapLayer)) return 'ag';
		return 'hydro';
	};

	useEffect(() => {
		PopulateCountyData();
		FetchCountiesMap();
		GetNWSForcast(44.0582, -121.3153);
		GetWeatherAlerts('ORZ001');

		// Load HUC-8 static data for SummaryPanel
		Promise.all([
			fetch('/drought/data/huc8_current_conditions.json').then(r => r.json()),
			fetch('/drought/data/huc8_current_forecasts.json').then(r => r.json()),
			fetch('/drought/data/huc8_names.json').then(r => r.json()),
		]).then(([conditions, forecasts, names]) => {
			setHucConditions(adaptConditions(conditions));
			setHucForecasts(forecasts);
			setHucNames(names);
		}).catch(err => {
			console.error('Error loading HUC-8 data:', err);
		});
	}, []);


	// load the county boundaries from the ArcGIS REST service and add them to the map.
	//  We will also set up an onClick event for each county that will fetch and display 
	// the drought information for that county in a popup. We will use the GetFeatureInfo 
	// request to the WMS service to get the drought information for the clicked location, 
	// and we will also fetch any active weather alerts for that county from the NWS API and include that information in the popup as well. We will handle errors gracefully and log them to the console, as well as display a message to the user if something goes wrong.
	const FetchCountiesMap = async () => {
		setLoading(true);
		try {
			// Query for Oregon counties (STATE_FIPS = 41)
			const params = new URLSearchParams({
				where: "STATE_FIPS = '41'",
				outFields: '*',
				f: 'geojson',
				returnGeometry: true
			});

			const response = await fetch(`${countiesURL}?${params}`);
			if (!response.ok) {
				throw new Error('Failed to fetch counties');
			}
			const data = await response.json();
			setCountiesData(data);

		} catch (error) {
			console.error('Error fetching counties:', error);
		} finally {
			setLoading(false);
		}
	};

	const countyStyle = (feature) => {
		const isSelected = selectedCounty && feature.properties.NAME === selectedCounty.properties.NAME;
		return {
			fillColor: isSelected ? 'rgba(100, 100, 255, 0.2)' : 'transparent',
			weight: isSelected ? 3 : 2,
			opacity: 1,
			color: isSelected ? '#0000ff' : '#666',
			dashArray: isSelected ? '0' : '3',
			fillOpacity: isSelected ? 0.2 : 0
		};
	};

	const onEachCounty = (feature, layer) => {
		layer.on({
				click: async (e) => {
				setSelectedCounty(feature);
				GetSnowForecast(feature.properties.NAME);
				GetReservoirForecast(feature.properties.NAME);
				GetStreamForecast(feature.properties.NAME);
				const zoneId = feature.properties.ZONE_ID; // Assuming ZONE_ID is available in properties

				// Fetch weather alerts for the selected county
				const alerts = await GetWeatherAlerts(zoneId);
				if (alerts && alerts.features.length > 0) {
					// Process and display alerts as needed
					console.log('Weather Alerts:', alerts);
				} else {
					console.log('No active weather alerts for this county.');
				}

				// Get drought data for the clicked location
				const latlng = e.latlng;
				
			},
			mouseover: (e) => {
				const layer = e.target;
				layer.setStyle({
					weight: 3,
					color: '#0000ff',
					fillOpacity: 0.1
				});
			},
			mouseout: (e) => {
				const layer = e.target;
				if (!selectedCounty || selectedCounty.properties.NAME !== feature.properties.NAME) {
					layer.setStyle(countyStyle(feature));
				}
			}
		});
	};

	const onChangeTab = (key) => {
		console.log('Selected tab:', key);
		setCurrentTab(key);
	}

	const styles = {
		root: {
			backgroundColor: '#fafafa',
			border: '1px solid #e0e0e0',
			borderRadius: 8,
		},
		header: {
			backgroundColor: '#f0f0f0',
			padding: '12px 16px',
			color: '#141414',
		},
	};

	// Function to handle search result
	const handleSearchResult = (event) => {
		const result = event.detail.results;
		if (result && result.length > 0) {
			const { latitude, longitude } = result[0].location;
			setSelectedCounty(null); // Clear selected county
			setForecast(null); // Clear forecast
			GetNWSForcast(latitude, longitude); // Fetch forecast for the searched location
			// Optionally, you can also pan the map to the searched location
			//const map = useMapEvents();
			//map.setView([latitude, longitude], 10); // Adjust zoom level as needed
		}
	};

	useEffect(() => {
		// Initialize ArcGIS components
		const initArcGISComponents = async () => {
			await window.customElements.whenDefined('arcgis-search');
			const arcgisSearch = document.querySelector('arcgis-search');
			arcgisSearch.addEventListener('arcgis-search-result', handleSearchResult);
		};

		initArcGISComponents();
	}, []);

	const renderSnowChart = (height = 250) => {
		if (!snowForecast?.stations?.length) {
			return (
				<p style={{ color: 'white', marginTop: '4px' }}>
					{!selectedCounty
						? 'Select a county to view snow pack data.'
						: snowForecast?.noStations
							? `No SNOTEL stations are located in ${selectedCounty.properties.NAME.replace(/ County$/i, '')} County.`
							: 'Loading snow data...'}
				</p>
			);
		}
		const allDatesSet = new Set();
		snowForecast.stations.forEach(s => s.values.forEach(v => allDatesSet.add(v.date)));
		const sortedDates = Array.from(allDatesSet).sort();
		const chartData = sortedDates.map(date => {
			const point = { date };
			snowForecast.stations.forEach(s => {
				const match = s.values.find(v => v.date === date);
				point[s.stationName] = match ? match.value : null;
			});
			return point;
		});
		const monthTicks = sortedDates.filter(d => d.slice(8) === '01');
		const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		const lineColors = ['#8884d8','#82ca9d','#ffc658','#ff7300','#0088fe','#00C49F','#FFBB28','#FF8042','#a4de6c','#d0ed57'];
		return (
			<>
				<p style={{ color: 'white', marginTop: '4px' }}>
					{snowForecast.stations.length} station{snowForecast.stations.length !== 1 ? 's' : ''} in {selectedCounty ? `${selectedCounty.properties.NAME.replace(/ County$/i, '')} County` : 'Oregon'} — daily SWE (past year)
				</p>
				<ResponsiveContainer width="100%" height={height}>
					<LineChart data={chartData} margin={{ top: 5, right: 5, left: 15, bottom: 5 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="#444" />
						<XAxis
							dataKey="date"
							ticks={monthTicks}
							tickFormatter={(d) => monthNames[parseInt(d.slice(5, 7)) - 1]}
							tick={{ fill: 'white', fontSize: 10 }}
						/>
						<YAxis
							tick={{ fill: 'white', fontSize: 10 }}
							label={{ value: 'SWE (in)', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 10 }}
						/>
						<Tooltip
							formatter={(value, name) => [value != null ? `${value} in` : 'N/A', name]}
							labelFormatter={(label) => label}
							contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #555' }}
							itemStyle={{ color: 'white' }}
							labelStyle={{ color: 'white' }}
						/>
						<Legend wrapperStyle={{ color: 'white', fontSize: '11px' }} />
						{snowForecast.stations.map((station, idx) => (
							<Line
								key={station.stationId}
								type="monotone"
								dataKey={station.stationName}
								stroke={lineColors[idx % lineColors.length]}
								dot={false}
								connectNulls={false}
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</>
		);
	};

	const renderReservoirChart = (height = 250) => {
		if (!reservoirForecast?.stations?.length) {
			return (
				<p style={{ color: 'white', marginTop: '4px' }}>
					{!selectedCounty
						? 'Select a county to view reservoir data.'
						: reservoirForecast?.noStations
							? `No reservoir stations are located in ${selectedCounty.properties.NAME.replace(/ County$/i, '')} County.`
							: 'Loading reservoir data...'}
				</p>
			);
		}
		const allDatesSet = new Set();
		reservoirForecast.stations.forEach(s => s.values.forEach(v => allDatesSet.add(v.date)));
		const sortedDates = Array.from(allDatesSet).sort();
		const chartData = sortedDates.map(date => {
			const point = { date };
			reservoirForecast.stations.forEach(s => {
				const match = s.values.find(v => v.date === date);
				point[s.stationName] = match ? match.value : null;
			});
			return point;
		});
		const monthTicks = sortedDates.filter(d => d.slice(8) === '01');
		const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		const lineColors = ['#8884d8','#82ca9d','#ffc658','#ff7300','#0088fe','#00C49F','#FFBB28','#FF8042','#a4de6c','#d0ed57'];
		return (
			<>
				<p style={{ color: 'white', marginTop: '4px' }}>
					{reservoirForecast.stations.length} reservoir{reservoirForecast.stations.length !== 1 ? 's' : ''} in {selectedCounty ? `${selectedCounty.properties.NAME.replace(/ County$/i, '')} County` : 'Oregon'} — daily storage (past year)
				</p>
				<ResponsiveContainer width="100%" height={height}>
					<LineChart data={chartData} margin={{ top: 5, right: 5, left: 20, bottom: 5 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="#444" />
						<XAxis
							dataKey="date"
							ticks={monthTicks}
							tickFormatter={(d) => monthNames[parseInt(d.slice(5, 7)) - 1]}
							tick={{ fill: 'white', fontSize: 10 }}
						/>
						<YAxis
							tick={{ fill: 'white', fontSize: 10 }}
							label={{ value: 'Storage (acre-ft)', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 10 }}
						/>
						<Tooltip
							formatter={(value, name) => [value != null ? `${value.toLocaleString()} acre-ft` : 'N/A', name]}
							labelFormatter={(label) => label}
							contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #555' }}
							itemStyle={{ color: 'white' }}
							labelStyle={{ color: 'white' }}
						/>
						<Legend wrapperStyle={{ color: 'white', fontSize: '11px' }} />
						{reservoirForecast.stations.map((station, idx) => (
							<Line
								key={station.stationId}
								type="monotone"
								dataKey={station.stationName}
								stroke={lineColors[idx % lineColors.length]}
								dot={false}
								connectNulls={false}
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</>
		);
	};

	const renderStreamForecastChart = (height = 250) => {
		if (!streamForecast?.stations?.length) {
			return (
				<p style={{ color: 'white', marginTop: '4px' }}>
					{!selectedCounty
						? 'Select a county to view streamflow forecast data.'
						: streamForecast?.noStations
							? `No streamflow forecast points are located in ${selectedCounty.properties.NAME.replace(/ County$/i, '')} County.`
							: 'Loading streamflow forecast data...'}
				</p>
			);
		}

		// Color scale from red (dry/low exceedance) → yellow (median) → blue (wet/high exceedance)
		const probabilityColorMap = {
			'95%': '#b71c1c',
			'90%': '#d32f2f',
			'80%': '#f4511e',
			'70%': '#fb8c00',
			'60%': '#fdd835',
			'50%': '#c6ca53',
			'40%': '#8bc34a',
			'30%': '#26a69a',
			'20%': '#1e88e5',
			'10%': '#1565c0',
			'5%': '#0d47a1'
		};
		const getProbColor = (prob) => probabilityColorMap[prob] || '#8884d8';

		return (
			<>
				<p style={{ color: 'white', marginTop: '4px' }}>
					{streamForecast.stations.length} forecast point{streamForecast.stations.length !== 1 ? 's' : ''} in {selectedCounty ? `${selectedCounty.properties.NAME.replace(/ County$/i, '')} County` : 'Oregon'}
				</p>
				{streamForecast.stations.map(station => {
					// Collect all unique probability keys across all periods, sorted ascending
					const allProbKeys = [...new Set(
						station.periods.flatMap(p => p.forecastValues.map(v => `${v.exceedanceProbability}%`))
					)].sort((a, b) => parseInt(b) - parseInt(a));

					// Build chart data: one row per probability threshold, one column per period
					const chartData = allProbKeys.map(probKey => {
						const point = { probability: probKey };
						station.periods.forEach(p => {
							const match = p.forecastValues.find(v => `${v.exceedanceProbability}%` === probKey);
							point[p.periodName] = match ? match.value : null;
						});
						return point;
					});

					const unit = station.periods[0]?.unit || 'KAF';
					const periodLabels = station.periods.map(p => p.periodName).join(', ');

					return (
						<div key={station.stationId} style={{ marginBottom: '16px' }}>
							<p style={{ color: '#ccc', fontSize: '12px', margin: '4px 0 2px 0' }}>
								{station.stationName} — {periodLabels}
							</p>
							<ResponsiveContainer width="100%" height={height}>
								<BarChart
									layout="vertical"
									data={chartData}
									margin={{ top: 5, right: 20, left: 35, bottom: 20 }}
								>
									<CartesianGrid strokeDasharray="3 3" stroke="#444" />
									<XAxis
										type="number"
										tick={{ fill: 'white', fontSize: 10 }}
										label={{ value: unit, position: 'insideBottom', fill: 'white', fontSize: 10, offset: -10 }}
									/>
									<YAxis
										type="category"
										dataKey="probability"
										tick={{ fill: 'white', fontSize: 10 }}
										label={{ value: 'Exceedance', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 10 }}
									/>
									<Tooltip
										formatter={(value, name) => [value != null ? `${value} ${unit}` : 'N/A', name]}
										contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #555' }}
										itemStyle={{ color: 'white' }}
										labelStyle={{ color: 'white' }}
									/>
									<Legend
										content={() => (
											<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px 0', justifyContent: 'center' }}>
												{allProbKeys.map(prob => (
													<span key={prob} style={{ color: 'white', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
														<span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: getProbColor(prob), borderRadius: '2px' }} />
														{prob}
													</span>
												))}
											</div>
										)}
									/>
									{station.periods.map((p) => (
										<Bar key={p.periodName} dataKey={p.periodName}>
											{chartData.map((entry) => (
												<Cell key={`cell-${entry.probability}`} fill={getProbColor(entry.probability)} />
											))}
										</Bar>
									))}
								</BarChart>
							</ResponsiveContainer>
						</div>
					);
				})}
			</>
		);
	};

	return (
		<>
			<div style={{ margin: 0, padding: '1em' }}>
				<h2>Drought in Oregon</h2>
				<p>
					Drought may significantly impact Oregon's diverse agricultural sector, affecting everything from irrigation water
					availability to crop yields and livestock management. The tools available below provide information and guidance
					on drought status and possible management strategies to cope with drought.
				</p>
				{showMoreInfo && (
					<>
						<p>
							During drought periods, farmers may face reduced water allocations
							from reservoirs and rivers, forcing difficult decisions about which crops to plant and irrigate.
							The state's major agricultural regions experience varying drought impacts depending
							on their water sources and irrigation infrastructure. Drought conditions also stress rangelands and pastures,
							reducing forage availability for livestock and increasing feed costs. Additionally, prolonged drought can degrade
							soil quality, increase wildfire risk near agricultural lands, and disrupt the timing of planting and harvesting
							seasons.
						</p>
						<p>
							To mitigate drought impacts, Oregon farmers may adopt water-saving irrigation techniques, diversify crops,
							and implement soil moisture monitoring. State and federal agencies also provide drought assistance programs to support
							farmers during dry periods. However, the increasing frequency and severity of droughts due to climate change pose ongoing challenges for Oregon's agricultural sustainability.
						</p>
					</>
				)}
				<Button type="link" onClick={() => setShowMoreInfo(!showMoreInfo)} style={{ color: 'lightblue', padding: 0 }}>
					{showMoreInfo ? 'Show Less' : 'Show More...'}
				</Button>
			</div>
			<Divider />

			<Tabs defaultActiveKey='map' items={[
				{
					key: 'map', label: 'Drought Status Map', children: (<span>
						The map shown below provides an overview of current drought conditions in Oregon. Clicking/Tapping on a county will display detailed drought information for that area.
					</span>),
				},
				{
					key: 'cwu', label: 'Crop Water Use', children: (<span>
						Determine crop water use for different crops in Oregon.</span>),
				},
				{
					key: 'guides', label: 'Guides', children: (<span>
						Access a series fo guides for managing drought.
					</span>),
				}]}
				onChange={onChangeTab}
			/>
			<Divider />

			{currentTab === 'map' && ( <>
			<span>Current Statewide Drought Status: Abnormally Dry</span>
			<StatusBar level={2} />

				<Row gutter={16}>
					<Col xs={24} sm={5}>
						<Card title="U.S. Drought Monitor Legend" size="small">
							{droughtCategories.map(category => (
								<div key={category.level} style={{ marginBottom: '12px' }}>
									<div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
										<div style={{
											width: '30px',
											height: '20px',
											backgroundColor: category.color,
											border: '1px solid #ccc',
											marginRight: '8px'
										}} />
										<strong>{category.level} - {category.label}</strong>
									</div>
									<div style={{ fontSize: '12px', color: '#eee', paddingLeft: '38px' }}>
										{category.description}
									</div>
								</div>
							))}
							<div style={{ marginTop: '16px', fontSize: '11px', color: '#888', borderTop: '1px solid #eee', paddingTop: '8px' }}>
								Data Source: <a href="https://droughtmonitor.unl.edu/" target="_blank" rel="noopener noreferrer">U.S. Drought Monitor</a>
							</div>
						</Card>
					</Col>
					<Col xs={24} sm={12}>
						<div style={{ height: '100%', width: '100%' }}>
							<MapContainer
								center={[44.0, -120.5]}
								zoom={6.5}
								style={{ height: '100%', width: '100%' }}
								zoomControl={false}
								minZoom={6.5}
								maxZoom={6.5}
							>
								<TileLayer
									url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
									attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
								/>
								<WMSTileLayer
									url={usdmWMSURL}
									layers="usdm_current"
									format="image/png"
									transparent={true}
									version="1.3.0"
									opacity={0.7}
								/>
								<arcgis-search
									placeholder="Search for a location"
									style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}
								></arcgis-search>
								{countiesData && (
									<GeoJSON
										data={countiesData}
										style={countyStyle}
										onEachFeature={onEachCounty}
									/>
								)}
							</MapContainer>
						</div>
					</Col>
					<Col xs={24} sm={7}>
						{selectedCounty ? (
							<div style={{ fontSize: 'medium', color: 'yellow' }}>
								Results for <strong>{selectedCounty.properties.NAME}</strong>
							</div>
						) : (
							<div style={{ fontSize: 'medium', color: 'yellow' }}>
								Click on a county to see detailed drought information and forecasts.
							</div>
						)}

						<Collapse accordion={true}
							styles={styles}
							items={[
								{
								key: '0', label: 'Current Weather', children: (
									<WeatherForecast forecast={forecast} />
								),
							}, {
								key: '1', label: 'Short Term Drought Forecast', children: (
									<DroughtSummary countyDroughtData={countyDroughtData} countyName={selectedCounty ? selectedCounty.properties.NAME : null} />
							)},  {
								key: '2', label: 'Short Term Stream Flow Forecast', children: (
									<div>
										<strong style={{ color: 'white' }}>Streamflow Volume Outlook (SRVO)</strong>
										<div
											style={{ cursor: 'pointer' }}
											title="Click to expand"
											onClick={() => setModalChart('stream')}
										>
											{renderStreamForecastChart(250)}
										</div>
									</div>
								),

							},
							{
								key: '3', label: 'Historic Water Levels (Snow Pack/Reservoirs)', children: (
									<div>
										<div
										style={{ cursor: 'pointer' }}
										title="Click to expand"
										onClick={() => setModalChart('snow')}
									>
										<strong style={{ color: 'white' }}>Snow Pack (SNOTEL)</strong>
										{renderSnowChart(250)}
									</div>
										<Divider style={{ borderColor: '#555', margin: '12px 0' }} />

									<div
										style={{ cursor: 'pointer' }}
										title="Click to expand"
										onClick={() => setModalChart('reservoir')}
									>
										<strong style={{ color: 'white' }}>Reservoir Storage</strong>
										{renderReservoirChart(250)}
									</div>
									</div>
								),
							}, {
								key: '4', label: 'At-Risk Crops', children: (
									<div>
										<ul>
											<li style={{ color: 'white' }}>Wheat: Drought stress can reduce tillering and grain filling, leading to lower yields.</li>
										</ul>
									</div>
								),

							}, {
								key: '5', label: 'Economic Damage', children: (

									<div>
										<ul>
											<li style={{ color: 'white' }}>Wheat: Drought stress can reduce tillering and grain filling, leading to lower yields.</li>
										</ul>
									</div>
								),

							},

							]} />

						<Card title="Drought Impacts on Oregon Agriculture" size="small">
							<ul>
								<li style={{ color: 'white' }}>Reduced water availability for irrigation, leading to lower crop yields.</li>
								<li style={{ color: 'white' }}>Increased costs for farmers due to the need for supplemental feed for livestock.</li>
								<li style={{ color: 'white' }}>Degradation of soil quality and increased erosion risk.</li>
							</ul>

						</Card>
					</Col>
				</Row>

				<Divider style={{ borderColor: '#555', margin: '24px 0 12px 0' }}>
					Watershed Basin Conditions (HUC-8)
				</Divider>
				<Row style={{ marginBottom: '12px' }}>
					<Col>
						<Select
							style={{ width: 320 }}
							placeholder="Select a watershed basin..."
							value={currentHuc}
							onChange={setCurrentHuc}
							showSearch
							allowClear
							filterOption={(input, option) =>
								option.label.toLowerCase().includes(input.toLowerCase())
							}
							options={Object.entries(hucNames)
								.sort(([, a], [, b]) => a.localeCompare(b))
								.map(([huc, name]) => ({ value: huc, label: `${name} (${huc})` }))}
						/>
					</Col>
				</Row>
				<SummaryPanel
					currentHuc={currentHuc}
					hucName={currentHuc ? hucNames[currentHuc] : null}
					currentConditions={hucConditions}
					forecastData={hucForecasts}
					unifiedData={null}
					activeLayer={getActiveLayer(activeMapLayer)}
					activeMapLayer={activeMapLayer}
					setActiveMapLayer={setActiveMapLayer}
				/>
				</>
			)}

			{currentTab === 'cwu' && (
				<><span>Crop water use information coming soon...</span></>
			)}


			{currentTab === 'guides' && (
				<><span>Guides for managing drought coming soon...</span></>
			)}



			<div className="row">
				<h5>More Information</h5>
				(1) USDA ERS - Irrigation & Water Use. https: //www.ers.usda.gov/topics/farm-practices-management/irrigation-water-use/.
			</div>
			<Modal
				open={modalChart !== null}
				onCancel={() => setModalChart(null)}
				footer={null}
				width="90vw"
				styles={{ body: { backgroundColor: '#1a1a1a', padding: '16px' } }}
				title={
					<span style={{ color: 'white' }}>
						{modalChart === 'snow' ? 'Snow Pack (SNOTEL) — Past Year SWE'
							: modalChart === 'reservoir' ? 'Reservoir Storage — Past Year'
							: 'Streamflow Volume Outlook (SRVO)'}
					</span>
				}
			>
				<div style={{ backgroundColor: '#1a1a1a' }}>
					{modalChart === 'snow' && renderSnowChart(500)}
					{modalChart === 'reservoir' && renderReservoirChart(500)}
					{modalChart === 'stream' && renderStreamForecastChart(500)}
				</div>
			</Modal>
		</>
	)
};

Drought.propTypes = {
	//article: PropTypes.object,
}

export default Drought;