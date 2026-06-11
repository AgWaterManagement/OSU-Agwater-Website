import { useEffect, useRef, useMemo, useState } from "react";
import { Input, Spin, Row, Col, Typography, Statistic, Collapse, Form } from "antd";
import { SettingOutlined } from '@ant-design/icons';


import {
    ResponsiveContainer, ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    //CartesianGrid,
    //Tooltip,
    Legend,
    Label,
    DefaultLegendContent,
    //DefaultLegendContentProps,
    DefaultTooltipContent,
    ReferenceDot,
    //LabelList,
    //TooltipContentProps,
} from 'recharts';


import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-legend";
import "@arcgis/map-components/components/arcgis-feature-table";
import { watch as reactiveWatch } from "@arcgis/core/core/reactiveUtils.js";

//import ImageryTileLayer from "@arcgis/core/layers/FeatureLayer.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";

import Extent from "@arcgis/core/geometry/Extent.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Sketch from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import Graphic from "@arcgis/core/Graphic.js";
import Basemap from "@arcgis/core/Basemap.js";
import Title from "antd/es/typography/Title";
//import {unionOperator} from "@arcgis/core/geometry/operators/unionOperator.js";



const AgFieldLayer = ({ loadFeatureData, selectedFieldFeatures, setSelectedFieldFeatures }) => {

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

    const featureTableRef = useRef(null);

    const [highlites, setHighlites] = useState([]);


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

    // This function is called when the user completes drawing a rectangle on the map.
    // It queries features that intersect the rectangle and sets the highlightIds
    // of the feature table component to match the objectIds of features of the query result
    async function selectFeatures(geometry) {
        try {
            const query = { geometry };
            const result = await viewRef.current?.queryFeatures(query);

            if (result.features.length === 0) {
                clearSelection();
            } else {
                featureTableRef?.current?.highlightIds.removeAll();
                featureTableRef.current.filterGeometry = geometry;

                const highlightIds = result.features.map((feature) => feature.attributes.OBJECT_ID);
                featureTableRef?.current?.highlightIds.addMany(highlightIds);

            }
        } catch (error) {
            console.error("Error selecting features:", error);
        }
    }


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


            view.highlights.push({ name: "default", color: "#17CBE8" });
            view.highlights.push({ name: "selected", color: "magenta" });

            // Set up click event listener
            view.on("click", function (event) {
                //view.hitTest(event).then(function (response) {
                view.hitTest(event).then((response) => {
                    const feature = response.results[0]?.graphic;
                    if (feature) {
                        loadFeatureData(feature);

                        view.whenLayerView().then((layerView) => {

                            // add to the selectedFieldFeatures array if it is not already present
                            if (!selectedFieldFeatures.includes(feature)) {
                                setSelectedFieldFeatures((prevFeatures) => [...prevFeatures, feature]);

                                // highlight the feature in the feature table by adding its objectId to the highlightIds collection of the feature table component
                                const highlight = layerView.highlight(feature, { name: "selected" }).then((highlight) => {});
                                setHighlites((prevHighlites) => [...prevHighlites, highlight]);
                            } else {
                                // if the feature is already in the selectedFieldFeatures array, remove it from the array and remove the highlight from the feature table
                                setSelectedFieldFeatures((prevFeatures) => prevFeatures.filter((f) => f !== feature));
                                layerView.highlight(feature, { name: "selected" }).then((highlight) => {
                                    highlight.remove();
                                    setHighlites((prevHighlites) => prevHighlites.filter((h) => h !== highlight));
                                });
                                
                                if (featureTableRef.current) {
                                    const objectId = feature.attributes.OBJECT_ID;
                                    featureTableRef.current.highlightIds.remove(objectId);
                                }
                            }
                        });
                    }
                });
            });

            try {
                await view.when();

                // set the highlights collection. Change the colors of the two default highlight option objects
                view.highlights = [
                    { name: "default", color: "#17CBE8" }, // used by feature table and popup
                    { name: "temporary", color: "magenta" }, // used when user mouse the pointer over table cells
                ];

                featureTableRef.current = document.querySelector("arcgis-feature-table");

                // detect changes in the feature table selection
                // apply feature effect to the layer view based on selected objectIds
                //featureTableRef.current.addEventListener("arcgisSelectionChange", (event) => {
                //    event.detail.removed.forEach((item) => {
                //        const data = features.find((data) => data === item);
                //        if (data) {
                //            features.splice(features.indexOf(data), 1);
                //        }
                //    });
                //});

                //event.detail.added.forEach((item) => {
                //    features.push(item);
                //});

                //layerView.featureEffect = {
                //    filter: { objectIds: features },
                //    excludedEffect: "blur(5px) grayscale(90%) opacity(40%)",
                //    };
                //});



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
                id="orAgFieldsMap"
                ref={mapRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                basemap="topo-vector"
                center="-121.5,38.8"
                zoom="10"
            >
                <arcgis-zoom position="top-left" />
                <arcgis-legend position="bottom-left" />
            </arcgis-map>


            <arcgis-feature-table reference-element="orAgFieldsMap"></arcgis-feature-table>


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

    const [selectedFieldFeatures, setSelectedFieldFeatures] = useState([]);  // array of selected field features

    const [form] = Form.useForm();
    
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
        // append the new feature to the selectedFieldFeatures array if it is not already present
        setSelectedFieldFeatures((prevFeatures) => {
            const isAlreadySelected = prevFeatures.some((f) => f.attributes.OPENET_ID === attributes.OPENET_ID);
            if (!isAlreadySelected) {
                return [...prevFeatures, feature];
            }
            return prevFeatures;
        });

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

        const chartData = fieldDetailData[chartType]?.map((data, index) => {
            return {
                month: months[index],
                mean: data.mean,
                eff: data.eff,
                ci: data.ci ? [data.ci.lower, data.ci.upper] : null,
            };
        });

        return chartData || [];  // 
    };



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
    const solarChartData = getChartData("monthly_solar_energy");   // MJ/m2/day, mean solar energy received per month, with confidence intervals (ci) for each month
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
        let annualTotal = 0;   // this will be the sum of the monthly solar energy values after conversion to kWh
        let annualPanelEfficiency = 0;
        for (let month = 0; month < chartData.length; month++) {
            const meanEnergy = chartData[month].mean;   // MJ/m²/day, mean power over month
            const energyKWh = (meanEnergy * daysPerMonth[month]) / 3.6; // MJ/m2 * 1/3.6 = kWh/m2
            // convert to kWh/m² by dividing by 3.6 (since 1 kWh = 3.6 MJ)
            annualTotal += energyKWh;  // kWh/m2

            if (chartData[month].eff) {
                annualPanelEfficiency += chartData[month].eff * daysPerMonth[month];  // this is a very rough way to estimate the average panel efficiency over the year, by averaging the monthly efficiency values.  A more accurate way would be to calculate the energy produced by the panels each month and divide by the energy received each month, then average those monthly efficiency values.
            }
        }
        // multiple by the area of the field to get total energy production potential for the field, then convert to MWh:
        const fieldArea = fieldFeatureData?.Acres ? fieldFeatureData.Acres * 4046.86 : 0; // convert acres to m²
        const meanAnnualRate = fieldArea * (annualTotal / (24*365));  // m2*kWh/m²/(hr/y) = kW, this is the average energy received per unit area of the field
                
        annualTotal *= fieldArea;  // KWh,  assuming fieldArea is in m²
        annualTotal /= 1000;  // convert kWh to MWh

        annualPanelEfficiency /= 365;  // this gives us the average panel efficiency over the year, weighted by the number of days in each month
        return [annualTotal, meanAnnualRate, annualPanelEfficiency];  // MWh/year, mean annual KW received over the year, panel efficiency    
    }

    function getAnnualWater(chartData, fieldFeatureData) {
        let annualTotal = 0;   // this will be the sum of the monthly solar energy values after conversion to kWh/m²
        const fieldArea = fieldFeatureData?.Acres ? fieldFeatureData.Acres : 0; // field acres
        for (let month = 0; month < chartData.length; month++) {
            const monthlyWater = chartData[month].mean * 0.00328084; // mm/day, converted to ft/day
            const waterFt_per_month = monthlyWater * daysPerMonth[month]; // convert to ft/month
            annualTotal += waterFt_per_month;  // ft/year
        }
        // multiple by the area of the field to get water for the field, then convert to acre-ft:
        const totalVol = annualTotal * fieldArea;  // assuming fieldArea is in acres, this will give us acre-ft/year
        return [annualTotal, totalVol];  // assuming fieldArea is in acres, this will give us [ft/year, acre-ft/year]
    }

    // get annual incident solar energy (MWh/year), mean power rate (kW) for the field
    const [annualSolarEnergy, meanAnnualSolarRate, _] = getAnnualEnergy(solarChartData, fieldFeatureData);   // this will be the sum of the monthly solar energy values after conversion to kWh/m²

    // get annual PV generation (MWh/year), mean power rate (kW) for the field
    const energyProductionData = getChartData("monthly_energy_production");
    const [annualEnergyProduction, meanAnnualEnergyRate, annualPanelEfficiency] = getAnnualEnergy(energyProductionData, fieldFeatureData);   // this will be the sum of the monthly solar energy values after conversion to kWh/m²

    const combinedEnergyData = solarChartData.map((item, index) => {
        return {
            month: item.month,
            solar_energy: item.mean,
            solar_energy_ci: item.ci,
            energy_production: energyProductionData?.[index]?.mean,
            energy_production_ci: energyProductionData?.[index]?.ci,
            panel_eff: energyProductionData?.[index]?.eff,
        };
    });
    const energyValue = annualEnergyProduction * 100;  // assuming $100/MWh, this is a very rough estimate of the annual revenue potential from solar energy production on the field

    const et0Data = getChartData("monthly_et0");  // mm/day, mean ET0 per month, with confidence intervals (ci) for each month
    const et0WithPanelsData = getChartData("monthly_et0_with_panels");

    const combinedET0Data = et0Data.map((item, index) => {
        return {
            month: item.month,
            et0: item.mean,    //mm/day
            et0_ci: item.ci,
            et0_with_panels: et0WithPanelsData[index]?.mean,   // mm/day
            et0_with_panels_ci: et0WithPanelsData[index]?.ci,
        };
    });

    const waterDeltaData = getChartData("monthly_water_delta");  // mm
    //[annualTotal, totalVol] = [ft/year, acre-ft/year]
    const [annualWaterSavingsRate, annualWaterSavingsVolume] = getAnnualWater(waterDeltaData, fieldFeatureData);   // this will be the sum of the monthly water delta values
    const annualWaterSavingsRate_mm = annualWaterSavingsRate * 25.4;  // convert ft/year to mm/year, this is the water savings rate over the year in mm
    const waterValue = annualWaterSavingsVolume * 200;  // assuming $200/acre-ft, this is a very rough estimate of the annual value of water savings

    const contentStyle = {
        padding: 50,
        background: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 4,
    };
    const content = <div style={contentStyle} />;


    const renderLegend = ({ payload, ref, ...rest }) => {
        return (<div style={{ textAlign: 'center' }}> <span style={{ color: 'red' }}>Incident Solar Radiation</span><br />
            <span style={{ color: 'lightgreen' }}>Electricity Generation</span></div>);
    };

    const toThousands = (num) => {
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    //const panelItems = [
    //    { label: 'Solar Energy Potential', key: 'solar_energy', children: [] },
    //    { label: 'Energy Production Potential', key: 'energy_production', children: [] },
    //    { label: 'Panel Efficiency', key: 'panel_eff', children: [] },
    //];


    return (
        <div style={{ width: "100%" }}>
            <Row>
                <Col span={24} style={{ textAlign: "center", marginBottom: 16 }}>
                    <Typography.Title level={1} style={{ color: "white" }}>
                        Oregon Agrivoltaics Suitability Mapping
                    </Typography.Title>
                    <Typography.Paragraph style={{ color: "white", fontSize: 18, marginLeft: 4 }}>
                        This map shows the suitability of farm fields in Oregon for agrivoltaic siting.
                        <b>Agrivoltaics</b> combines agriculture with solar energy production.
                        On the map below, you can select a field and get information about its suitability for agrivoltaic development,
                        including solar energy potential and water savings.
                    </Typography.Paragraph>
                </Col>
            </Row>
            <Row>
                <Col span={12} style={{ textAlign: "center", marginBottom: 16 }}>
                    <Typography.Title level={4} style={{ color: "white" }}>
                        Solar Energy Potential
                    </Typography.Title>

                    <AgFieldLayer loadFeatureData={loadFeatureData} selectedFieldFeatures={selectedFieldFeatures} setSelectedFieldFeatures={setSelectedFieldFeatures} />

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
                                <div>Field ID: {fieldFeatureData?.OPENET_ID}, Area: {fieldFeatureData?.Acres?.toFixed(1)} acres</div>

                                <Collapse style={{ marginBottom: 16 }}>
                                    <Collapse.Panel header="Solar Energy Capture" key="1">
                                        {fieldDetailData && solarChartData && solarChartData.length > 0 ? (
                                            <div style={{ width: '100%', borderRadius: 10 }}>
                                                <Row style={{ width: '100%', padding: 0 }}>
                                                    <Col span={10} style={{ textAlign: "center", marginBottom: 16, padding: '1em' }}>
                                                        <Statistic title="Total Annual Incident Solar Radiation Energy (MWh)" value={toThousands(annualSolarEnergy.toFixed(0)) + " MWh"} />
                                                        <br />
                                                        <Statistic title="Total Annual PV Energy Produced (MWh)" value={toThousands(annualEnergyProduction.toFixed(0)) + " MWh"} />
                                                        <br />
                                                        <Statistic title="Mean Annual Panel Efficiency (%)" value={toThousands((100*annualPanelEfficiency).toFixed(1)) + " %"} />
                                                        <br />
                                                        <Statistic title="Total Annual Value of PV Energy Produced ($)" value={'$' + toThousands((100*annualEnergyProduction).toFixed(0.1))} />
                                                        <span style={{fontSize:'0.9em', fontStyle:'italic'}}>
                                                        Assumes 10 cents per kilowatt-hour.
                                                        </span>
                                                        <br />
                                                    </Col>
                                                    <Col span={14} style={{ textAlign: "center", }}>
                                                        <div style={{ height: '25em', width: '100%', }}>
                                                            <ResponsiveContainer style={{ padding: '2em' }}>
                                                                <ComposedChart
                                                                    style={{ padding: '1em', }}
                                                                    responsive
                                                                    data={combinedEnergyData}
                                                                    margin={{ top: 20, right: 0, left: 0, bottom: 0, }}
                                                                >
                                                                    <XAxis dataKey="month" stroke='white' />
                                                                    <YAxis label={{
                                                                        stroke: 'white',
                                                                        value: 'W/m2',
                                                                        angle: -90,
                                                                        position: 'insideLeft',
                                                                        offset: 10,
                                                                    }}
                                                                        yAxisId="left"
                                                                        orientation="left"
                                                                        stroke='white' />

                                                                    <YAxis label={{
                                                                            stroke: 'yellow',
                                                                            value: 'Efficiency (%)',
                                                                            angle: -90,
                                                                            position: 'outsideRight',
                                                                            offset: 30,
                                                                            textAnchor:"right"
                                                                        }}
                                                                        yAxisId="right"
                                                                        orientation="right"
                                                                        stroke='yellow' />

                                                                      {/* Data-based dot at the peak 
                                                                                                                                          <ReferenceDot x="Jun" y={8} r={1} fill="green" stroke="none">
                                                                        <Label value="Solar Energy" position="bottom" fill="rgb(255,0,0)" />
                                                                    </ReferenceDot>

                                                                      */}
                                                                    <Line yAxisId='left' type="natural" dataKey="solar_energy" stroke="black" connectNulls >
                                                                    </Line>
                                                                    <Area yAxisId='left' type="monotone" dataKey="solar_energy_ci" stroke="pink" fill="rgba(255, 0, 0, 0.7)" />

                                                                    <Line yAxisId='left' type="natural" dataKey="energy_production" stroke="green" connectNulls />
                                                                    <Area yAxisId='left' type="monotone" dataKey="energy_production_ci" stroke="lightgreen" fill="rgba(0, 255, 0, 0.7)" fillOpacity={1} />

                                                                    <Line yAxisId='right' type="natural" dataKey="panel_eff" stroke="yellow" connectNulls />

                                                                </ComposedChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col span={24}>

                                                        <Collapse
                                                            expandIconPlacement={'start'}
                                                            items={[
                                                                {
                                                                  key: '1',
                                                                  label: 'Settings',
                                                                  children: <div>
                                                                    <Row>
                                                                        <Col span={12} style={{ textAlign: "right" }}>
                                                                            <span className="ant-form-item-label">Fraction of Field Area covered by Solar Panels: </span>
                                                                        </Col>
                                                                        <Col span={12} style={{ textAlign: "left", paddingLeft: 16 }}>
                                                                            <Input style={{maxWidth:'10em'}} placeholder="input placeholder" />
                                                                        </Col>
                                                                    </Row>
                                                                    <br />
                                                                    <Row>
                                                                        <Col span={12} style={{ textAlign: "right" }}>
                                                                            <span className="ant-form-item-label">Value of PV-generated Electricity per KWh: </span>
                                                                        </Col>
                                                                        <Col span={12} style={{ textAlign: "left", paddingLeft: 16 }}>
                                                                            <Input style={{maxWidth:'10em'}} placeholder="input placeholder" />
                                                                        </Col>
                                                                    </Row>
                                                                    </div>,
                                                                  extra: <SettingOutlined />
                                                                }]}

                                                              />
                                                    </Col>
                                                </Row>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: "center", marginTop: 50, color: "white" }}>
                                                Click on a field in the map to see details here.
                                            </div>
                                        )}

                                    </Collapse.Panel>

                                    <Collapse.Panel header="Water Savings" key="2">

                                        {fieldDetailData && combinedET0Data && combinedET0Data.length > 0 && (
                                            <div style={{ width: '100%' }}>
                                                <Row style={{ width: '100%', height: '30em', padding: 0 }}>
                                                    <Col span={10} style={{ textAlign: "center", marginBottom: 16, padding: '1em' }}>
                                                        <Statistic title="Total Annual Water Saving (Volume)" value={toThousands((-annualWaterSavingsVolume).toFixed(0)) + " acre-ft"} />
                                                        <br />
                                                        <Statistic title="Annual Water Saving (Rate)" value={toThousands((-annualWaterSavingsRate_mm).toFixed(1)) + " mm/year"} />
                                                        <br />
                                                        <Statistic title="Total Value of Annual Water Saving ($)"
                                                            value={'$' + toThousands((-waterValue).toFixed(0))}
                                                        />
                                                        <span style={{ fontSize: '0.9em', fontStyle: 'italic' }}>
                                                            (assumes $200/acre-ft)
                                                        </span> 
                                                    </Col>
                                                    <Col span={14} style={{ textAlign: "center", }}>
                                                        <div style={{ height: '25em', width: '100%', }}>
                                                            <ResponsiveContainer style={{ padding: '2em' }}>
                                                                <Title level={4} style={{ color: "white" }}>
                                                                    Estimated Potential Crop Water Use with and without Panels
                                                                </Title>
                                                                <ComposedChart
                                                                    style={{ padding: '1em', }}
                                                                    responsive
                                                                    data={combinedET0Data}
                                                                    margin={{ top: 20, right: 0, left: 0, bottom: 0, }}
                                                                >
                                                                    <XAxis dataKey="month" stroke='white' />
                                                                    <YAxis label={{
                                                                        stroke: 'white',
                                                                        value: 'mm/day',
                                                                        angle: -90,
                                                                        position: 'insideLeft',
                                                                        offset: 10,
                                                                        }}
                                                                        stroke='white' />
                                                                    {/* <Legend content={(
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <span style={{ color: 'lightblue' }}>ET₀</span><br />
                                                                            <span style={{ color: 'lightgreen' }}>ET₀ with Panels</span>
                                                                        </div>
                                                                        )} /> */}
                                                                    <Line type="natural" dataKey="et0" stroke="lightblue" connectNulls />
                                                                    <Area type="monotone" dataKey="et0_ci" stroke="blue" fill="rgba(0, 153, 255, 0.7)" fillOpacity={1} />
                                                                    <ReferenceDot x="Jul" y={6} r={1} fill="green" stroke="none">
                                                                        <Label value="ET₀" position="bottom" fill="rgb(0,153,255)" />
                                                                    </ReferenceDot>

                                                                    <Line type="natural" dataKey="et0_with_panels" stroke="lightgreen" connectNulls />
                                                                    <Area type="monotone" dataKey="et0_with_panels_ci" stroke="lightgreen" fill="rgba(89, 208, 3, 0.63)" fillOpacity={1} />

                                                                    <ReferenceDot x="Jul" y={1.6} r={1} fill="green" stroke="none">
                                                                        <Label value="ET₀ with Panels" position="bottom" fill="rgb(89, 208, 3)" />
                                                                    </ReferenceDot>

                                                                </ComposedChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </div>
                                        )}

                                    </Collapse.Panel>

                                </Collapse>
                            </div>
                        </>
                    )}
                </Col>
            </Row>
        </div >
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