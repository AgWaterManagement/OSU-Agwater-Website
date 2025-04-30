import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
//import { useTable } from 'react-table';
//import { Bar } from 'react-chartjs-2';
//import Chart from 'chart.js/auto';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useRef } from 'react';

const GeoJsonMapDashboard = ({ geoJsonUrl }) => {
    const [geoData, setGeoData] = useState(null);
    const [summaryData, setSummaryData] = useState([]);
    const [chartData, setChartData] = useState({});
    const mapRef = useRef();

    useEffect(() => {
        // Fetch the GeoJSON data from the URL
        axios.get(geoJsonUrl)
            .then(response => {
                setGeoData(response.data);
                processData(response.data);
            })
            .catch(error => console.error("Error loading GeoJSON: ", error));
    }, [geoJsonUrl]);

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

    // Table rendering using react-table

    //const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    //    columns: [
    //        { Header: 'ID', accessor: 'id' },
    //        { Header: 'Name', accessor: 'name' },
    //        { Header: 'Value', accessor: 'value' },
    //    ],
    //    data: summaryData,
    //});

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <MapContainer
                center={[51.505, -0.09]} // Change to appropriate coordinates
                zoom={13}
                style={{ height: '400px', width: '100%' }}
                ref={mapRef}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {geoData && (
                    <GeoJSON
                        data={geoData}
                        style={getChoroplethStyle}
                        onEachFeature={onEachFeature}
                    />
                )}
            </MapContainer>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                {/* Chart */}
                <div style={{ width: '45%' }}>
                    <h3>Data Chart</h3>
                    {/* <Bar data={chartData} /> */}
                </div>

                {/* Table */}
                <div style={{ width: '45%' }}>
                    <h3>Data Summary</h3>
                    {/* }
                    <table {...getTableProps()} style={{ width: '100%', border: '1px solid black' }}>
                        <thead>
                            {headerGroups.map(headerGroup => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map(column => (
                                        <th {...column.getHeaderProps()} style={{ padding: '8px', border: '1px solid black' }}>
                                            {column.render('Header')}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody {...getTableBodyProps()}>
                            {rows.map(row => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()}>
                                        {row.cells.map(cell => (
                                            <td {...cell.getCellProps()} style={{ padding: '8px', border: '1px solid black' }}>
                                                {cell.render('Cell')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    */}
                </div>
            </div>
        </div>
    );
};

export default GeoJsonMapDashboard;
