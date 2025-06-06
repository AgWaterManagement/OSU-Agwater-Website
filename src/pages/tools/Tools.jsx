import { Collapse } from 'antd';
//import { Link } from 'react-router-dom';

import AWCalcDrip from '../../components/calculators/calc_drip/AWCalcDrip'
import AWCalcCropCoeff from '../../components/calculators/calc_crop_coeff/AWCalcCropCoeff'

const items = [
{
  key: '1',
  label: 'Drip Line Rate',
  children: <AWCalcDrip/>,
},
{
  key: '2',
  label: 'Crop Coefficient Calculator',
  children: <AWCalcCropCoeff/>,
},
{
  key: '3',
  label: 'Sprinkler Application Rate',
  children: <p>Coming Soon!</p>,
},
];


const Tools = () => (
    <div className='content-container'>

      <div className='topic_head-container'>

        <div className='content-container-header'>Tools</div>

        <p className='intro-text'>Below are a collection of <quote>calculators</quote> for determining flow rates and other 
          aspects of irrigation planning and water resource analyses.</p>

        <div className='section-header'>Irrigation Calculators</div>
      </div>
      <Collapse className='accordion-header' accordion items={items} />
      <br/>
    </div>
);


export default Tools;
