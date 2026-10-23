import { Card, Select, Typography } from 'antd';
import { useState } from 'react';
import PropTypes from 'prop-types';

const { Title, Text } = Typography;

import WqMap from './WqMap'
import WqDataMapPanel from './WqDataMapPanel'
import SoilErosionMap from './SoilErosionMap'

const TMDL_GEOJSON_URL = 'https://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services/TMDLs_DEQ_by_parameter_Feb2026/FeatureServer/4/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson';
const ODA_AWQMA_WMS_URL = 'https://maps.oda.oregon.gov/arcgis/rest/services/Water_Quality/WQ_Auth_Datasets/FeatureServer/3/query?where=MA_Index>0&outFields=*&returnGeometry=true&f=geojson'


const Maps = ({ currentPlan }) => {
    const [selectedKey, setSelectedKey] = useState('1');
	const items = [
		{
			key: '1',
			label: 'Soils Data',
			children: 
                (
                    <Card>
                        <Title level={4}>Soils Data</Title>
                        <Text>Access spatial data related to soils in Oregon.
                             Source: <a href="https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo">SSURGO</a></Text>
                        <WqDataMapPanel currentPlan={currentPlan} feature_url={TMDL_GEOJSON_URL}></WqDataMapPanel>
                    </Card>
               )
		},
		{
			key: '2',
			label: 'Soil Erosion',
			children: 
                (
                    <Card>
                        <Title level={4}>Soil Erosion</Title>
                        <Text>Access spatial data related to soil erosion in Oregon.
                             Source: <a href="https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo">SSURGO</a></Text>
                        <SoilErosionMap currentPlan={currentPlan} feature_url={TMDL_GEOJSON_URL}></SoilErosionMap>
                    </Card>
               )
		},
		{
			key: '3',
			label: 'ODA Ag Water Quality Management Areas',
			children: 
                (
                    <Card>
                        <Title level={4}>Agricultural Water Quality Management Areas</Title>
                        <Text>ODA Agricultural Water Quality Management Areas. Source: <a href="https://www.oregon.gov/oda/programs/NaturalResources/Pages/AWQMA.aspx">ODA AWQMA Mapper</a></Text>
                        <WqMap geoJson_url={ODA_AWQMA_WMS_URL}></WqMap>
                    </Card>
                )
        },
		{
			key: '4',
			label: 'Oregon TMDL Areas',
			children: 
                (
                    <Card>
                        <Title level={4}>TMDL Areas</Title>
                        <Text>Oregon DEQ TMDL areas by parameter. Source: <a href="https://www.oregon.gov/deq/wq/Pages/TMDLs.aspx">DEQ TMDL Mapper</a></Text>
                        <WqMap feature_url={TMDL_GEOJSON_URL}></WqMap>
                    </Card>
               )
		},
	];
    const selectedItem = items.find((item) => item.key === selectedKey) || items[0];

    return (
        <>
            <br/>
            <Text>Use the dropdown below to select a map to view.</Text>
            <br/>
            <Select
                aria-label="Map selection"
                value={selectedItem.key}
                options={items.map(({ key, label }) => ({ value: key, label }))}
                onChange={setSelectedKey}
                style={{ width: '32em', marginBottom: 16 }}
            />
            {selectedItem.children}
        </>
    );
};

Maps.propTypes = {
    currentPlan: PropTypes.object,
};

export default Maps;
