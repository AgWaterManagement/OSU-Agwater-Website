import { useState, } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';


import LikeButton from '../../like_button/LikeButton'
import { Col, Row, Select, Card } from 'antd';

import cropCoeffs from './CropCoeffs.json'
import '../calculators.css'


const AWCalcCropCoeff = () => {

  function mapCrops(crp) {
    return { 'label': crp.crop, 'value': crp.code };
  }

  function sortCrops(c0, c1) {
    return (c0.label > c1.label) ? 1 : ((c1.label > c0.label) ? -1 : 0)
  }

  const cropsList = () => {
    const mappedCrops = cropCoeffs.map(mapCrops);
    const sorted = mappedCrops.sort(sortCrops);
    return sorted;
  };

  const _cropsList = cropsList();

  const [, setCropCode] = useState(_cropsList[0].value);
  const [cropName, setCropName] = useState(_cropsList[0].label);
  const [coeffs, setCoeffs] = useState(getCropCoeffs(_cropsList[0].value));

  function getCropCoeffs(cropCode) {
    const cropInfo = cropCoeffs.find(obj => obj['code'] === cropCode);
    return cropInfo['ccs'];
  }

  function getCropName(cropCode) {
    const cropInfo = cropCoeffs.find(obj => obj['code'] === cropCode);
    return cropInfo['crop'];
  }

  function updatePlot(cropCode) {
    const _yData = getCropCoeffs(cropCode);
    setCoeffs(_yData)
  }

  const onCropChange = (cropCode) => {
    setCropCode(cropCode);
    setCropName(getCropName(cropCode))
    updatePlot(cropCode);
  }

  const chartData = coeffs.map((value, index) => ({
    period: index + 1,
    coefficient: value,
  }));

  return (
    <>
      <div className='full-width'>
        <LikeButton />

        <h2 className="aw-dark-accent-text">Crop Coefficient Calculator</h2>
        <p>
          A <b>crop coefficient</b> (Kc) is a factor used to estimate the amount of water a specific crop
          needs for optimal growth.This value varies depending on the type of crop, its growth stage,
          and environmental conditions.
        </p>
        <p>
          Use this tool to determine crop coefficient curves for a number of PNW crops.
        </p>

        <Card label='Crop Coefficient Calculator' className='calculator-card no-padding'>

          <Row className='full-width no-padding' >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
            
              <h3>Select a crop from the list below</h3>
              <Select options={_cropsList} style={{ width: 240, }} onChange={onCropChange} />
              <br/><br/>
            </Col>
            <Col xs={24} sm={24} md={16} lg={16} xl={16} className='no-padding'>
              <div className='full-width no-padding'>
              
                <div className="calculator-plot" style={{ width: '100%', height: 420, minHeight: 320, maxHeight: 800 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 24, left: 8, bottom: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="period"
                        label={{ value: 'Period', position: 'insideBottom', offset: -6 }}
                      />
                      <YAxis
                        domain={[0, 1.2]}
                        label={{ value: 'Kc', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        formatter={(value) => [value, 'Kc']}
                        labelFormatter={(label) => `${cropName} - Period ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="coefficient"
                        stroke="#ff4d4f"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      <h6 className="aw-dark-accent-text">More Information:</h6>

      <ol>
        <li><a href="https://www.usbr.gov/pn/agrimet/cropcurves/about_crop_curves.html">Agrimet Crop Coefficients Page</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Crop_coefficient">Crop coefficient - Wikipedia.</a></li>
        <li><a href="https://www.fao.org/4/X0490E/x0490e0a.htm">Chapter 5 - Introduction to crop evapotranspiration (ETc).</a></li>
        <li><a href="https://www.fao.org/4/X0490E/x0490e0b.htm">Chapter 6 - ETc - Single crop coefficient (Kc) - Food and Agriculture</a></li>
        <li><a href=" https://www.irrigation.org/IA/FileUploads/IA/Resources/TechnicalPapers/2007/DeterminationOfCropCoefficients%28Kc%29ForIrrigationManagementOfCrops.pdf">DETERMINATION OF CROP COEFFICIENTS (KC) FOR IRRIGATION.</a></li>
      </ol>

    </>
  );
}

export default AWCalcCropCoeff;
