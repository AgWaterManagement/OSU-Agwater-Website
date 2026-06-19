import { Collapse, Divider, Typography } from 'antd';
//import { Link } from 'react-router-dom';


const { Title, Text, Paragraph } = Typography;


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
    children: <Paragraph>Coming Soon!</Paragraph>,
  },
];


const Calculators = () => (
  <div style={{ padding: '1em'}}>

    <div>

      <Title level={2}>Calculators</Title>

      <Paragraph>Below are a collection of <strong>calculators</strong> for determining flow rates and other
        aspects of irrigation planning and water resource analyses.</Paragraph>

      <Title level={4}>Irrigation Calculators</Title>
      <Divider />

    </div>
    <Collapse accordion bordered={false} items={items} />
    <br />
  </div>
);


export default Calculators;
