import { Collapse } from 'antd';

import AWFactSheet from './AWFactSheet'


const irrigationItems = [
  { key: 'i1', label: 'Center Pivot', 
    children: 
      <div>
      <AWFactSheet link="factSheets/Sprinkler_Efficiency.pdf" title="The More You Expose, The More You Lose: Limiting Center Pivot Irrigation Water Losses. (1.7 MB)" author="Abid Sarwar, R. Troy Peters" />
      <AWFactSheet link="factSheets/LEPA-LESA.pdf" title="Low Energy Precision Application (LEPA) and Low Elevation Spray Application (LESA) Trials in the Pacific Northwest (3.8 MB)" author="R. Troy Peters, Howard Neibling, Richard Stroh, Behnaz Molaei, Hani Mehanna" />
      <AWFactSheet link="factSheets/VRI.pdf" title="Variable Rate Irrigation.  What is it?  Should I Invest? (0.3 MB)" author="R. Troy Peters, Behnaz Molaei, Markus Flury" />
      <AWFactSheet link="factSheets/MDI.pdf" title="Mobile Drip Irrigation (MDI) on Center Pivots in the Pacific Northwest: Issues and Opportunities (2.8 MB)" author="Behnaz Molaei, R. Troy Peters, Isaya Kisekka" />
      <AWFactSheet link="factSheets/Pivot_Check_Sheet.pdf" title="Center Pivot Field Check Sheet (13 KB)" author="Charles Hillyer, R. Troy Peters, Xin Qiao, Jake LaRue, Sandeep Bhatti, Derek Heeren" />
      <AWFactSheet link="factSheets/FS361E.pdf" title="Using an Atmometer for Irrigation Scheduling in Eastern Washington (682 KB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/Boom-Type-Carts-Vs-Big-Guns.pdf" title="Big Guns versus Booms&nbsp;(879 KB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/eb1305.pdf" title="Sprinkler Irrigation:  Application Rates and Depth&nbsp;(24 KB)" author="Thomas Ley, WSU" />
      <AWFactSheet link="factSheets/em4885.pdf" title="Irrigation Management Practices to Protect Groundwater and Surface Water Quality in the State of WA&nbsp;(50 KB)" author="P. Canessa and R. Hermanson, WSU" />
      </div>
  },
  { key: '2', label: 'Drip Irrigation',
    children: <div>
      <AWFactSheet link="factSheets/LEPA-LESA.pdf" title="Low Energy Precision Application (LEPA) and Low Elevation Spray Application (LESA) Trials in the Pacific Northwest (3.8 MB)" author="R. Troy Peters, Howard Neibling, Richard Stroh, Behnaz Molaei, Hani Mehanna" />
      <AWFactSheet link="factSheets/VRI.pdf" title="Variable Rate Irrigation.  What is it?  Should I Invest? (0.3 MB)" author="R. Troy Peters, Behnaz Molaei, Markus Flury" />
      <AWFactSheet link="factSheets/MDI.pdf" title="Mobile Drip Irrigation (MDI) on Center Pivots in the Pacific Northwest: Issues and Opportunities (2.8 MB)" author="Behnaz Molaei, R. Troy Peters, Isaya Kisekka" />
      <AWFactSheet link="factSheets/FS086E.pdf" title="Managing Irrigation Water for Different Soil Types in the Same Field (660 KB)" author="R. Troy Peters" />
      <AWFactSheet link="factSheets/Soil-Surfactants.pdf" title="Does Wetter Water Make Fatter Wallets? Using Soil Wetting Agents (13 KB)" author="R. Troy Peters, Tamara Mobbs, and Joan Davenport" />
      <AWFactSheet link="factSheets/FS361E.pdf" title="Using an Atmometer for Irrigation Scheduling in Eastern Washington (682 KB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/Sprinkler-and-Drip-Equipment.pdf" title="Sprinkler and Drip Equipment (1.39 MB)" author="W. Howard Neibling, UI" />
      <AWFactSheet link="factSheets/Drip-Irrigation-For-Ag-Producers.pdf" title="Drip Irrigation for Agricultural Producers&nbsp;(30 KB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/Drip-Irrigation-Guide-For-Onion-Growers.pdf" title="Drip Irrigation for Onion Growers in the Treasure Valley&nbsp;(280 KB)" author="C.C. Shock, R. Flock, E. Feibert, C.A. Shock, L. Jensen, and J. Klauzer" />
      <AWFactSheet link="factSheets/Rust-Never-Sleeps.pdf" title="Rust Never Sleeps:  Ways to Deal with Iron in Drip Irrigation Water&nbsp;(3.48 MB)" author="Tom Walters, WSU" />
      <AWFactSheet link="factSheets/c0912.pdf" title="Determining the Gross Amount of Water Applied - Surface Irrigation&nbsp;(15 KB)" author="Thomas Ley, WSU" />
      <AWFactSheet link="factSheets/eb1305.pdf" title="Sprinkler Irrigation:  Application Rates and Depth&nbsp;(24 KB)" author="Thomas Ley, WSU" />
      <AWFactSheet link="factSheets/em4885.pdf" title="Irrigation Management Practices to Protect Groundwater and Surface Water Quality in the State of WA&nbsp;(50 KB)" author="P. Canessa and R. Hermanson, WSU" />
    </div> },
  { key: '3', label: 'Big Guns',
    children: <div>
      <AWFactSheet link="factSheets/Traveler_Guns.pdf" title="Management of Traveler Gun Irrigation Systems in the Pacific Northwest (0.6 MB)" author="Abdelmoneim Z. Mohamed, R. Troy Peters, Don McMoran" />
      <AWFactSheet link="factSheets/FS086E.pdf" title="Managing Irrigation Water for Different Soil Types in the Same Field (660 KB)" author="R. Troy Peters" />
      <AWFactSheet link="factSheets/Soil-Surfactants.pdf" title="Does Wetter Water Make Fatter Wallets? Using Soil Wetting Agents (13 KB)" author="R. Troy Peters, Tamara Mobbs, and Joan Davenport" />
      <AWFactSheet link="factSheets/FS361E.pdf" title="Using an Atmometer for Irrigation Scheduling in Eastern Washington (682 KB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/Boom-Type-Carts-Vs-Big-Guns.pdf" title="Big Guns versus Booms&nbsp;(879 KB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/c0912.pdf" title="Determining the Gross Amount of Water Applied - Surface Irrigation&nbsp;(15 KB)" author="Thomas Ley, WSU" />
      <AWFactSheet link="factSheets/eb1305.pdf" title="Sprinkler Irrigation:  Application Rates and Depth&nbsp;(24 KB)" author="Thomas Ley, WSU" />
      <AWFactSheet link="factSheets/em4885.pdf" title="Irrigation Management Practices to Protect Groundwater and Surface Water Quality in the State of WA&nbsp;(50 KB)" author="P. Canessa and R. Hermanson, WSU" />
      </div> },
  { key: '4', label: 'Wheel Lines',
    children: <div>
      <AWFactSheet link="factSheets/FS086E.pdf" title="Managing Irrigation Water for Different Soil Types in the Same Field (660 KB)" author="R. Troy Peters" />
      <AWFactSheet link="factSheets/Soil-Surfactants.pdf" title="Does Wetter Water Make Fatter Wallets? Using Soil Wetting Agents (13 KB)" author="R. Troy Peters, Tamara Mobbs, and Joan Davenport" />
      <AWFactSheet link="factSheets/FS044E.pdf" title="Managing Wheel-Lines and Hand-Lines for High Profitability (1.4 MB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/FS044E_Espanol.pdf" title="El Manjo de lineas de reigo de alas moviles-rodantes (wheel lines) y lineas de alas moviles-a-mano (hand-lines) para incrementar la rentabilidad (1.2 MB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/Irrigation-Management-for-Dairymen.pdf" title="Irrigation Management for Dairymen (93 KB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/Sprinkler-and-Drip-Equipment.pdf" title="Sprinkler and Drip Equipment (1.39 MB)" author="W. Howard Neibling, UI" />
      <AWFactSheet link="factSheets/c0912.pdf" title="Determining the Gross Amount of Water Applied - Surface Irrigation&nbsp;(15 KB)" author="Thomas Ley, WSU" />
      <AWFactSheet link="factSheets/eb1305.pdf" title="Sprinkler Irrigation:  Application Rates and Depth&nbsp;(24 KB)" author="Thomas Ley, WSU" />
      <AWFactSheet link="factSheets/em4885.pdf" title="Irrigation Management Practices to Protect Groundwater and Surface Water Quality in the State of WA&nbsp;(50 KB)" author="P. Canessa and R. Hermanson, WSU" />
      </div> },
  { key: '5', label: 'Wheel Lines',
    children: <div>
      <AWFactSheet link="factSheets/LEPA-LESA.pdf" title="Low Energy Precision Application (LEPA) and Low Elevation Spray Application (LESA) Trials in the Pacific Northwest (3.8 MB)" author="R. Troy Peters, Howard Neibling, Richard Stroh, Behnaz Molaei, Hani Mehanna" />
      <AWFactSheet link="factSheets/VRI.pdf" title="Variable Rate Irrigation.  What is it?  Should I Invest? (0.3 MB)" author="R. Troy Peters, Behnaz Molaei, Markus Flury" />
      <AWFactSheet link="factSheets/FS083E.pdf" title="Practical Use of Soil Moisture Sensors and Their Data for Irrigation Scheduling (660 KB)" author="R. Troy Peters" />
      <AWFactSheet link="factSheets/FS086E.pdf" title="Managing Irrigation Water for Different Soil Types in the Same Field (660 KB)" author="R. Troy Peters" />
      <AWFactSheet link="factSheets/Soil-Surfactants.pdf" title="Does Wetter Water Make Fatter Wallets? Using Soil Wetting Agents (13 KB)" author="R. Troy Peters, Tamara Mobbs, and Joan Davenport" />
      <AWFactSheet link="factSheets/FS361E.pdf" title="Using an Atmometer for Irrigation Scheduling in Eastern Washington (682 KB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/Irrigation-Management-for-Dairymen.pdf" title="Irrigation Management for Dairymen (93 KB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/Sprinkler-and-Drip-Equipment.pdf" title="Sprinkler and Drip Equipment (1.39 MB)" author="W. Howard Neibling, UI" />
      <AWFactSheet link="factSheets/Last-Irrigation-on-Grain.pdf" title="Last Irrigation on Grain (383 KB)" author="W. Howard Neibling, UI" />
      <AWFactSheet link="factSheets/FSWR001-WA-Water-Rights-v3.pdf" title="Washington Water Rights&nbsp;(26 KB)" author="R. Troy Peters, WSU" />
      <AWFactSheet link="factSheets/c0912.pdf" title="Determining the Gross Amount of Water Applied - Surface Irrigation&nbsp;(15 KB)" author="Thomas Ley, WSU" />
      <AWFactSheet link="factSheets/eb1305.pdf" title="Sprinkler Irrigation:  Application Rates and Depth&nbsp;(24 KB)" author="Thomas Ley, WSU" />
      <AWFactSheet link="factSheets/em4885.pdf" title="Irrigation Management Practices to Protect Groundwater and Surface Water Quality in the State of WA&nbsp;(50 KB)" author="P. Canessa and R. Hermanson, WSU" />
   
      </div> 
    }
];


const items = [
  {
    key: '1',
    label: 'Irrigation',
    children: <Collapse accordion items={irrigationItems} style={{ margin:'0.5em', padding:'0.5em'}}/>
  },
  {
    key: '2',
    label: 'Crop Drought and Climate',
    children: 
    <div>
    <AWFactSheet link="factSheets/Irrigation_Drought.pdf" title="Irrigation Management Strategies for Drought (3.8 MB)" author="R. Troy Peters, Maria I. Zamora-Re, Behnaz Molaei" />
    <AWFactSheet link="factSheets/em4821.pdf" title="WSU Drought Advisory: Visual Crop Moisture Stress Symptoms&nbsp;(75 KB)" author="Thomas W. Ley and Brian Leib, WSU" />
    <AWFactSheet link="factSheets/em4822.pdf" title="WSU Drought Advisory: Irrigation System Evaluation&nbsp;(84 KB)" author="Thomas W. Ley and Brian Leib, WSU" />
    <AWFactSheet link="factSheets/em4823.pdf" title="WSU Drought Advisory:  Asparagus Irrigation in a Water-Short Year&nbsp;(78 KB)" author="Thomas W. Ley and Brian Leib, WSU" />
    <AWFactSheet link="factSheets/em4824.pdf" title="WSU Drought Advisory:  Alfalfa Irrigation with Reduced Water   Supplies&nbsp;(77 KB)" author="Steve Fransen and John Kugler, WSU" />
    <AWFactSheet link="factSheets/em4826.pdf" title="WSU Drought Advisory:  Surge Flow Surface Irrigation&nbsp;(81 KB)" author="Robert Evans and Brian Leib, WSU" />
    <AWFactSheet link="factSheets/em4827.pdf" title="WSU Drought Advisory:  Mint Irrigation Management&nbsp;(86 KB)" author="Thomas Ley, Robert Stevens and Brian Leib, WSU" />
    <AWFactSheet link="factSheets/em4828.pdf" title="WSU Drought Advisory:  Surface Irrigation Systems&nbsp;(89 KB)" author="Thomas Ley and Brian Leib, WSU" />
    <AWFactSheet link="factSheets/em4832.pdf" title="WSU Drought Advisory:  Set-Move and Permanent Sprinkle Irrigation Systems&nbsp;(91 KB)" author="Thomas Ley and Brian Leib, WSU" />
    <AWFactSheet link="factSheets/em4833.pdf" title="WSU Drought Advisory:  Oilseed Rape Keeps Irrigated Land Productive&nbsp;(86 KB)" author="G. Gilliland and A. Hang, WSU" />
  </div>

  },
  {
    key: '3',
    label: 'Chemigation/Fertigation',
    children:
    <div>
    <AWFactSheet link="factSheets/Calculating-Chemigation-Injection-Rates.pdf" title="Calculating Chemigation Injection Rates (96 KB)" author="R. Troy Peters, W. Howard Neibling, and Tom Hoffmann, WSU, UI, WSDA" />
    <AWFactSheet link="factSheets/FS225E.pdf" title="Center Pivot Chemigation or Fertigation Injection Rate Worksheet for Weight-Based Applications (3.7 MB)" author="R. Troy Peters and Thomas Hoffmann" />
    <AWFactSheet link="factSheets/FS226E.pdf" title="Center Pivot Chemigation or Fertigation Injection Rate Worksheet for Volume-Based Applications (3.6 MB)" author="R. Troy Peters and Thomas Hoffmann" />
    <AWFactSheet link="factSheets/FS227E.pdf" title="Chemigation or Fertigation Injection Rate Worksheet for Water Concentration-Based Applications (3.8 MB)" author="R. Troy Peters and Thomas Hoffmann" />
    <AWFactSheet link="factSheets/FS228E.pdf" title="Drip or Solid-Set Chemigation or Fertigation Injection Rate Worksheet for Weight-Based Applications (4.3 MB)" author="R. Troy Peters and Thomas Hoffmann" />
    <AWFactSheet link="factSheets/FS229E.pdf" title="Drip or Solid-Set Chemigation or Fertigation Injection Rate Worksheet for Volume-Based Applications (4.3 MB)" author="R. Troy Peters and Thomas Hoffmann" />
    <AWFactSheet link="factSheets/FS230E.pdf" title="Chemigation or Fertigation Injection Pump Calibration (9.8 MB)" author="R. Troy Peters and Thomas Hoffmann" />
    </div>
  },
  {
    key: '4',
    label: 'Soil Monitoring and Sensing',
    children:
    <div>
    <AWFactSheet link="factSheets/Soil-Monitoring-and-Measurement.pdf" title="Soil Water Monitoring &amp; Measurement (1.39 MB)" author="T. Ley, R. Stevens, R. Topielec, and W. Howard Neibling, WSU, OSU, UI" icon="~assets/images/wsucougs.png" />
    <AWFactSheet link="factSheets/FS083E.pdf" title="Practical Use of Soil Moisture Sensors and Their Data for Irrigation Scheduling (660 KB)" author="R. Troy Peters" />
    <AWFactSheet link="factSheets/Practical-Soil-Moisture-Monitoring.pdf" title="Practical Use of Soil Moisture Sensors for Irrigation Scheduling (133 KB)" author="R. Troy Peters, WSU" />
    <AWFactSheet link="factSheets/Practical-Soil-Moisture-Monitoring.pdf" title="Practical Use of Soil Moisture Sensors for Irrigation Scheduling (133 KB)" author="R. Troy Peters, WSU" />
    </div>
  },
  {
    key: '5',
    label: 'Residential Yards and Gardens',
    children:
    <div>
    <AWFactSheet link="factSheets/FS362E.pdf" title="Watering Lawns in Washington to Save Water, Save Money, and Have a Healthy Green Lawn (1.4 MB)" author="R. Troy Peters" />
    <AWFactSheet link="factSheets/CIS1098.pdf" title="Water Home Lawns and Landscapes&nbsp;(156 KB)" author="H. Neibling, M. Colt, S. Bell, and J. Robbins, UI" />
    <AWFactSheet link="factSheets/DripIrrForYardGarden.pdf" title="Drip Irrigation for the Yard and Garden&nbsp;(34 KB)" author="R. Troy Peters, WSU" />
    </div>
  },
  {
    key: '6',
    label: 'Agrivoltaics',
    children: <p></p>,
  },
  {
    key: '7',
    label: 'Economics and Budgeting',
    children: 
    <div>
    <AWFactSheet link="factSheets/eb1667.pdf" title="1997 Enterprise Budgets for Potatoes, Winter Wheat, Alfalfa Hay, Grain   Corn, Silage Corn and Sweet Corn Under Center Pivot Irrigation&nbsp;(127 KB)" author="Herbert Hinman, Elvin Kulp, Erik Sorensen, Gary Pelter, Robert Gillespie, WSU" />
    <AWFactSheet link="factSheets/eb1745.pdf" title="2001 Cost of Producing Native and Scotch Spearmint Under Rill and   Side-Roll Irrigation Central Washington&nbsp;(124 KB)" author="Herbert Hinman, WSU" />
    <AWFactSheet link="factSheets/eb1875.pdf" title="Economics of Alternative Irrigation Systems in the Kittitas Valley&nbsp;(78 KB)" author="Thomas R. Hoffman and Gayle S. Willett, WSU" />
    <AWFactSheet link="factSheets/eb1906.pdf" title="2001 Cost of Producing Processing and Fresh Potatoes Under Center Pivot Irrigation, Columbia Basin, Washington&nbsp;(73 KB)" author="Herbert Hinman, Gary Pelter, and Erik Sorensen, WSU" />
    <AWFactSheet link="factSheets/EB2015E.pdf" title="2006 Cost of Producing and Processing Fresh Potatoes Under center Pivot Irrigation, Columbia Basin, Washington&nbsp;(445 KB)" author="Herbert Hinman, Mark Trent, and Mark Pavek, WSU" />
    </div>
  },
  {
    key: '8',
    label: 'Legal and Policy',
    children: 
    <div>
    <AWFactSheet link="factSheets/FSWR001-WA-Water-Rights-v3.pdf" title="Washington Water Rights&nbsp;(26 KB)" author="R. Troy Peters, WSU" />
    </div>
  },
];



const AWFactSheets = () => {
  
  //const { token } = theme.useToken();

  return (
  <>
    <Collapse className='accordion-header' accordion items={items} />
  </>
)};

export default AWFactSheets