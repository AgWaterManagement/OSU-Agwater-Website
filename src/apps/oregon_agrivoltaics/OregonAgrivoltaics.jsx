import { useEffect, useRef, useMemo, useState } from "react";
import { Spin, Row, Col, Typography, Statistic } from "antd";
import {
    ResponsiveContainer, LineChart, AreaChart, ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    DefaultLegendContent,
    //DefaultLegendContentProps,
    DefaultTooltipContent,
    //TooltipContentProps,
} from 'recharts';


import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-legend";
import { watch as reactiveWatch } from "@arcgis/core/core/reactiveUtils.js";

//import ImageryTileLayer from "@arcgis/core/layers/FeatureLayer.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import { height } from "@mui/system";

const AgFieldLayer = ({ loadFeatureData, setFieldDetailData, setFieldFeatureData }) => {

    const id = "or-ag-boundaries";
    const name = "Oregon Agricultural Boundaries";
    const url = "https://services1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/Oregon_Hyd_Area_Ag_Boundaries_20241016/FeatureServer";

    //"https://services1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/Oregon_Hyd_Area_Ag_Boundaries_20241016/FeatureServer?f=json&where=1%3D1&returnGeometry=false&outFields=*&resultRecordCount=1"
    //const type = "Feature";
    const opacity = 0.8;

    const viewRef = useRef(null);
    const zoomRef = useRef({ level: null, center: null });
    const mapRef = useRef(null);
    const layerRef = useRef(null);


    // Memoize the renderer so it won't be recreated on every render
    const renderer = useMemo(() => {
        const colorVisVar = {
            type: "color",
            field: "Acres",
            stops: [
                { value: 1, color: "#ecf41e" },
                { value: 6000, color: "#ec0e0e" },
            ],
            legendOptions: { title: "Acres" },
        };

        return {
            type: "simple",
            symbol: {
                type: "simple-fill",
                style: "solid",
                color: [6, 133, 4, 200],
                outline: { color: [48, 48, 48, 0.8], width: 0.5 },
            },
            visualVariables: [colorVisVar],
        };
    }, []);

    const formatFeatureValue = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => (typeof item === "number" ? item.toFixed(2) : String(item))).join(", ");
        }

        if (typeof value === "number") {
            return value.toFixed(2);
        }

        return value == null ? "No data" : String(value);
    };

    // update layer when URL or renderer changes
    useEffect(() => {
        const mapElement = mapRef.current;
        if (!mapElement) return undefined;

        let zoomHandle = null;

        const handleViewReady = async () => {
            const view = mapElement.view;
            if (!view || !view.map) return;

            if (viewRef) {
                viewRef.current = view;
            }
            const updateZoomRef = () => {
                if (zoomRef) {
                    zoomRef.current = {
                        level: view.zoom,
                        center: [view.center.longitude, view.center.latitude],
                    };
                }
            }
            updateZoomRef();
            zoomHandle = reactiveWatch(() => [view.zoom, view.center?.latitude, view.center?.longitude], updateZoomRef);

            const existingLayer = view.map.findLayerById(id);
            const featureLayer =
                existingLayer ||
                new FeatureLayer({
                    id,
                    url,
                    title: name,
                    opacity,
                    renderer,
                    outFields: ["*"],
                });

            if (!existingLayer) {
                view.map.add(featureLayer);
            }

            layerRef.current = featureLayer;

            /*
            const handleClick = async (event) => {
                const activeLayer = layerRef.current;
                if (!activeLayer) return;

                try {

                    // user changes the page number on the calcite-pagination component
                    async function queryPage(page) {

                        // availableFields will become available once the
                        // layerView finishes updating
                        //if ( layerView.current) {
                        //    await reactiveUtils.whenOnce(() => !layerView.current.updating);
                        //    try {
                        //      const results = await layerView.current.queryFeatures({
                        //        outFields: layerView.current.availableFields,
                        //        where: "DEW_POINT > 10"
                        //      });
                        //      console.log(results.features.length, " features returned");
                        //    } catch(error) {
                        //      console.log("query failed: ", error);
                        //    }
                        //}

                        // Create the query object honoring layer settings
                        // sets returnGeometry=true and outFields to "*"
                        const query = featureLayer.current.createQuery();
                        // Set query parameters for pagination and sorting
                        query.start = page;
                        query.num = 20;
                        query.orderByFields = ["MEDHINC_CY DESC"];

                        const queryResult = await featureLayer.queryFeatures(query);
                        features = queryResult.features;
                        convertFeatureSetToRows(features, query);
                    }
                    queryPage(0);

                    //const target = event.target;
                    //const resultId = parseInt(target.getAttribute("value"), 10);
                    //const openETID = isNaN(resultId) ? null : target.getAttribute("OPENET_ID") || null;

                    //const identifyResult = await activeLayer.identify(event.mapPoint, { timeExtent: view.timeExtent });
                    //const featureValue = formatFeatureValue(identifyResult?.processedValue ?? identifyResult?.value);

                    view.closePopup();
                    view.openPopup({
                        location: event.mapPoint,
                        title: name || "Feature value",
                        content: `
                            <div style="min-width: 220px;">
                                <div><b>Lat:</b> ${event.mapPoint.latitude.toFixed(5)}<b>, Lon:</b> ${event.mapPoint.longitude.toFixed(5)}</div>
                                <div><b>Value:</b> ${featureValue}</div>
                            </div>
                        `,
                    });
                } catch (error) {
                    console.warn("Unable to identify feature value at click location:", error);
                }

                updateFieldData(featureValue);
            };  */

            // Set up click event listener
            view.on("click", function (event) {
                view.hitTest(event).then(function (response) {
                    const feature = response.results[0]?.graphic;
                    if (feature) {
                        loadFeatureData(feature);

                        // Display attributes or perform further actions
                    }
                });
            });

            try {
                await view.when();
                await featureLayer.when();
                //view.addEventListener("arcgisViewClick", handleClick);

                if (featureLayer.fullExtent) {
                    await view.goTo(featureLayer.fullExtent.expand(0.7));
                    featureLayer.refresh?.();
                }
            } catch (error) {
                console.warn("Unable to zoom to feature extent:", error);
            }
        };

        mapElement.addEventListener("arcgisViewReadyChange", handleViewReady);

        return () => {
            mapElement.removeEventListener("arcgisViewReadyChange", handleViewReady);
            zoomHandle?.remove();

            if (viewRef?.current === mapElement.view) {
                viewRef.current = null;
            }
        };
    }, [renderer]);

    /*
        const updateFieldData = async () => {
            const activeLayer = layerRef.current;
            if (!activeLayer) return;
            try {
                const query = activeLayer.createQuery();
                query.where = "1=1";
                query.returnGeometry = false;
                query.outFields = ["*"];
                query.num = 1;
                const result = await activeLayer.queryFeatures(query);
                const attributes = result.features[0]?.attributes;
                setFieldFeatureData(attributes);
            } catch (error) {
                console.warn("Unable to query feature data:", error);
            }
        };
    */

    return (
        <div style={{ width: "100%", height: 640, padding: 4 }}>
            <arcgis-map
                ref={mapRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                basemap="topo-vector"
                center="-121.5,38.8"
                zoom="10"
            >
                <arcgis-zoom position="top-left" />
                <arcgis-legend position="bottom-left" />
            </arcgis-map>
        </div>
    );
};



// ── Main component ────────────────────────────────────────────────────────────
const OregonAgrivoltaics = () => {

    //const mapRef = useRef(null);

    //const [portalItemId, setPortalItemId] = useState("");
    //const [basemap, setBasemap] = useState("dark-gray-vector");
    //const [activeLayerId, setActiveLayerId] = useState("");

    //const [mapStatus, setMapStatus] = useState("idle"); // idle | loading | ready | error
    //const [statusMsg, setStatusMsg] = useState("idle");
    //const [error, setError] = useState(null);
    //const [coords, setCoords] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const [fieldDetailData, setFieldDetailData] = useState(null);
    const [fieldFeatureData, setFieldFeatureData] = useState(null);


    const _setFieldFeatureData = (attributes) => {
        //setFieldID(attributes.OPENET_ID);
        //setFieldArea(attributes.Acres);
        setFieldFeatureData(attributes);

    };

    const _setFieldDetailData = (data) => {
        setFieldDetailData(data);
    };

    const loadFeatureData = (feature) => {
        // Access feature attributes
        const attributes = feature.attributes;
        setIsLoadingData(true);
        // call the agwater API to get the data for this feature and display it in the popup
        try {
            fetch(`https://agwater.org:5556/agrivoltaics/field?openETID=${attributes.OPENET_ID}`)
                .then(res => res.json())
                .then(data => {
                    setFieldFeatureData(attributes);
                    setFieldDetailData(data);
                })
                .catch(error => {
                    console.warn("Unable to fetch field data:", error);
                    setIsLoadingData(false);
                });
        } catch (error) {
            console.warn("Unable to fetch field data:", error);
            setIsLoadingData(false);
        };

        setIsLoadingData(false);
        console.log("Feature attributes:", attributes);
    }

    const getChartData = (chartType) => {
        if (!fieldDetailData) return [];

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


        //if (Array.isArray(fieldDetailData[chartType])) {
        //    console.warn(`Data for chart type "${chartType}" is missing or not an array.`);
        //    return [];
        //}

        const chartData = fieldDetailData[chartType]?.map((data, index) => {
            return {
                month: months[index],
                value: data.mean,
                ci: data.ci ? [data.ci.lower, data.ci.upper] : null,
            };
        });

        return chartData || [];  // 
    };

    //const chartData = getChartData("monthly_solar_energy");
    //console.log("chartData: ", chartData);


    const renderTooltipWithoutRange = ({ payload, content, ...rest }) => {
        const newPayload = payload.filter(x => x.dataKey !== 'a');
        return <DefaultTooltipContent payload={newPayload} {...rest} />;
    };

    const renderLegendWithoutRange = ({ payload, ref, ...rest }) => {
        const newPayload = payload?.filter(x => x.dataKey !== 'a');
        return <DefaultLegendContent payload={newPayload} {...rest} />;
    };

    const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Total daily global shortwave solar irradiance received on a horizontal surface [averaged over all days in the month] 
    const solarChartData = getChartData("monthly_solar_energy");   // W/m2, mean solar energy received per month, with confidence intervals (ci) for each month
    // total incident solar energy over the year (kWh/m²) - this is the sum of the mean values for each month, 
    // which represent the average solar energy received per month.
    /*
      'R_sun W/m^2': dfR_sun,
      'tmean C': dftmean,
      'windspeed m/s': dfwindspeed,
      'vp_data hPA': dfvp_data,
      'elevation m': dfelevation,
      'electricity W/m^2': dfelectricity,
      'eT0 mm/day': dfeT0,
      'eT0_withPanels mm/day': dfeT0_withPanels
    */

    function getAnnualEnergy(chartData, fieldFeatureData) {
        let annualTotal = 0;   // this will be the sum of the monthly solar energy values after conversion to kWh/m²
        for (let month = 0; month < chartData.length; month++) {
            const meanEnergy = chartData[month].value;
            const secondsInMonth = daysPerMonth[month] * 24 * 3600;
            const energyKWh = (meanEnergy * secondsInMonth) / 3600000; // convert W/m² to kWh/m²
            annualTotal += energyKWh;  // KWh/m2
        }
        // multiple by the area of the field to get total energy production potential for the field, then convert to MWh:
        const fieldArea = fieldFeatureData?.Acres ? fieldFeatureData.Acres * 4046.86 : 0; // convert acres to m²
        annualTotal *= fieldArea;  // assuming fieldArea is in m²
        annualTotal /= 1000;  // convert kWh to MWh
        return annualTotal;
    }

    function getAnnualWater(chartData, fieldFeatureData) {
        let annualTotal = 0;   // this will be the sum of the monthly solar energy values after conversion to kWh/m²
        const fieldArea = fieldFeatureData?.Acres ? fieldFeatureData.Acres : 0; // convert acres to m²
        for (let month = 0; month < chartData.length; month++) {
            const monthlyWater = chartData[month].value * 0.00328084 ; // mm/day, converted to ft/day
            const waterFt_per_month = monthlyWater * daysPerMonth[month]; // convert to ft/month
            annualTotal += waterFt_per_month;  // ft/year
        }
        // multiple by the area of the field to get water savings potential for the field, then convert to acre-ft:
        const totalVol = annualTotal * fieldArea;  // assuming fieldArea is in acres, this will give us acre-ft/year
        return [annualTotal, totalVol];  // assuming fieldArea is in acres, this will give us acre-ft/year
    }

    // W/m2 is a unit of power per area, so to get energy per area over a month, we would need to multiply
    //  the mean solar energy received per month (W/m²) by the number of seconds in that month and convert to kWh:
    const annualSolarEnergy = getAnnualEnergy(solarChartData, fieldFeatureData);   // this will be the sum of the monthly solar energy values after conversion to kWh/m²

    const energyProductionData = getChartData("monthly_energy_production");
    const annualEnergyProduction = getAnnualEnergy(energyProductionData, fieldFeatureData);   // this will be the sum of the monthly solar energy values after conversion to kWh/m²

    const combinedEnergyData = solarChartData.map((item, index) => {
        return {
            month: item.month,
            solar_energy: item.value,
            solar_energy_ci: item.ci,
            energy_production: fieldDetailData?.monthly_energy_production?.[index]?.mean,
            energy_production_ci: fieldDetailData?.monthly_energy_production?.[index]?.ci,
        };
    });
    const energyValue = annualEnergyProduction * 100;  // assuming $100/MWh, this is a very rough estimate of the annual revenue potential from solar energy production on the field

    const et0Data = getChartData("monthly_et0");
    const et0WithPanelsData = getChartData("monthly_et0_with_panels");

    const combinedET0Data = et0Data.map((item, index) => {
        return {
            month: item.month,
            et0: item.value,
            et0_ci: item.ci,
            et0_with_panels: et0WithPanelsData[index]?.value,
            et0_with_panels_ci: et0WithPanelsData[index]?.ci,
        };
    });

    const waterDeltaData = getChartData("monthly_water_delta");
    const [annualWaterSavingsRate, annualWaterSavingsVolume] = getAnnualWater(waterDeltaData, fieldFeatureData);   // this will be the sum of the monthly water delta values after conversion to mm
    const waterValue = annualWaterSavingsVolume * 0.1;  // assuming $0.10/acre-ft, this is a very rough estimate of the annual value of water savings


    //const waterDeltaData = getChartData("monthly_water_delta");

    const contentStyle = {
        padding: 50,
        background: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 4,
    };
    const content = <div style={contentStyle} />;

    return (
        <div style={{ width: "100%" }}>
            <Row>
                <Col span={24} style={{ textAlign: "center", marginBottom: 16 }}>
                    <Typography.Title level={1} style={{ color: "white" }}>
                        Oregon Agrivoltaics Suitability Mapping
                    </Typography.Title>
                    <Typography.Paragraph style={{ color: "white", fontSize: 18, marginLeft: 4 }}>
                        This map shows the suitability of land in US Agricultural Areas for agrivoltaic siting,
                        which combines agriculture with solar energy production.
                        These maps can help identify areas where agrivoltaics may be most beneficial.  The maps
                        show two key factors: the energy production potential from solar panels (left)
                        and the water savings potential (right), represented on an 800m resolution grid.
                    </Typography.Paragraph>
                </Col>
            </Row>
            <Row>
                <Col span={12} style={{ textAlign: "center", marginBottom: 16 }}>
                    <Typography.Title level={4} style={{ color: "white" }}>
                        Solar Energy Potential
                    </Typography.Title>
                    <AgFieldLayer loadFeatureData={loadFeatureData} setFieldDetailData={_setFieldDetailData} setFieldFeatureData={_setFieldFeatureData} />
                    <div style={{ height: '25em', width: '100%', padding: '1em' }}></div>
                </Col>
                <Col span={12} style={{ textAlign: "center", marginBottom: 16 }}>
                    {isLoadingData ? (
                        <Spin description="Loading" size="large">
                            {content}
                        </Spin>
                    ) : (
                        <>
                            <Typography.Title level={4} style={{ color: "white" }}>
                                Field Characteristics
                            </Typography.Title>

                            <div style={{ width: "100%", height: 640, padding: 4 }}>
                                <div>OpenET ID: {fieldFeatureData?.OPENET_ID}, Area: {fieldFeatureData?.Acres?.toFixed(1)} acres</div>

                                {fieldDetailData && solarChartData && solarChartData.length > 0 ? (
                                    <div style={{ width: '100%', borderRadius: 10 }}>
                                        <Typography.Title level={5} style={{ color: "white", backgroundColor: "brown", margin:0 }}>
                                            Monthly Solar Energy (kWh/m²)
                                        </Typography.Title>

                                        <Row style={{ width: '100%', padding: 0 }}>
                                            <Col span={10} style={{ textAlign: "center", marginBottom: 16, padding: '1em'  }}>
                                                  <Statistic title="Total Annual Incident Solar Radiation (MWh)" value={annualSolarEnergy.toFixed(0) + " MWh"} />
                                                    <br/>
                                                  <Statistic title="Total Annual Energy Produced (MWh)" value={annualEnergyProduction.toFixed(0) + " MWh"} />
                                                <br/>
                                                  <Statistic title="Total Value of Annual Energy Produced ($)" 
                                                     value={'$' + energyValue.toFixed(0) + " USD"}
                                                    />
                                             <span style={{ fontSize: '0.9em', fontStyle: 'italic' }}>
                                                (assumes $100/MWh)
                                                </span>

                                            </Col>
                                            <Col span={14} style={{ textAlign: "center", }}>
                                                <div style={{height: '25em', width: '100%', }}>
                                                <ResponsiveContainer style={{  padding:'1em' }}>
                                                    <ComposedChart
                                                        style={{}}
                                                        responsive
                                                        data={combinedEnergyData}
                                                        margin={{ top: 20, right: 0, left: 0, bottom: 0, }}
                                                    >
                                                        <XAxis dataKey="month" stroke='white' />
                                                        <YAxis label={"W/m2"} />
                                                        <Legend />
                                                        <Line type="natural" dataKey="solar_energy" stroke="red" connectNulls />
                                                        <Area type="monotone" dataKey="solar_energy_ci" stroke="pink" fill="rgba(255, 0, 0, 0.7)" fillOpacity={1} />

                                                        <Line type="natural" dataKey="energy_production" stroke="green" connectNulls />
                                                        <Area type="monotone" dataKey="energy_production_ci" stroke="lightgreen" fill="rgba(0, 255, 0, 0.7)" fillOpacity={1} />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: "center", marginTop: 50, color: "white" }}>
                                        Click on a field in the map to see details here.
                                    </div>
                                )}

                                {fieldDetailData && combinedET0Data && combinedET0Data.length > 0 && (
                                    <div style={{ width: '100%' }}>
                                        <Typography.Title level={5} style={{ color: "white", backgroundColor: "brown", margin:0 }}>
                                            Monthly Crop Water Use (mm)
                                        </Typography.Title>

                                       <Row style={{ width: '100%', height: '30em', padding: 0 }}>
                                            <Col span={10} style={{ textAlign: "center", marginBottom: 16, padding: '1em'  }}>
                                                  <Statistic title="Total Annual Water Saving" value={-annualWaterSavingsVolume.toFixed(0) + " acre-ft"} />
                                                  <br/>
                                                  <Statistic title="Total Value of Annual Water Saving ($)" 
                                                     value={'$' + -waterValue.toFixed(0) + " USD"}
                                                    />
                                                    <span style={{ fontSize: '0.9em', fontStyle: 'italic' }}>
                                                       (assumes $0.10/MGal)
                                                    </span>

                                            </Col>
                                            <Col span={14} style={{ textAlign: "center", }}>
                                                <div style={{height: '25em', width: '100%', }}>
                                                <ResponsiveContainer style={{  padding:'1em' }}>
                                                    <ComposedChart
                                                        style={{}}
                                                        responsive
                                                        data={combinedET0Data}
                                                        margin={{ top: 20, right: 0, left: 0, bottom: 0, }}
                                                    >
                                                        <XAxis dataKey="month" stroke='white' />
                                                        <YAxis label={"acre-ft"} stroke='white' />
                                                        <Legend />
                                                        <Line type="natural" dataKey="et0" stroke="blue" connectNulls />
                                                        <Area type="monotone" dataKey="et0_ci" stroke="blue" fill="rgba(0, 153, 255, 0.7)" fillOpacity={1} /> 
                                                        
                                                        <Line type="natural" dataKey="et0_with_panels" stroke="rgb(8, 155, 8)" connectNulls />
                                                        <Area type="monotone" dataKey="et0_with_panels_ci" stroke="lightgreen" fill="rgba(89, 208, 3, 0.63)" fillOpacity={1} />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </Col>
            </Row>
        </div>
    );
}


export default OregonAgrivoltaics;


{/*
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={data}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#8884d8"
                                        strokeWidth={2}
                                        dot={{ fill: '#8884d8' }}
                                        activeDot={{ r: 8 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expenses"
                                        stroke="#82ca9d"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>

                            <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart
                                         style={{ width: '100%', height: '100%', aspectRatio: 1.618 }}
                                         responsive
                                         data={chartData}
                                         margin={{top: 20,right: 0,left: 0,bottom: 0,}}
                                       >
                                         <CartesianGrid strokeDasharray="3 3" />
                                         <XAxis dataKey="month" />
                                         <YAxis width="auto" />
                                         <Line type="natural" dataKey="value" stroke="red" connectNulls />
                                    </ComposedChart>
                            </ResponsiveContainer>
                                */}