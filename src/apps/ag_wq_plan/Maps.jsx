import { Card, Tabs, Typography } from 'antd';

const { Paragraph, Title, Text } = Typography;

import WqMap from './WqMap'

const TMDL_GEOJSON_URL = 'https://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services/TMDLs_DEQ_by_parameter_Feb2026/FeatureServer/4/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson';
const ODA_AWQMA_WMS_URL = 'https://maps.oda.oregon.gov/arcgis/rest/services/Water_Quality/WQ_Auth_Datasets/FeatureServer/3/query?where=MA_Index>0&outFields=*&returnGeometry=true&f=geojson'


const Maps = () => {
	const items = [
		{
			key: '1',
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
			key: '2',
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

	return <Tabs defaultActiveKey="1" items={items} />;
};

export default Maps;
