
import { Card, Col, Row, Button } from 'antd';
import { Link } from 'react-router-dom';

const CardRow = () => (
    <>
        <Card className='full-width aw-dark-bg'>
            <Row gutter={16}>
                <Col xs={{ flex: '100%' }} sm={{ flex: '33%' }}>
                    <Card title="Articles" bordered={true}>

                        <div className="text-subtitle2 same-size">Quick reads on current developments in water management in the region</div>
                        <br />
                        <Link className='card-link aw-vdark-bg aw-light-text' to="/articles" >Go to Articles</Link>
                    </Card>
                    <br />
                </Col>
                <Col xs={{ flex: '100%' }} sm={{ flex: '33%' }}>
                    <Card title="Apps and Tools" bordered={false}>
                        <div className="text-subtitle2 same-size">Various calculators and similar tools for designing water systems for agriculture</div>
                        <br />
                        <Link className='card-link aw-vdark-bg aw-light-text' to="/tools" >Go to Apps and Tools</Link>
                    </Card>
                    <br />
                </Col>
                <Col xs={{ flex: '100%' }} sm={{ flex: '33%' }}>
                    <Card title="Resources" bordered={false}>
                        <div className="text-subtitle2 same-size">Links to Fact Sheets, related web sites and other information resources</div>
                        <br />
                        <Link className='card-link aw-vdark-bg aw-light-text' to="/resources" >Go to Resources</Link>
                    </Card>
                </Col>
            </Row>
        </Card>
    </>
);




export default CardRow;
