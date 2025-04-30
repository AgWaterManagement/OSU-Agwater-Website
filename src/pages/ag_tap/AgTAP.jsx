import { useState } from 'react';

import { Row, Col, Card, Tabs, Button, Menu, Checkbox, Steps } from 'antd';
import { AndroidOutlined, AppleOutlined } from '@ant-design/icons';

import { SearchOutlined, TeamOutlined, QuestionCircleOutlined, DashboardOutlined } from '@ant-design/icons';

import DashboardImage from '../../assets/images/dashboard.png'
import Dashboards from '../../apps/dashboards/Dashboards'

import './AgTAP.css';
import { Link } from 'react-router-dom';
import AWTeam from '../../components/team/AWTeam.jsx';
import AWButtonContainer from '../../components/button_container/AWButtonContainer.jsx';
import AWGetAssistance from './ATGetAssistance.jsx';

const AgTAP = () => {

    const [current, setCurrent] = useState('assist');

    const onClickMenu = (e) => {
        if (current != '') {
            document.getElementById('btn_' + current).classList.remove('ant-btn-color-primary');
            document.getElementById('btn_' + current).classList.add('ant-btn-color-default');
        }
        const _current = e.currentTarget.id.slice(4);
        console.log('click ', _current);
        document.getElementById('btn_' + _current).classList.remove('ant-btn-color-default');
        document.getElementById('btn_' + _current).classList.add('ant-btn-color-primary');
        setCurrent(_current);
    }

    return (
        <div>

            <div className='content-container-header'>OSU&apos;s Agricultural Water Technical Assistance Program</div>
            <AWButtonContainer
                items={[
                    { label: 'Get Assistance', key: 'assist', type:'primary', icon: <QuestionCircleOutlined /> },
                    { label: 'Find Information', key: 'search', type:'default', icon: <SearchOutlined /> }
                ]}
                onClick={onClickMenu}
            />
            <hr/>
            <div className="flex-item" style={{ display: current == 'assist' ? 'block' : 'none' }}>
                <Card title="Need Technical Assistance?" bordered={true} style={{ width: '100%' }}>
                    <AWGetAssistance />
                </Card>
            </div>

            <div className="flex-item" style={{ display: current == 'search' ? 'block' : 'none' }}>
                <Card title="Find Information" bordered={true} style={{ width: '100%' }}>
                    <Button type="primary" size='large' >
                        Search For Information
                    </Button>
                    <br />
                    Search for information on crop water use, irrigations systems, groundwater and other agricultural products
                </Card>
            </div>

            <div className="flex-item" style={{ display: current == 'dashboards' ? 'block' : 'none' }}>
                <Card title="Dashboards" bordered={true} style={{ height: '100%' }}>
                    <img src={DashboardImage} style={{ width: '100%', maxWidth: 320 }} />
                    <p>A set of <b>dashboards</b> that show, for individual counties,
                        a set of metrics reflecting current/ recent past measurements related
                        to agricultural water use.</p>

                    <Link to="/dashboards" >View Dashboards</Link>

                </Card>
            </div>

            <div className="flex-item" style={{ display: current == 'theTeam' ? 'block' : 'none' }}>
                <Card title="Meet the Team" bordered={true}>
                    <AWTeam team='agtap' />
                </Card>
            </div>

        </div>
    )
}


export default AgTAP;

