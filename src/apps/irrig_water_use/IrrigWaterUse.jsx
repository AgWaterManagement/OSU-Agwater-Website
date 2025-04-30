//import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import { Row, Col, Segmented, Slider, Steps, Button } from 'antd'
import IrrigUseMap from '../irrig_water_use/IrrigUseMap';

import { CaretRightOutlined } from '@ant-design/icons';
import state_bboxes from './stateBoundingBoxes.json';



const IrrigWaterUse = () => {

  const [metric, setMetric ] = useState('gwd_total');
  const [year, setYear ] = useState(2008);
  const [field, setField ] = useState('gwd_total_2008');
  const [fipsCode, setFIPSCode ] = useState(41)
  const [ stateGeoJsonURL, setStateGeoJsonURL ] = useState('/articles/IrrigWaterUse/data/ST' + fipsCode + '_IrrigUseByCounty.geojson');
  const cropOptions = ['Corn'];

  //const usDataURL = '/irrig_water_use/data/US_IrrigUseByState.json';
  const usDataURL = '/articles/IrrigWaterUse/data/US_IrrigUseByState.geojson';

  const yearOptions = {};
  for (let i = 2008; i < 2021; i++) {
    yearOptions[i] = i.toFixed(0);
  }

  const metricOptions = [
    { label: (<div>Surface<br/>Withdrawals</div>), value: "sw_total" },
    { label: (<div>Groundwater<br/>Withdrawals</div>), value: "gww_total" },
    { label: (<div>Total Irrigation<br/>Withdrawals</div>), value: "total" },
    { label: (<div>Groundwater<br/>Depletion</div>), value: "gwd_total" }];


  const stateOptions = [
    { label: "Alabama", value: "1" },
    { label: "Alaska", value: "2" },
    { label: "Arizona", value: "4" },
    { label: "Arkansas", value: "5" },
    { label: "California", value: "6" },
    { label: "Colorado", value: "8" },
    { label: "Connecticut", value: "9" },
    { label: "Delaware", value: "10" },
    { label: "Florida", value: "12" },
    { label: "Georgia", value: "13" },
    { label: "Hawaii", value: "15" },
    { label: "Idaho", value: "16" },
    { label: "Illinois", value: "17" },
    { label: "Indiana", value: "18" },
    { label: "Iowa", value: "19" },
    { label: "Kansas", value: "20" },
    { label: "Kentucky", value: "21" },
    { label: "Louisiana", value: "22" },
    { label: "Maine", value: "23" },
    { label: "Maryland", value: "24" },
    { label: "Massachusetts", value: "25" },
    { label: "Michigan", value: "26" },
    { label: "Minnesota", value: "27" },
    { label: "Mississippi", value: "28" },
    { label: "Missouri", value: "29" },
    { label: "Montana", value: "30" },
    { label: "Nebraska", value: "31" },
    { label: "Nevada", value: "32" },
    { label: "New Hampshire", value: "33" },
    { label: "New Jersey", value: "34" },
    { label: "New Mexico", value: "35" },
    { label: "New York", value: "36" },
    { label: "North Carolina", value: "37" },
    { label: "North Dakota", value: "38" },
    { label: "Ohio", value: "39" },
    { label: "Oklahoma", value: "40" },
    { label: "Oregon", value: "41" },
    { label: "Pennsylvania", value: "42" },
    { label: "Rhode Island", value: "44" },
    { label: "South Carolina", value: "45" },
    { label: "South Dakota", value: "46" },
    { label: "Tennessee", value: "47" },
    { label: "Texas", value: "48" },
    { label: "Utah", value: "49" },
    { label: "Vermont", value: "50" },
    { label: "Virginia", value: "51" },
    { label: "Washington", value: "53" },
    { label: "West Virginia", value: "54" },
    { label: "Wisconsin", value: "55" },
    { label: "Wyoming", value: "56" }];

    useEffect(() => {
        setStateGeoJsonURL('/articles/IrrigWaterUse/data/ST' + fipsCode + '_IrrigUseByCounty.geojson');
    }, [fipsCode]);



  function onChangeMetric(val) {
    console.log('selected ' + val)
    setMetric(val);
    console.log('Setting field to ' + val + '_' + year)
    setField(val + '_' + year);
  }

  function onChangeYear(val) {
    console.log('selected ' + val)
    setYear(val);
    console.log('Setting field to ' + metric + '_' + val)
    setField(metric + '_' + val);
  }

  function runVideo(){

    }

    function SelectState(e) {
        const feature = e.target.feature;
        const fid = feature.properties.STATEFP;
        console.log("state-clicked:");
        console.log(fid);
        setFIPSCode(fid);
    }


  
  return (
    <>
      <div className="aw-dark-bg" style={{ margin: 0, padding: '1em' }}>
        <h2 className="aw-light-accent-text">Irrigation Water Use in the United States</h2>
        <span>John Bolte, Professor, Biological &amp; Ecological Engineering, Oregon State University</span>
        <br />
      </div>


      {/*
      <Row>
        <Col span={16}>
          <p>
            Irrigation is vital to food and fiber production, particularly in areas that
            experience water limitations.  Irrigation is typically drawn from either surface waters
            (from rivers, lakes, or reservoirs) and groundwater (stored beneath the Earth&apos;s surface in aquifers.)
            Globally, about 43% of the world&apos;s irrigated area relies on groundwater; however, both the total amount of irrigation
            withdrawals, and the amount drawn from either surface or groundwater.
            <br />
            <br />
            Since 1890, irrigated acreage in the U.S. has expanded from less than 3 million acres to over 58 million acres in 2017. Federal, state, and local water
            development projects, along with innovations in groundwater pumping technologies, have contributed to this growth.
            Recent trends show improved efficiency in water application technologies, leading to a decline in water use per acre
            irrigated. Changing cropping patterns and regional shifts also influence irrigation practices¹.
            <br />
            <br />
            A recent analysis by Ruess, Konar, Wanders, Bierkens (2024),
            <a href="https://doi.org/10.1038/s41597-024-03244-w">
              Irrigation by crop in the Continental United States from 2008 to 2020
            </a> produced a new database of irrigation water withdrawals by crop, county, year, and water source within
            the United States. They used a <a href="https://doi.org/10.1029/2022WR032804">previously developed approach</a>
            combining crop mapping, evapotranspiration estimates, and groundwater data to develop this new dataset.
            This dataset has nearly 2.5 million data points (3,142 counties; 13 years; 3 water sources;
            and 20 crops) across the US.  An interactive viewer for this data is provided below.

          </p>
        </Col>
        <Col>
          <span style={{float:'right',width:'35%'}}>
            <img src="https://agupubs.onlinelibrary.wiley.com/cms/asset/513b4de2-762d-464a-af52-8f6513464d64/wrcr26385-fig-0003-m.jpg" style={{width:'100%', margin:'1em'}}/>
            <br />
            <span style={{fontSize:'small',marginLleft:'1em'}}>Figure from: <a href="https://doi.org/10.1029/2022WR032804">P. J. Ruess, M. Konar, N. Wanders, M. Bierkens (2022)</a></span>
          </span>
        </Col>
      </Row>
            */}
      <hr />

      <Row>
        <Col span={12} style={{padding:'0.5em'}} >
        
        <h4>Annual Irrigation Water Use and Groundwater Depletion Rates</h4>

        <Steps direction="vertical" current={0} items={[
            {title: 'Select a metric to view', description: (
              <Segmented options={metricOptions} block defaultValue='GWD' size='small' 
                style={{fontSize:'small', textTransform:'uppercase', margin:'0.5em'}} onChange={onChangeMetric} /> )
            },
            {title: 'Select a Year to view:',  description: ( <>
              <Slider marks={yearOptions} defaultValue={2008} min={2008} max={2020}
                  style={{marginLeft:'1em', marginTop:'0.5em', marginRight:'3em'}} onChange={onChangeYear}/>
              <Button icon={<CaretRightOutlined />} onClick={runVideo} >Animate</Button>
              </> )
            },
            {title: 'The map below shows, for each US state, the value of selected metric.',  description: (
              <div style={{ height: '400px' }}>

                    <IrrigUseMap
                        mapID='divUSMap'
                        geoJsonURL={usDataURL}
                        field={field}
                        zoom={3.2}
                        xCenter={-100 - 20}
                        yCenter={35}
                        legendTitle="Km<sup>3</sup>/ of water used"
                        colorMap="above"
                        height='320'
                        onFeatureClicked={SelectState} >
                </IrrigUseMap>
              </div> )
            },
            {title: 'The map below shows, for each County of the selected state, the value of selected metric.',  description: (
              <div style={{ height: '400px' }}>
                    <IrrigUseMap
                        mapID='divStateMap'
                        geoJsonURL={stateGeoJsonURL}
                        field={field}
                        legendTitle="Km<sup>3</sup>/ of water used"
                        colorMap="above"
                        zoom={6}
                        xCenter={-124}
                        yCenter={44}
                        height='320'>
                    </IrrigUseMap>
              </div> )
            },
          ]}
        />
        </Col>

        <Col span={12}>
          <Row className="row aw-light-bg aw-dark-accent-text" style={{ height: '280px' }}>
            <Col span={8}>
              <h6>Irrigation Withdrawals by State</h6>
              <span>Top 20 Irrigation Water Users, Ranked by Total Withdrawals</span>
            </Col>
            <Col>
              {/* <AWPlotlyChart:jsonPath="jsonIrrigWithdrawalsByState" style="width:100%;height:100%" /> */}
            </Col>
          </Row>
        </Col>
      </Row>


      <Row>
        <Col span={8}>

          <Segmented options={metricOptions} block defaultValue='GWD' onChange={onChangeMetric} />
          <br />
          <Slider marks={yearOptions} defaultValue={2008} min={2008} max={2020} />

        </Col>
        <Col span={8}>
        </Col>

        <Col span={8}>
        </Col>
      </Row>



      <div className="row aw-light-bg">
      </div>

      <div className="row">
        <h5>More Information</h5>
        (1) USDA ERS - Irrigation & Water Use. https: //www.ers.usda.gov/topics/farm-practices-management/irrigation-water-use/.
        (2) Impacts of agricultural irrigation on groundwater salinity. https: //link.springer.com/article/10.1007/s12665-018-7386-6.
        (3) Types of Agricultural Water Use | Other Uses of Water - CDC. https: //www.cdc.gov/healthywater/other/agricultural/types.html.
      </div>
    </>
  )
};

IrrigWaterUse.propTypes = {
  //article: PropTypes.object,
}

export default IrrigWaterUse;
