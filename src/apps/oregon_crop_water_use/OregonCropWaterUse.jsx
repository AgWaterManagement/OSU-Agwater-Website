//import PropTypes from 'prop-types';
import { useRef, useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Row, Col, Card, Menu, List, Button, Select, ConfigProvider } from 'antd'
import { Tooltip as AntTooltip  } from 'antd';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import { Gauge } from '@mui/x-charts/Gauge';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label, ResponsiveContainer } from 'recharts';

import './OregonCropWaterUse.css';

import ChoroplethMap from '../../components/choropleth_map/ChoroplethMap';

import colormap from 'colormap'

//import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
//import { useTable } from 'react-table';
//import { Bar } from 'react-chartjs-2';
//import Chart from 'chart.js/auto';

const blueScale = (value, min, max) => {
    const ratio = (value - min) / (max - min || 1);
    const blue = Math.floor(255 * ratio);
    return `rgb(0, 0, ${blue})`;
};


const OregonCropWaterUse = () => {

    //const [summaryData, setSummaryData] = useState([]);
    //const [chartData, setChartData] = useState({});
    const [geoData, setGeoData] = useState(null);
    const [year, setYear] = useState(2008);
    const [activeField, setActiveField] = useState('AW_v');

    //const [isActive, setIsActive] = useState(false)

    const [geoJsonURL, setGeoJsonURL] = useState(null);
    const _geoJsonURL = '/articles/OregonCropWaterUse/data/or_openet_huc8_irrigated_all.geojson';


    const yearOptions = {};
    for (let i = 1985; i <= 2022; i++) {
        yearOptions[i] = i.toFixed(0);
    }

    const fieldItems = [
        { field: 'ET_v', label: 'Actual ET', description: 'Actual Evapotranspiration - The volume of water removed from an area due to the processes of evaporation and transpiration' },
        { field: 'ETc_v', label: 'Potential ET', description: 'Potential Evapotranspiration - The volume of water that would be removed from an area if there was no water limitation' },
        { field: 'ETo_v', label: 'Reference ET', description: 'Reference Evapotranspiration - The volume of water removed from a reference crop (e.g., grass) under standard conditions' },
        { field: 'PPT_v', label: 'Precipitation', description: 'The volume of water that falls as precipitation over a given area' },
        { field: 'EFF_v', label: 'Effective Precipitation', description: 'The volume of soil water that is available for plant use after accounting for losses due to runoff and deep percolation' },
        { field: 'NIWR_v', label: 'Net Irrigation Requirement', description: 'The volume of water needed to fully satisfy crop water requirements needed in addition to precipitation' },
        { field: 'CUirr_v', label: 'Irrigation Consumptive Use', description: 'The volume of water that is consumed by the crop due to irrigation, accounting for effective precipitation' },
        { field: 'AW_v', label: 'Applied Water', description: 'The volume of water that is applied to the crop through irrigation' },
    ];


    let colors = colormap({
        colormap: 'jet',
        nshades: 10,
        format: 'hex',
        alpha: 1
    });


    function BuildFieldItems() {
        const items = fieldItems.map((_field) => {
            //if (_field.field === activeField) {
            //    return { key: _field.field, label: (<>{_field.label + "estt" }<br />{_field.description}</>) }
            //} else {
                return { key: _field.field, label: _field.label }
            //}
        })
        return items;
    }

    function BuildFieldOptions() {
        let fields = [];

        for (let field of fieldItems) {
            fields.push((<Option key={field.field} value={field.field}>{field.label}</Option>
            ))
        }
        return fields;
    }

    function BuildMenuItems() {
        let items = [];
        for (let field of fieldItems) {
            items.push({ key: field.field, label: field.label, style:'color:yellow' })
        }
        return items;
    }

    function OnChangeField(e) {
        const _field = e.currentTarget.id;

        setActiveField(_field);
        console.log('App: Field updated to ' + _field);
    }
    function OnChangeSelectedField(e) {
        setActiveField(e);
        console.log('App: Field updated to ' + e);
    }

    function onChangeYear(val) {
        console.log('selected ' + val)
        setYear(val);
        console.log('Setting field to ' + metric + '_' + val)
        setActiveField(metric + '_' + val);
    }

    function BuildChart(huc) {
        if (geoData === null)
            return;

        let data = [];
        for (let field of fieldItems) {
            let metric = { name: field.label, value: 0 };
            for (let f of geoData.features) {
                if (f.properties[field.field] !== undefined) {
                    if (huc !== undefined || f.properties)
                        ;
                    else
                        metric.value += f.properties[field.field];
                }
            }
            data.push(metric);
        }
        //console.log(data);
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    width={'100%'}
                    height={'100%'}
                    data={data}
                    layout="vertical"
                    margin={{
                        top: 5,
                        right: 5,
                        left: 5,
                        bottom: 25,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis stroke="white" type="number">
                        <Label value="Volume (Acre-feet)" offset={0} position="bottom" />
                    </XAxis>
                    <YAxis dataKey="name" width={144} type="category" stroke="white" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" layout='vertical' fill="#8884d8" activeBar={<Rectangle fill="pink" stroke="blue" />} />

                </BarChart>
            </ResponsiveContainer>
        );
    }


    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const value = parseInt(payload[0].value.toFixed(0));
            const formattedNumber = value.toLocaleString();

            // get description from fieldItems
            let description = '';
            for (let field of fieldItems) {
                if (field.label === label) {
                    description = field.description;
                    break;
                }
            }

            return (
                <div style={{ backgroundColor: 'white', color: 'black', width: '16em' }}>
                    <p>{`${label}: ${formattedNumber}`}</p>
                    <p>{description}</p>
                </div>
            );
        }
    }
    /*
     
     // Process the data for summaries and charts
     const processData = (data) => {
         const properties = data.features.map(feature => feature.properties);
     
         // Create summary table data
         const summary = properties.map(property => ({
             id: property.id,
             name: property.name,
             value: property.value,
         }));
         setSummaryData(summary);
     
         // Create chart data
         const chartValues = properties.map(property => property.value);
         const chartLabels = properties.map(property => property.name);
     
         setChartData({
             labels: chartLabels,
             datasets: [
                 {
                     label: 'Values',
                     data: chartValues,
                     backgroundColor: 'rgba(75, 192, 192, 0.6)',
                     borderColor: 'rgba(75, 192, 192, 1)',
                     borderWidth: 1
                 }
             ]
         });
     };
     
     // Styling function for the choropleth map
     const getChoroplethStyle = (feature) => {
         const value = feature.properties.value || 0;
         return {
             fillColor: getColor(value),
             weight: 2,
             opacity: 1,
             color: 'white',
             dashArray: '3',
             fillOpacity: 0.7
         };
     };
     
     const getColor = (value) => {
         return value > 100 ? '#800026' :
             value > 50 ? '#BD0026' :
                 value > 20 ? '#E31A1C' :
                     value > 10 ? '#FC4E2A' :
                         value > 5 ? '#FD8D3C' :
                             value > 1 ? '#FEB24C' :
                                 value > 0 ? '#FFEDA0' :
                                     '#ffffcc';
     };
     
     // Handle interactivity for showing feature details
     const onEachFeature = (feature, layer) => {
         const { name, value, id } = feature.properties;
     
         // Add a tooltip for feature info on hover
         layer.bindTooltip(`
       <div>
         <strong>${name}</strong><br />
         ID: ${id}<br />
         Value: ${value}
       </div>`, { permanent: false, direction: 'top', className: 'leaflet-tooltip' });
     
         // Highlight feature on hover
         layer.on({
             mouseover: (e) => {
                 const layer = e.target;
                 layer.setStyle({
                     weight: 5,
                     color: '#666',
                     dashArray: '',
                     fillOpacity: 0.7,
                 });
                 layer.openTooltip();
             },
             mouseout: (e) => {
                 geoData.features.forEach((f) => {
                     geoData.features.forEach((f) => {
                         const layer = mapRef.current.leafletElement.getLayer(f.id);
                         layer.setStyle({
                             weight: 2,
                             color: 'white',
                             fillOpacity: 0.7,
                         });
                     });
                 });
             },
         });
     };
     */
    // Table rendering using react-table

    //const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    //    columns: [
    //        { Header: 'ID', accessor: 'id' },
    //        { Header: 'Name', accessor: 'name' },
    //        { Header: 'Value', accessor: 'value' },
    //    ],
    //    data: summaryData,
    //});


    function styleFn(feature) {
        let _style = {
            weight: 1,
            opacity: 1,
            color: "red",
            fillColor: "blue",
            fillOpacity: 0.5
        };
        if (colors !== null) {
            const value = feature.properties[0];   //selectedProperty];
            const index = value < dataMin ? 0 : value > dataMax ? colors.length - 1 : Math.floor((value - dataMin) / (dataMax - dataMin) * colors.length);
            _style['color'] = colors[index];
        }
        return _style;
    }

    const isMobile = useMediaQuery({ query: '(max-width: 800px)' })
    const screens = useBreakpoint();   // screens=['sm',1] contains breakpoint information
    console.log
    //{Object.entries(screens)
    //            .filter((screen) => !!screen[1])
    //            .map((screen) => (
    //                <Tag color="blue" key={screen[0]}>
    //                    {screen[0]}
    //                </Tag>

    if (geoJsonURL === null) {
        fetch(_geoJsonURL)
            .then(response => response.json())
            .then(data => {
                setGeoData(data);
                setGeoJsonURL(_geoJsonURL);
            })
            .catch(error => {
                console.error('Error fetching GeoJSON:', error);
            });
    }

    return (
        <div style={{ paddingLeft: '1em', paddingRight: '1em' }}>
            <div>
                <h2>Crop Water Use in Oregon</h2>
                <span>John Bolte, Professor, Biological &amp; Ecological Engineering, Oregon State University</span>
                <br />
            </div>
            <hr />
            <div>Below are presented a variety of data related to crop water use in Oregon. The map is interactive -
                click on a region on the map to see more detailed information about the water use in that region.
                The data shown was generated as part of a joint effort
                between <a href='https://www.oregon.gov/owrd/pages/index.aspx'>Oregon's Water Resources Department</a>,
                <a href='https://etdata.org/'>OpenET </a>,
                and the <a href='https://www.dri.edu'>Desert Research Institute</a>.  <a href='https://www.dri.edu/project/owrd-et/'>The study </a>
                provides a long-term record of monthly and annual satellite-based actual crop ET
                and consumptive use of irrigation water, potential crop ET and irrigation water
                requirements, applied irrigation water for <b>hydrologic units</b> of the state.
            </div>

            <h4>Crop Water Use Map</h4>
            <div>
                <Row gutter={0} style={{ paddingTop: '1em' }}>
                    <Col xs={24} sm={24} md={10} lg={10} xl={10}>
                        <span>The following map shows crop water related data. Choose the attribute to view
                            from the list, the map will update to show the selected attribute.</span>
                        <br />
                        <span>
                            The report referenced above describes a detailed analysis of agricultural water use in Oregon.  The report
                            summarizes various components of agricultural water use, including
                            precipitation amounts, irrigation water appled, consumptive use by crops, and crop evoptranspiration.
                        </span>
                        <br />
                        <span>                            
                            The maps and charts here show the yearly averages for the period of 1985-2022.
                            To see data for other years, select the year from the list.
                        </span>
                        {/*
                        <h5>Definition of Terms</h5>

                        {fieldItems.map((item) =>
                            (<><span><b>{item.label}</b></span><span>: {item.description}</span><br /></>)
                        )} */}
                    </Col>
                    <Col xs={24} sm={24} md={4} lg={4} xl={4}>
                        {isMobile == true && (
                            <>
                            <br/>
                                <Select
                                    defaultValue='AW_v'
                                    style={{ width: '16em' }}
                                    optionFilterProp="label"
                                    onChange={OnChangeSelectedField}
                                >
                                    {BuildFieldOptions()}
                                </Select>
                                <br />
                                <span>{activeFieldItem.description}</span>
                                <hr />
                            </>
                        )}

                        {isMobile == false && (

                              <List id='field-menu'
                                itemLayout="horizontal"
                                dataSource={fieldItems}
                                renderItem={(item, index) => (
                                    <AntTooltip title={item.description} placement="right">
                                        <List.Item id={item.field}
                                            className={item.field == activeField ? 'item-selected' : ''}
                                            style={{ cursor: 'pointer', padding: '0.5em', color: item.field == activeField ? 'white' : 'black'} }
                                            onClick={OnChangeField} >
                                        <List.Item.Meta
                                          title={item.label}
                                        />
                                      </List.Item>

                                    </AntTooltip>
                                )}
                              />

                        )}
                    </Col>
                    <Col xs={24} sm={24} md={10} lg={10} xl={10} >
                            <ChoroplethMap
                                data={geoData}
                                featureProperty={activeField}
                                center={[44, -120.1]}
                                zoom={5.6}
                                showLegend={true}
                                showZoomControl={false}
                                allowScroll={false}
                                style={{ height: '720px' }}
                            />
                        </Col>
                </Row>
            </div>

            <Row gutter={16} style={{ paddingTop: '1em' }}>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <h4>Statewide Crop Water Use Summary</h4>
                    {/*
                    <Gauge
                        value={75}
                        height={120}
                        startAngle={0}
                        endAngle={360}
                        innerRadius="80%"
                        outerRadius="100%"
                    /> */}
                    <div style={{ height: '30em', padding: '1em' }}>
                        {BuildChart()}
                    </div>
                </Col>

            </Row>
            <div className="row">
                <h5>More Information</h5>
                (1) USDA ERS - Irrigation & Water Use. https: //www.ers.usda.gov/topics/farm-practices-management/irrigation-water-use/.
                (2) Impacts of agricultural irrigation on groundwater salinity. https: //link.springer.com/article/10.1007/s12665-018-7386-6.
                (3) Types of Agricultural Water Use | Other Uses of Water - CDC. https: //www.cdc.gov/healthywater/other/agricultural/types.html.
            </div>
        </div>
    )
};

OregonCropWaterUse.propTypes = {
    //article: PropTypes.object,
}

export default OregonCropWaterUse;
