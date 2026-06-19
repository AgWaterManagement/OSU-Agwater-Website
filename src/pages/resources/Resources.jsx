import { useState } from 'react';

import AWFactSheets from "../../components/fact_sheets/AWFactSheets";
import AWArticles from '../../components/articles/AWArticles';

import AWButtonContainer from '../../components/button_container/AWButtonContainer.jsx';
import { Typography, Divider } from 'antd';
import { FileDoneOutlined, FileImageOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Resources = () => {

    const [current, setCurrent] = useState('articles');

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
        <>
            <div style={{padding: '1em'}}>
                    <Title level={2}>Resources</Title>
                    <Paragraph className='intro-text'> Articles, Factsheets and Other Information about Agricultural Water Management</Paragraph>
                    <AWButtonContainer
                        items={[
                            { label: 'Articles', key: 'articles', type: 'primary', icon: <FileImageOutlined /> },
                            { label: 'Fact Sheets', key: 'factsheets', icon: <FileDoneOutlined /> }
                        ]}
                        onClick={onClickMenu}
                    />
                    <Divider />

                {current == 'articles' && (
                    <AWArticles showFilters={true} showSearch={true} ></AWArticles>
                )}

                {current == 'factsheets' && (
                     <AWFactSheets />
                )}


            </div>

        </>
    )
}


export default Resources;

