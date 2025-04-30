import { useState } from 'react';
import { Row, Col, Divider, Card } from 'antd';

import AWFactSheets from "../../components/fact_sheets/AWFactSheets";
import AWArticles from '../../components/articles/AWArticles';

import AWButtonContainer from '../../components/button_container/AWButtonContainer.jsx';
import { FileDoneOutlined, FileImageOutlined } from '@ant-design/icons';
<FileDoneOutlined />

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
            <div className='content-container'>
                <div className='content-container-header'>Resources</div>
                <p style={{}}> Articles, Factsheets and Other Information about Agricultural Water Management</p>
                <AWButtonContainer
                    items={[
                        { label: 'Articles', key: 'articles', type: 'primary', icon: <FileImageOutlined /> },
                        { label: 'Fact Sheets', key: 'factsheets', icon: <FileDoneOutlined /> }
                    ]}
                    onClick={onClickMenu}
                />
                <hr />

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

