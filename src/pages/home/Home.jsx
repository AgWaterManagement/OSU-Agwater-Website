import { Row, Col, Button} from 'antd';

import AWArticles from '../../components/articles/AWArticles';
import ToolTable from '../../components/tool_table/ToolTable';



const HomePage = () => (
    <div className='content-container'>


        <h2 className="main-title">Agricultural Water Management in the Pacific Northwest</h2>

        <p className='intro-text'>
            Water is essential to agriculture, and efficient use of water is increasingly important in the face of water scarcity and increasing
            drought risk resulting from competing demands and a changing climate.  This site, developed through a consortium of Pacific Northwest universities,
            provides access to recent articles, calculators and other tools, and information resources for irrigators, agricultural water managers,
            agencies, and other stakeholders to more effectively manage water resources in the region.
        </p>

        <h3 className="content-container-header" style={{ marginBottom: 0, paddingBottom: 0 }}>Tools for Agricultural Water Management</h3>
        <div>
            <ToolTable showUnderDevelopment={false} searchTerm='' maxTools={3}></ToolTable>
        </div>

        <Button type='primary' href='/tools' style={{ padding: '1em', marginLeft:'1em',marginTop: 8 }}>View all tools...</Button>

        <h3 className="content-container-header" style={{ marginBottom: 0, paddingBottom: 0 }}>Latest News...</h3>
        <div>
            <AWArticles showFilters={false} showSearch={false}></AWArticles>
        </div>
    </div>
);

export default HomePage;
