import { useState } from 'react';

import { Typography } from 'antd';
import { SearchOutlined, QuestionCircleOutlined, PicRightOutlined } from '@ant-design/icons';
import AgTapProjects from '../project_map/AgTapProjects.jsx';


import './AgTAP.css';

import AWButtonContainer from '../../components/button_container/AWButtonContainer.jsx';
import AWGetAssistance from './ATGetAssistance.jsx';

import Chat from '../../pages/chat/Chat.jsx';

const { Title, Paragraph } = Typography;

const AgTAP = () => {

    const [current, setCurrent] = useState('search');

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
        <div style={{ margin: '1.5em' }}>

            <Title level={3}>OSU&apos;s Agricultural Water Technical Assistance Program</Title>
            <AWButtonContainer
                items={[
                    { label: 'Find Information', key: 'search', type: 'primary', icon: <SearchOutlined /> },
                    { label: 'Request Assistance', key: 'assist', type: 'default', icon: <QuestionCircleOutlined /> },
                    { label: 'Project Map', key: 'projectMap', type: 'default', icon: <PicRightOutlined /> }
                ]}
                onClick={onClickMenu}
            />
            <hr />

            <div className="flex-item" style={{ display: current == 'search' ? 'block' : 'none' }}>
                <Chat />
            </div>

            <div className="flex-item" style={{ display: current == 'assist' ? 'block' : 'none' }}>
                <AWGetAssistance />
            </div>

            <div className="flex-item" style={{ display: current == 'projectMap' ? 'block' : 'none' }}>
                <AgTapProjects />
            </div>

            {/*}
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
                */}

        </div>
    )
}


export default AgTAP;

