import './Tools.css'
import { Children, isValidElement, useMemo, useState } from 'react';
import { Row, Col, Card, Button, Tag, Space, Input, Empty, Checkbox } from 'antd';
import { ToolOutlined, ExperimentOutlined, CheckOutlined } from '@ant-design/icons';

const extractText = (node) => {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join(' ');
  }

  if (isValidElement(node)) {
    return extractText(node.props.children);
  }

  return Children.toArray(node).map(extractText).join(' ');
};


const imagePath = 'https://agwater.org/images/'

const toolsData = [
      {
        title: 'Ag Water Chatbot',
        description: (<><img src={imagePath + 'Farmer_Talking_To_AI.png'} alt='Ag Water Chatbot' width={360} />This tool provides access to a
                  large language model (AI) trained specifically to answer questions about agricultural water managment in the 
                  Pacific Northwest.  Ask it, in plain English, anything you want to know about agricultural water 
                  management in the region. <br/><br/>
                  <strong>A caveat:</strong> this is an experimental tool and may not always provide accurate information.
                  Your feedback is welcomed!</>),
        keywords: ['AI', 'water', 'agriculture', 'chatbot', 'large language model'],
        link: '/chat',
        status: 'experimental',
      },
      {
        title: 'Agricultural Financial Program Directory',
        description: (<><img src={imagePath + 'funding.jpg'} alt='Agricultural Financial Program Directory' width={360}/>
          This tool provides information on agricultural financial programs available in Oregon and the Pacific Northwest,
          including grants, loans, and other funding opportunities. It allows users to explore the data 
          by program type, specify alternative eligibility criteria, get details on the availability
          of these programs, and access additional information about the programs.</>),
        keywords: ['agricultural finance', 'financial programs', 'grants', 'loans', 'funding opportunities'],
        link: '/funding',
        status: 'live'
      },
      {
        title: 'Protected Waters of the US',
        description: (<><img src={imagePath + 'Tidal-Creek-in-Salt-Marsh-688.jpg'} alt='Protected Waters' width={360}/>
                    This tool provides information on the extent of protected waters in the United States, 
                    including streams and wetlands, based on the Clean Water Act. It allows users to explore
                    the data by state and water type, specify alternative protection criteria, 
                    and visualize, in charts, tables, and maps, the protection status of these waters.</>),
        keywords: ['protected waters', 'Clean Water Act', 'streams', 'wetlands', 'water quality'],
        link: '/apps/wotus',
        status: 'live'
      },
      {
        title: 'Water Calculators',
        description: (<><img src={imagePath + 'WaterCalculator.png'} alt='Water Calculators' width={360} />This tool provides a numbers of calculators
        for water-related calculations. It includes tools for estimating water usage, irrigation needs, and other water management metrics.</>),
        keywords: ['water calculation', 'irrigation', 'water usage', 'estimation'],
        link: '/pages/calculators',
        status: 'live'
      },
      {
        title: 'Crop Water Use in Oregon',
        description: (<><img src={imagePath + 'OIP-2795785401.jpg'} alt='Crop Water Use' width={360} />This tool provides information on crop water
                     use in Oregon, including data on irrigation practices and water
                     consumption patterns. It summarizes crop water use information from over 250 thousand fields in Oregon,
                     from the period 1983 to 2022. The summarized data include crop-specific and location-specific crop water use patterns, 
                     precipitation, monthly crop coefficient (Kc) values, and seasonal crop water use estimates for 95 crops grown in Oregon.</>),
        keywords: ['crop water use', 'Oregon', 'irrigation', 'water consumption'],
        link: '/apps/oregonCropWaterUse',
        status: 'under_development'
      },
      {
        title: 'Agrimet Portal',
        description: (<><img src={imagePath + 'drpw1.jpg'} alt='Agrimet Portal' width={360} />
              This tool provides access to the Bureau of Land Management&apos;s (BLM) Agrimet data.  Agrimet is 
              a network of agricultural weather stations located throughout the Western United States, providing data on precipitation, 
              temperature, soil moisture, and other variables relevant to agricultural water management. 
              The Agrimet Portal allows users to explore and visualize this data, and provides tools for analyzing and interpreting the data for agricultural water management applications.
        </>),
        keywords: ['Agrimet', 'BLM', 'weather', 'crop water use', 'Oregon', 'irrigation', 'water consumption'],
        link: '/apps/agrimet',
        status: 'under_development'
      },
      {
        title: 'Managing Drought In Oregon',
        description: (<><img src={imagePath + 'OIP-1495046469.jpg'} alt='Managing Drought' width={360} />This tool provides information on drought
         management strategies in Oregon, including data on precipitation, soil moisture, and water availability.
          It allows users to explore the data by region and time period, and provides visualizations
          and summaries of the drought conditions and impacts.</>),
        keywords: ['drought', 'Oregon', 'precipitation', 'soil moisture', 'water availability'],
        link: '/apps/drought',
        status: 'under_development'
      },
      {
        title: 'OSU Irrigation Scheduler',
        description: (<><img src={imagePath + 'FMS/FarmerWithTablet.png'} alt='Irrigation Scheduler' width={360} />This tool provides field-level irrigation scheduling support for
          farmers and irrigation managers in the Pacific Northwest. It uses data on field characteristics, weather forecasts, and crop water use history to provide recommendations on when and how much to irrigate.</>),
        keywords: ['irrigation scheduling', 'soil moisture', 'weather forecasts', 'crop water use'],
        link: '/fms',
        status: 'under_development'
      },
      {
        title: 'ODA Ag Water Quality Planner',
        description: (<><img src={imagePath + 'AgWaterQuality.png'} alt='Water Quality TMDL Planning' width={360} />This tool, developed in partnership with the Oregon Department of Agriculture,
        generates site-specific water quality assessments and provides localized recommendations of farming practices to allow landowners to meet TMDL requirements, reduce pollutant loads and improve water quality.</>),
        keywords: ['water quality', 'TMDL', 'pollutant loads', 'water quality standards'],
        link: '/apps/agWqPlan',
        status: 'under_development'
      },

    ];


const ToolTable = ({showUnderDevelopment = false, searchTerm = '', maxTools = -1}) => {
  //const [searchTerm, setSearchTerm] = useState('');
  //const [showUnderDevelopment, setShowUnderDevelopment] = useState(false);

  const filteredTools = useMemo(() => {
    //const term = searchTerm.trim().toLowerCase();

    return toolsData.filter((tool) => {
      if (!showUnderDevelopment && tool.status === 'under_development') return false;
      
      const term = searchTerm.trim().toLowerCase();
      if (term === '') return true;
      
      const titleText = tool.title?.toLowerCase() || '';
      const descriptionText = extractText(tool.description).toLowerCase();
      const keywordsText = (tool.keywords || []).join(' ').toLowerCase();

      return titleText.includes(term)
        || descriptionText.includes(term)
        || keywordsText.includes(term);
    });
  }, [searchTerm, showUnderDevelopment]);

  return (
    <div className='content-container' >

      <Row gutter={[16, 16]}>
        {filteredTools.map((tool, index) => (
          maxTools < 0 || index < maxTools ? (
          <Col key={index} xs={24} sm={12} lg={8} style={{ display: 'flex' }}>
            <Card
              title={tool.title}
              extra={<Button type="primary" size="small" href={tool.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Go to Tool</Button>}
              style={{ width: '100%', height: '100%', cursor: 'pointer' }}
              onClick={() => window.open(tool.link, '_blank', 'noopener,noreferrer')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ minHeight: '12em' }}>
                  {tool.description}
                  {tool.status === 'under_development' && ( <> <br/><br/>
                    <span style={{ marginLeft: 8, color: '#e83c11', fontWeight: 600 }}>
                      Status: &nbsp;&nbsp;
                      <ToolOutlined style={{ marginRight: 6 }} />
                      Under development
                    </span>
                    </>
                  )}
                  {tool.status === 'live' && ( <> <br/><br/>
                    <span style={{ marginLeft: 8, color: '#52c41a', fontWeight: 600 }}>
                      Status: &nbsp;&nbsp;
                      <CheckOutlined style={{ marginRight: 6 }} />
                      Live
                    </span>
                  </> )}
                  {tool.status === 'experimental' && ( <> <br/><br/>
                    <span style={{ marginLeft: 8, color: '#1890ff', fontWeight: 600 }}>
                      Status: &nbsp;&nbsp;
                      <ExperimentOutlined style={{ marginRight: 6 }} />
                      Experimental
                    </span>
                  </> )}

                </div>
                {tool.keywords?.length > 0 && (
                  <Space size={[4, 4]} wrap style={{ marginTop: 12 }}>
                    {tool.keywords.map(kw => (
                      <Tag key={kw}>{kw}</Tag>
                    ))}
                  </Space>
                )}
              </div>
            </Card>
          </Col>
        ) : null
      ))}

        {filteredTools.length === 0 && (
          <Col span={24}>
            <Empty description="No tools match your search." />
          </Col>
        )}
      </Row>



    </div>
  );
};

export default ToolTable;

