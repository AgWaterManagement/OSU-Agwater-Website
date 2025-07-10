import { useState } from "react";
import { Form, Input, Button, Select, Checkbox, DatePicker, Card, Typography, message, Tabs, Row, Col } from "antd";

import { CaretRightOutlined } from '@ant-design/icons';
import { CaretLeftOutlined } from '@ant-design/icons';
import { RightCircleFilled } from '@ant-design/icons';
import { LeftCircleFilled } from '@ant-design/icons';

import './VegNutrientPlan.css';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const FERTILIZER_OPTIONS = [
    "Certified Organic",
    "Organic (not necessarily certified)",
    "Only fertilizers made on my farm",
    "Conventional/Synthetic",
    "Other"
];

const cardStyle = {
    maxWidth: '1800px',
    margin: "2rem auto",
    padding: "1rem",
    boxSizing: "border-box",
    width: "100%",
};

const buttonStyle = {
    fontSize: "1.0rem",
    padding: "1.20rem",
    margin: "1.0em",
};

const circleIconStyle = { fontSize: "2rem", color: "#1677FF", marginLeft: "1rem", marginRight: "1rem", cursor: "pointer" };

const tabBarStyle = {
    marginBottom: 24,
};

const VegNutrientPlan = () => {

    const [fertilizerOther, setFertilizerOther] = useState("");
    const [fertilizerChecked, setFertilizerChecked] = useState([]);
    const [start, setStart] = useState(true);
    const [activeTab, setActiveTab] = useState(1);
    const [form] = Form.useForm();

    const onFertilizerChange = (checkedValues) => {
        setFertilizerChecked(checkedValues);
    };

    const onFinish = (values) => {
        message.success("Nutrient plan saved!");
        // You can POST values to your API here
        // console.log(values);
    };


    return (
        <div className="content-container" style={{ maxWidth: "90%" }}>
            <div style={{ textAlign: "center", fontSize: "2.0rem" }}>
                Vegetable Nutrient Management Planning Tool
            </div>

            {
                start ? (
                    <>

                        <div style={{ fontSize: "1rem" }}>
                            <h4>Using your Nutrient Management Plan: </h4>

                            <p>Developing a nutrient management strategy for your farm is an iterative process that involves some
                                trial and error. Your nutrient management plan will likely change from year to year as conditions
                                change and you gain more experience.  Note that this nutrient management plan focuses on
                                soil pH, EC (salinity), and plant-essential macronutrients (nitrogen, phosphorus, potassium,
                                sulfur, calcium, and magnesium). Managing plant-essential micronutrients are also an important
                                part of developing a nutrient management plan for your farm; once you’ve dialed in your
                                management of the soil test components in this nutrient management plan,
                                we encourage you to include micronutrients in your nutrient management plan as well.
                            </p>

                            <p>The guide is most helpful if you keep it, refer to it regularly, and amend your soil based on the plans
                                you make. It’s good practice to take a soil test
                                every ~2 years to see whether your nutrient management plan is working and creating the changes
                                in your soil that you’re working towards. We recommend creating a new nutrient management plan
                                based on your updated soil tests. If you’d like to use or adapt the template for this nutrient
                                management plan in the future, you can find it here: <a href="https://beav.es/VegNMPlan" target="_blank" rel="noopener noreferrer">Vegetable Nutrient Management Plan Template</a>. If you also manage
                                pasture and would like to develop a nutrient management plan for your pasture, you can find the
                                template for that here: <a href="https://beav.es/PastureNMPlan" target="_blank" rel="noopener noreferrer">Pasture Nutrient Management Plan Template</a>.
                            </p>

                            <p>If you have questions about this guide or your nutrient management plan, don’t hesitate to reach out to OSU Small Farms & Community Horticulture Extension Agent Evie Smith- evie.smith@oregonstate.edu.</p>

                            <p>Resources you'll use to fill out this nutrient management plan:</p>
                            <ul>
                                <li>
                                    <a href="https://extension.oregonstate.edu/catalog/pub/em-9057-applying-lime-raise-soil-ph-crop-production-western-oregon" target="_blank" rel="noopener noreferrer">
                                        Applying Lime to Raise Soil pH for crop production (OSU Extension Publication)
                                    </a>
                                </li>
                                <li>
                                    <a href="https://extension.oregonstate.edu/catalog/pub/em-9165-nutrient-management-sustainable-vegetable-cropping-systems-western-oregon" target="_blank" rel="noopener noreferrer">
                                        Nutrient Management for Sustainable Vegetable Cropping Systems in Western Oregon (OSU Extension Publication)
                                    </a>
                                </li>
                                <li>
                                    <a href="https://extension.oregonstate.edu/educational-document/updated-lime-requirement-recommendations-oregon" target="_blank" rel="noopener noreferrer">
                                        Updated Lime Requirement Recommendations for Oregon (OSU Extension Publication)
                                    </a>
                                </li>
                                <li>
                                    <a href="https://extension.oregonstate.edu/catalog/pub/pnw-601-managing-salt-affected-soils-crop-production" target="_blank" rel="noopener noreferrer">
                                        Managing Salt-Affected Soils for Crop Production (OSU Extension Publication)
                                    </a>
                                </li>
                                <li>
                                    <a href="https://extension.oregonstate.edu/catalog/pub/pnw-780-nutrient-management-raspberries-blackberries-oregon-washington" target="_blank" rel="noopener noreferrer">
                                        Nutrient Management of Raspberries and Blackberries in Oregon (OSU Extension Publication)
                                    </a>
                                </li>
                                <li>
                                    <a href="https://extension.oregonstate.edu/catalog/pub/pnw-636-estimating-plant-available-nitrogen-release-cover-crops" target="_blank" rel="noopener noreferrer">
                                        Estimating Plant-Available N Release from Cover Crops (OSU Extension Publication)
                                    </a>
                                </li>
                                <li>
                                    <a href="https://beav.es/VegPAN" target="_blank" rel="noopener noreferrer">
                                        PAN Requirement for Vegetable Crops (from OSU Course Organic Nutrient Management for Vegetable Crops)
                                    </a>
                                </li>
                                <li>
                                    <a href="https://s3.wp.wsu.edu/uploads/sites/2074/2019/01/Soil-Fertility-in-Organic-Systems-1.pdf" target="_blank" rel="noopener noreferrer">
                                        Soil Fertility in Organic Systems: A Guide for Gardeners and Small Acreage Farmers (WSU Extension Publication)
                                    </a>
                                </li>
                                <li>
                                    <a href="https://extension.oregonstate.edu/catalog/pub/ec-1478-soil-test-interpretation-guide" target="_blank" rel="noopener noreferrer">
                                        Soil Test Interpretation Guide (OSU Extension Publication)
                                    </a>
                                </li>
                                <li>
                                    <a href="https://beav.es/VegCaMg" target="_blank" rel="noopener noreferrer">
                                        Assessing Test Results for Calcium and Magnesium (from OSU Course Organic Nutrient Management for Vegetable Crops)
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div style={{ textAlign: "center", fontSize: "1.2rem", marginTop: "1.5em" }}>
                            <Button type="primary" style={buttonStyle} onClick={() => setStart(false)}>
                                Start the Vegetable Nutrient Management Planning Tool
                            </Button>
                        </div>
                    </>
                ) : (
                    <Row justify="center" style={{ margin: 0 }}>
                        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
                            <Card style={cardStyle}>
                                <Title level={3} style={{ textAlign: "center", fontSize: "1.5rem" }}>
                                   Vegetable Nutrient Management Plan
                                </Title>
                                <div style={{ textAlign: "center", fontSize: "1.2rem" }}>
                                    <LeftCircleFilled style={circleIconStyle} onClick={() => { if (activeTab > 1) setActiveTab(activeTab - 1) }} disabled={activeTab === 1} />
                                    <RightCircleFilled style={circleIconStyle} onClick={() => { if (activeTab < 10) setActiveTab(activeTab + 1) }} disabled={activeTab === 10} />
                                </div>

                                <Form
                                    layout="vertical"
                                    form={form}
                                    onFinish={onFinish}
                                    initialValues={{
                                        fertilizer: [],
                                    }}
                                    style={{ width: "100%" }}
                                >
                                    <Tabs
                                        activeKey={activeTab.toString()}
                                        type="card"
                                        tabBarStyle={tabBarStyle}
                                        tabPosition="top"
                                        centered={false}
                                        size="small"
                                        moreIcon={null}
                                        style={{ width: "100%" }}
                                        destroyInactiveTabPane
                                        onTabClick={(key) => setActiveTab(Number(key))}
                                    >
                                        <TabPane tab="Basic Info" key={1}>
                                            <Form.Item label="Today's date" name="date">
                                                <DatePicker style={{ width: "100%" }} />
                                            </Form.Item>
                                            <Form.Item label="Crop(s) focus of this nutrient management plan" name="crops">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Are you growing this/these crop(s) outdoors or in a high tunnel/greenhouse?" name="environment">
                                                <Select>
                                                    <Select.Option value="outdoors">Outdoors</Select.Option>
                                                    <Select.Option value="high_tunnel">High Tunnel/Greenhouse</Select.Option>
                                                </Select>
                                            </Form.Item>
                                            <Form.Item label="What acreage of this crop/these crops are you growing, approximately? 
                                                (This will help you calculate your fertilizer application rate.) 
                                                This may be in acres or square feet, depending on the size of your farm." name="acreage">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Is your crop already established? Or have you already planted this year?" name="established">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Are your crops irrigated?" name="irrigated">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Approximate date for next soil test (Hint: at most ~2 years from your current soil test)" name="next_soil_test">
                                                <DatePicker style={{ width: "100%" }} />
                                            </Form.Item>
                                        </TabPane>
                                        <TabPane tab="Fertilizers" key="2">
                                            <Form.Item label="Which of the following best describes the kind(s) of fertilizers you plan to use in your crops? (Select all that apply)" name="fertilizer">
                                                <Checkbox.Group options={FERTILIZER_OPTIONS} onChange={onFertilizerChange} />
                                            </Form.Item>
                                            {fertilizerChecked.includes("Other") && (
                                                <Form.Item label="Other fertilizer (describe)" name="fertilizer_other">
                                                    <Input value={fertilizerOther} onChange={e => setFertilizerOther(e.target.value)} />
                                                </Form.Item>
                                            )}
                                            <Form.Item label="Is there anything else you'd like to record about the fertilizers you plan to use on your farm?" name="fertilizer_notes">
                                                <TextArea rows={2} />
                                            </Form.Item>
                                            <Form.Item label="What nutrient application equipment is available on your farm" name="equipment">
                                                <Input />
                                            </Form.Item>
                                        </TabPane>
                                        <TabPane tab="pH & Liming" key="3">
                                            <Form.Item label={
                                                <span>What lime source(s) will/might/could you use? <br /> 
                                                    (See Page 7 of <a href="https://extension.oregonstate.edu/catalog/pub/em-9057-applying-lime-raise-soil-ph-crop-production-western-oregon" 
                                                    target="_blank" rel="noopener noreferrer">
                                                    Applying Lime to Raise Soil pH for Crop Production</a>
                                                    )</span>
                                                } name="lime_source">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label={
                                                <span>If you’re not sure, what resources could you use to help decide the lime source? <br />
                                                (See Table 1 of <a href="https://extension.oregonstate.edu/catalog/pub/em-9057-applying-lime-raise-soil-ph-crop-production-western-oregon" target="_blank" rel="noopener noreferrer">
                                                    Applying Lime to Raise Soil pH for Crop Production</a>)
                                                </span>} name="lime_resources">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="What is the pH of the soil you sampled?" name="soil_ph">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="What is the buffer pH of the soil you sampled?" name="buffer_ph">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="What is the target soil pH for your crops?" name="target_ph">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="How much lime (100 lime score) needs to be applied to reach the target pH?" name="lime_needed">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Will you be tilling or top-dressing lime?" name="lime_application">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="If top-dressing, how much lime this year?" name="lime_topdress">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="When will you apply lime?" name="lime_time">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Other notes about lime applications" name="lime_notes">
                                                <TextArea rows={2} />
                                            </Form.Item>
                                        </TabPane>
                                        <TabPane tab="Soluble Salts (EC)" key="4">
                                            <Form.Item label="Electrical Conductivity (EC) of your soil" name="ec">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Does your soil need to be treated for high soluble salts?" name="ec_treatment">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Other notes about soluble salts" name="ec_notes">
                                                <TextArea rows={2} />
                                            </Form.Item>
                                        </TabPane>
                                        <TabPane tab="Nitrogen (N)" key="5">
                                            <Form.Item label="Nitrogen source(s)" name="n_source">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Resources to help decide N source" name="n_resources">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Are your crops low, medium, or high N feeders?" name="n_feeder">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="How much PAN is needed?" name="n_pan">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Where will you apply N?" name="n_place">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="When will you apply N?" name="n_time">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Do you want nitrate testing this season?" name="nitrate_testing">
                                                <Select>
                                                    <Select.Option value="yes">Yes</Select.Option>
                                                    <Select.Option value="no">No</Select.Option>
                                                    <Select.Option value="maybe">Maybe</Select.Option>
                                                </Select>
                                            </Form.Item>
                                            <Form.Item label="If so, when?" name="nitrate_testing_when">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Lab or extension office for nitrate test?" name="nitrate_testing_where">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Other notes about N applications" name="n_notes">
                                                <TextArea rows={2} />
                                            </Form.Item>
                                        </TabPane>
                                        <TabPane tab="Phosphorus (P)" key="6">
                                            <Form.Item label="Phosphorus source(s)" name="p_source">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Resources to help decide P source" name="p_resources">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="How much phosphorus in soil (Bray P test)?" name="p_soil">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="How much P should be applied (total)?" name="p_needed">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Where will you apply P?" name="p_place">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="When will you apply P?" name="p_time">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Other notes about P applications" name="p_notes">
                                                <TextArea rows={2} />
                                            </Form.Item>
                                        </TabPane>
                                        <TabPane tab="Potassium (K)" key="7">
                                            <Form.Item label="Potassium source(s)" name="k_source">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Resources to help decide K source" name="k_resources">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="How much potassium in soil?" name="k_soil">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="How much K should be applied (total)?" name="k_needed">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Where will you apply K?" name="k_place">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="When will you apply K?" name="k_time">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Other notes about K applications" name="k_notes">
                                                <TextArea rows={2} />
                                            </Form.Item>
                                        </TabPane>
                                        <TabPane tab="Sulfur (S)" key="8">
                                            <Form.Item label="Sulfur source(s)" name="s_source">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Resources to help decide S source" name="s_resources">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Have you applied S in last 2 years?" name="s_applied">
                                                <Select>
                                                    <Select.Option value="yes">Yes</Select.Option>
                                                    <Select.Option value="no">No</Select.Option>
                                                </Select>
                                            </Form.Item>
                                            <Form.Item label="How much S should be applied (total)?" name="s_needed">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Where will you apply S?" name="s_place">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="When will you apply S?" name="s_time">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Other notes about S applications" name="s_notes">
                                                <TextArea rows={2} />
                                            </Form.Item>
                                        </TabPane>
                                        <TabPane tab="Calcium (Ca)" key="9">
                                            <Form.Item label="Calcium source(s)" name="ca_source">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Resources to help decide Ca source" name="ca_resources">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="How much calcium in soil?" name="ca_soil">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="How much Ca should be applied (total)?" name="ca_needed">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Where will you apply Ca?" name="ca_place">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="When will you apply Ca?" name="ca_time">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Other notes about Ca applications" name="ca_notes">
                                                <TextArea rows={2} />
                                            </Form.Item>
                                        </TabPane>
                                        <TabPane tab="Magnesium (Mg)" key="10">
                                            <Form.Item label="Magnesium source(s)" name="mg_source">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Resources to help decide Mg source" name="mg_resources">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="How much magnesium in soil?" name="mg_soil">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="How much Mg should be applied (total)?" name="mg_needed">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Where will you apply Mg?" name="mg_place">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="When will you apply Mg?" name="mg_time">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Other notes about Mg applications" name="mg_notes">
                                                <TextArea rows={2} />
                                            </Form.Item>
                                        </TabPane>
                                    </Tabs>
                                    <Form.Item style={{ textAlign: "center", marginTop: 24 }}>
                                        <Button type="primary" style={buttonStyle} onClick={() => setActiveTab(activeTab - 1)} disabled={activeTab === 1} ><CaretLeftOutlined />Previous</Button>
                                        <Button type="primary" style={buttonStyle} onClick={() => setActiveTab(activeTab + 1)} disabled={activeTab === 10}>Next<CaretRightOutlined /></Button>
                                        <Button type="primary" htmlType="submit" style={buttonStyle}> Save Nutrient Plan </Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                )}

        </div>
    );
};

export default VegNutrientPlan