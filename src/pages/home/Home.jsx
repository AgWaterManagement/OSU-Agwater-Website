import { Row, Col, Button, Typography} from 'antd';

const { Title, Paragraph } = Typography;

import AWArticles from '../../components/articles/AWArticles';
import ToolTable from '../../components/tool_table/ToolTable';



const HomePage = () => (
    <div>
       <Title level={2} style={{ marginLeft: '0.25em' }}>Agricultural Water Management in the Pacific Northwest</Title>

        <Paragraph style={{ marginLeft: '0.5em' }}>
            Water is essential to agriculture, and efficient use of water is increasingly important in the face of water scarcity and increasing
            drought risk resulting from competing demands and a changing climate.  This site, developed through a consortium of Pacific Northwest universities,
            provides access to recent articles, calculators and other tools, and information resources for irrigators, agricultural water managers,
            agencies, and other stakeholders to more effectively manage water resources in the region.
        </Paragraph>

        <Paragraph>
            <Title level={3} style={{ marginBottom: 0, paddingBottom: 0, marginLeft: '0.25em' }}>Tools for Agricultural Water Management</Title>
        </Paragraph>
        <div>
            <ToolTable showUnderDevelopment={false} searchTerm='' maxTools={3}></ToolTable>
        </div>

        <Button type='primary' href='/tools' style={{ padding: '1em', marginLeft:'1em',marginTop: 8 }}>View all tools...</Button>

        <Paragraph>
            <Title level={3} style={{ marginLeft: '0.25em', marginBottom: 0, paddingBottom: 0 }}>Latest News...</Title>
        </Paragraph>
        <div>
            <AWArticles showFilters={false} showSearch={false}></AWArticles>
        </div>
    </div>
);

export default HomePage;
