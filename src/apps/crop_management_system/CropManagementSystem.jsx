import { useState } from "react";
import { Form, Tabs, Button, Typography } from "antd";

import "./CropManagementSystem.css"; // Assuming you have a CSS file for styles

import Start from "./Start";
import FieldDefinition from "./FieldDefinition"
import CropDetails from "./CropDetails";
import Management from "./Management";
import Outcomes from "./Outcomes";

const { Title } = Typography;

import { CaretRightOutlined } from '@ant-design/icons';
import { CaretLeftOutlined } from '@ant-design/icons';
//import { RightCircleFilled } from '@ant-design/icons';
//import { LeftCircleFilled } from '@ant-design/icons';

const NUM_TABS = 4



//const circleIconStyle = { fontSize: "2rem", color: "#1677FF", marginLeft: "1rem", marginRight: "1rem", cursor: "pointer" };

const CropManagementSystem = () => {

    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState(1);
    const [start, setStart] = useState(true);


    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        //console.log(form);
    };


    return (

            <div className="crop-management-system">
c                {
                    start ? (
                        <Start setStart={setStart} />
                    ) : (
                        <>
                            <p>Manage your crops effectively with our Crop Management System. Fill in the details below to get started.</p>

                            <p>Use the tabs to navigate through different sections:</p>

                            <Form layout="vertical"
                                form={form}
                                onFinish={handleSubmit}
                                style={{ width: "100%", color:'white' }}
                                initialValues={{}}
                            >
                                <Tabs
                                    activeKey={activeTab}
                                    moreIcon={null}
                                    onTabClick={(key) =>
                                        setActiveTab(key)
                                    }
                                    items={[
                                        {
                                            label: 'Field Definition',
                                            key: 1,
                                            children: <FieldDefinition form={form} />
                                        },
                                        {
                                            label: 'Crop Details',
                                            key: 2,
                                            children: <CropDetails form={form} />
                                        },
                                        {
                                            label: 'Management Practices',
                                            key: 3,
                                            children: <Management form={form} />
                                        },
                                        {
                                            label: 'Outcomes',
                                            key: '4',
                                            children: <Outcomes form={form} />
                                        },
                                    ]}
                                />
                                <Form.Item style={{ textAlign: "center", marginTop: 24 }}>
                                    <Button type="primary" className='button' onClick={() => setActiveTab(activeTab - 1)} disabled={activeTab === 1} ><CaretLeftOutlined />Previous</Button>
                                    <Button type="primary" className='button' onClick={() => setActiveTab(activeTab + 1)} disabled={activeTab === NUM_TABS}>Next<CaretRightOutlined /></Button>
                                    <Button type="primary" htmlType="submit" className='button'> Save Nutrient Plan </Button>
                                </Form.Item>

                            </Form>
                        </>
                    )
                }
            </div>

    );
};

export default CropManagementSystem;