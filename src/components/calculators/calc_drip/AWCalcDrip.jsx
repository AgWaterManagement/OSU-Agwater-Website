
import { useState, useEffect } from 'react';

import LikeButton from '../../like_button/LikeButton'
import { Col, Row, Select, Input, InputNumber, Card, Divider } from 'antd';

import dripLine from '../../../assets/images/calculators//Irrigation-drip-line.png'
import dripEq from '../../../assets/images/calculators/Drip_Application_Rate.gif'

import '../calculators.css'

const { Option } = Select;


const AWCalcDrip = () => {

  const [Qe, set_Qe] = useState(12.0);  // emitter flow rate (gal/hr)
  const [Eff, set_Eff] = useState(100);  // irrigation efficiency fraction
  const [RowX, set_RowX] = useState(12);   // drip row spacing (inches)
  const [EmitY, set_EmitY] = useState(12);   // emitter spacing in-row spacing (inches)
  const [dripRate, set_DripRate] = useState(0.134);

  // units
  const [uQe, set_uQe] = useState(0.0167);
  const [uRowX, set_uRowX] = useState(30.48);
  const [uEmitY, set_uEmitY] = useState(2.54);
  const [uDripRate, set_uDripRate] = useState(1);

  function on_QeChange(value) {
    set_Qe(value);
    //calcDripRate();
  }
  function on_EffChange(value) { set_Eff(value); /* calcDripRate(); */ }
  function on_RowXChange(value) { set_RowX(value); /* calcDripRate(); */ }
  function on_EmitYChange(value) { set_EmitY(value); /* calcDripRate(); */ }

  function on_uQeChange(value) {
    set_uQe(value);
    //calcDripRate();
  }
  function on_uRowXChange(value) { set_uRowX(value); /* calcDripRate(); */ }
  function on_uEmitYChange(value) { set_uEmitY(value); /* calcDripRate(); */ }
  function on_uDripRateChange(value) { set_uDripRate(value); /* calcDripRate(); */ }

 // function updateDripRate(appRate) {
 //   document.getElementById('__dripRate').innerText = appRate
 //   set_DripRate(appRate);
 //   console.log(dripRate);
 // }  
  // Update secondState whenever firstState changes
  useEffect(() => {
    function calcDripRate() {

      const emitterFlow = (Qe * Eff) * uQe;   // unitless
      const spacing = EmitY * uEmitY;
      const distance = RowX * uRowX;
  
      let appRate = spacing / 2.54;
      appRate = appRate * (distance / 2.54);
      appRate = (231 * emitterFlow * 60) / appRate;
      appRate = appRate * uDripRate;
  
      let precision = 2;
  
      switch (uDripRate) {
        case 1: precision = 3; break;
        case 24: precision = 2; break;
        case 25.4: precision = 1; break;
        case 609.6: precision = 0; break;
        case 2.54: precision = 2; break;
        case 60.96: precision = 1; break;
      }
  
      let _appRate = appRate.toFixed(precision);
      //document.getElementById('__dripRate').innerText = _appRate;
      //set_DripRate(appRate);
      console.log('Emitter Efficiency: ' + Eff);
      console.log('Emitter Flow Rate: ' + Qe);
      console.log('Emitter Spacing: ' + EmitY);
      console.log('Drip Line Distance: ' + RowX);
      console.log('------');
      return _appRate;
    }
  
    const _dripRate = calcDripRate();
    set_DripRate(_dripRate);
  }, [ Qe, Eff, uQe, EmitY, uEmitY, RowX, uRowX, uDripRate]);


  const emitYUnits = (
    <Select defaultValue="2.54" style={{ width: 70, }} onChange={on_uEmitYChange} >
      <Option value="2.54" selected="selected">in</Option>
      <Option value="30.48">ft</Option>
      <Option value=".1">mm</Option>
      <Option value="1">cm</Option>
      <Option value="100">m</Option>
    </Select>
  );

  const emitterFlowUnits = (
    <Select defaultValue="0.0167" style={{ width: 70, }} onChange={on_uQeChange} >
      <Option value="0.0167">gph</Option>
      <Option value=".004402867539">lph</Option>
      <Option value="1">gpm</Option>
      <Option value="15.85032314">lps</Option>
    </Select>
  );

  const rowXUnits = (
    <Select defaultValue="30.48" style={{ width: 70, }} onChange={on_uRowXChange} >
      <Option value="2.54" selected="selected">in</Option>
      <Option value="30.48">ft</Option>
      <Option value=".1">mm</Option>
      <Option value="1">cm</Option>
      <Option value="100">m</Option>
    </Select>
  );

  const resultUnits = (
    <Select defaultValue="1" style={{ width: 90, }} onChange={(on_uDripRateChange)}>
      <Option value="1">in/hr</Option>
      <Option value="24">in/day</Option>
      <Option value="25.4">mm/hr</Option>
      <Option value="609.6">mm/day</Option>
      <Option value="2.54">cm/hr</Option>
      <Option value="60.96">cm/day</Option>
    </Select>
  );

  //calcDripRate();

  return (
    <>
      <div className='full-width'>
        <LikeButton />

        <h3 className="aw-dark-accent-text">Drip Line Rate</h3>
        <p>
          The drip line application rate is specific to your irrigation system and shouldn&apos;t change,
          so take a note of it. This constant rate is multiplied by all future irrigation set times to give
          the net application depths for those sets.  Use this form to calculate the water application rate
          of <a className='dark-link' href="../../../Content/Resources/Irrigation-Glossary.php#dripIrrigation">drip irrigation</a> lines (tape, tubing) given the flow rate from individual
          <a className='dark-link' href="../../../Content/Resources/Irrigation-Glossary.php#emitter"> emitters</a>, a constant spacing of the
          <a className='dark-link' href="../../../Content/Resources/Irrigation-Glossary.php#emitter"> emitters</a> along the drip line, and a constant spacing between the drip lines.
          <a className='dark-link' href="../../../Content/Resources/Irrigation-Unit-Descriptions.php">Learn more about the units used on this page. </a>
        </p>

        <Card label='Drip Line Calculator' className='calculator-card'>
          <Row>
            <Col xs={{ flex: '100%', }} sm={{ flex: '100%', }} md={{ flex: '50%', }} lg={{ flex: '50%', }} xl={{ flex: '50%', }}>

              <Row>
                <Col key='eff' xs={{ flex: '100%', }} sm={{ flex: '50%', }} md={{ flex: '50%', }} lg={{ flex: '50%', }} xl={{ flex: '50%', }} >
                  Dripper Efficiency (%): <br />
                  <InputNumber defaultValue={100} style={{ width: '10em' }} onChange={on_EffChange} />
                  <br /><br />
                </Col>

                <Col key='flow' xs={{ flex: '100%', }} sm={{ flex: '50%', }} md={{ flex: '50%', }} lg={{ flex: '50%', }} xl={{ flex: '50%', }} >
                  Emitter Flow:<br />
                  <InputNumber id='__eff' addonAfter={emitterFlowUnits} defaultValue={12} style={{ width: '10em' }} onChange={on_QeChange} />
                  <br /><br />
                </Col>
              </Row>

              <Row>
                <Col key='spacing' xs={{ flex: '100%', }} sm={{ flex: '50%', }} md={{ flex: '50%', }} lg={{ flex: '50%', }} xl={{ flex: '50%', }} >
                  Emitter Spacing: <br />
                  <InputNumber addonAfter={emitYUnits} defaultValue={12} style={{ width: '10em' }} onChange={on_EmitYChange} />
                  <br /><br />
                </Col>

                <Col key='distance' xs={{ flex: '100%', }} sm={{ flex: '50%', }} md={{ flex: '50%', }} lg={{ flex: '50%', }} xl={{ flex: '50%', }} >
                  Distance between Lines: <br />
                  <InputNumber addonAfter={rowXUnits} defaultValue={12} style={{ width: '10em' }} onChange={on_RowXChange} />
                  <br /><br />
                </Col>
              </Row>

              <br />
              <Divider orientation="left">Calculated Application Rate</Divider>
              <Input addonAfter={resultUnits} defaultValue={""}  value={dripRate} variant="filled" style={{ width: '20em', backgroundColor: 'yellow' }} />
              <br/><br/>
            </Col>
            <Col span={12}>
              <img src={dripLine} />
            </Col>

          </Row>
        </Card>

        <div>
        <Divider orientation="left">Calculation Method</Divider>
          <p> This calculator uses this equation to determine the Application Rate of a drip line irrigation system. </p>
          <p style={{ textAlign: 'center' }}>
            <img src={dripEq} className='full-width' style={{ maxWidth: 400 }} />
          </p>
        </div>



      </div>
    </>
  );
}


export default AWCalcDrip;
