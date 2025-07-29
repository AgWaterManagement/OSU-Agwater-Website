import { Collapse, Divider } from 'antd';
//import { Link } from 'react-router-dom';

import AWCalcDrip from '../../components/calculators/calc_drip/AWCalcDrip'
import AWCalcCropCoeff from '../../components/calculators/calc_crop_coeff/AWCalcCropCoeff'

const items = [
  {
    key: '1',
    label: 'Drip Line Rate',
    children: <AWCalcDrip />,
  },
  {
    key: '2',
    label: 'Crop Coefficient Calculator',
    children: <AWCalcCropCoeff />,
  },
  {
    key: '3',
    label: 'Sprinkler Application Rate',
    children: <p>Coming Soon!</p>,
  },
];


const Calculators = () => (
  <div className='content-container'>

    <div className='topic_head-container'>

      <div className='content-container-header'>Calculators</div>

      <p className='intro-text'>Below are a collection of <strong>calculators</strong> for determining flow rates and other
        aspects of irrigation planning and water resource analyses.</p>

      <div className='section-header'>Irrigation Calculators</div>
      <Divider />

    </div>
    <Collapse accordion bordered={false} items={items} />
    <br />
  </div>
);


export default Calculators;
