import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { MapContainer, TileLayer, Pane, Tooltip, useMapEvents } from 'react-leaflet'
import { useLeafletContext } from '@react-leaflet/core'
import { GeoJSON } from 'react-leaflet/GeoJSON'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './irrigWaterUse.css';

//import L from 'leaflet';
import colormap from 'colormap';
import axios from 'axios';

import MapInfoControl from './MapInfoControl';

// define React component
const USIrrigUseMap = ( {
  basemap = 'arcgis/navigation',
  year = 2008, 
  zoom = 3.2,
  field,
  height = '240'} ) => {

  /* refs */
  let map = useRef(null)
  let info = useRef(null);

  // this 
  const [ usData, setUSData] = useState(null);
  let minMaxLookup = useRef({});
    const usBounds = [[24, -125], [49, -66]];
    const latCenter = (usBounds[0][0] + usBounds[1][0]) / 2;
    const lngCenter = (usBounds[0][1] + usBounds[1][1]) / 2;

  const center = [latCenter+1.5, lngCenter-24];  //
  const geoJsonURL = '/public/articles/IrrigWaterUse/data/US_IrrigUseByState.geojson';


  const [sw, setSW] = useState(0);
    const [gww, setGWW] = useState(0);
    const [tot, setTOT] = useState(0);
    const [gwd, setGWD] = useState(0);
    const [stateName, setStateName] = useState('');

  /* states */
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState('total');

  const cmap = colormap({
    colormap: 'freesurface-blue',
    nshades: 72,
    format: 'hex',
    alpha: 1
  });

  async function getGeoJsonData() {
    try {
      const response = await axios.get(geoJsonURL);
      setDataMinMax(response.data);
      setUSData(response.data);
      setLoading(false);
      console.log("fetching US data")
    } catch (error) {
      console.error(error);
    }
  }

  /*
  const map = useMapEvents({
    click(e) {
      map.locate()
    },
    //locationfound(e) {
    //  setPosition(e.latlng)
    //  map.flyTo(e.latlng, map.getZoom())
    //},
  });
*/


  // when mounted
  //useEffect(() => {
  //}, []);

  // when did update 
  //useEffect(() => {
  //}, [yourDependency]);

  // when will unmount
  //useEffect(() => {
  //}, [yourDependency]);

  // when mounted
  useEffect(() => {
    getGeoJsonData();
  }, []);

  // when did update 
  useEffect(() => {
    console.log('useEfect updating, field=' + field)
  }, [usData, year, field, sw, gww, tot, gwd, stateName]);


/*
    map.fitBounds(usBounds);
*/
  function GetFillColor(feature) {
    let dataValue = feature.properties[field];

    if (dataValue == undefined)
      return 'red'

    //if (currentDisplay >= 0)
    //  return 'lightgray';

    let key = null;
    if (field[0] == 's')
      key = 'sw';
    else if (field[0] == 't')
      key = 'total';
    else if (field[2] == 'd')
      key = 'gwd';
    else if (field[2] == 'w')
      key = 'gww';
    else
      return 'yellow'

    const minMax = minMaxLookup.current[key];
    let dataMax = minMax[1];
    let dataMin = minMax[0];

    if (dataValue > dataMax)
      dataValue = dataMax;

    const scaledD = 71.99 * (dataValue - dataMin) / (dataMax - dataMin);  // [0-1] -> [0-72)
    const rgb = cmap[71 - Math.floor(scaledD)];
    return rgb;
  }

  function Style(feature) {
    const color = GetFillColor(feature);
    return {
      fillColor: color,
      fillOpacity: 0.9,
      weight: 1,
      opacity: 1,
      color: 'gray'
      //dashArray: '3',
    };
  }

    function UpdateInfo(props) {
        if (props == undefined)
            return;

        setSW( props['sw_total_' + year]);
        setGWW( props['gww_total_' + year]);
        setTOT( props['total_' + year]);
        setGWD( props['gwd_total_' + year]);

        let name = '';
        if ("NAME" in props)
            setStateName(props['NAME']);
        else {
            const state = props['STATEFP'];
            setStateName(stateNames[state]);
        }
        return;
    };
   



  function HighlightFeature(e) {
    var feature = e.target;

    feature.setStyle({
      weight: 2,
      color: 'yellow',
      dashArray: '',
      fillOpacity: 0.7
    });

    UpdateInfo(feature.feature.properties)


    //info.update(feature.feature.properties);

    //layer.bringToFront();
  }

    function ResetHighlight(e) {
        setSW(0);
       setGWW(0);
       setTOT(0);
       setGWD(0);

        var layer = e.target;
        
        //info.update();
 //usLayer.resetStyle(e.target);
  }

  function InitFeature(feature, layer) {
    feature.layer = layer;

    // is there a better place for this than here?
   layer.on({
      mouseover: HighlightFeature,
      mouseout: ResetHighlight,
      //click: LoadStateMap
    });
  }
  function setDataMinMax(json) {
    minMaxLookup.current = { sw: [0, 0], gww: [0, 0], total: [0, 0], gwd: [0, 0] };
    
    for (const f of json.features) {
      const props = f.properties;

      for (const [p, value] of Object.entries(props)) {
        let key = null;
        if (p[0] == 's')
          key = 'sw';
        else if (p[0] == 'g')
          key = (p[2] == 'd') ? 'gwd' : 'gww';
        else if (p[0] == 't')
          key = 'total';

        if (key != null) {
          if (value < minMaxLookup.current[key][0]) minMaxLookup.current[key][0] = value;
          if (value > minMaxLookup.current[key][1]) minMaxLookup.current[key][1] = value;
        }
      }
    }

    for (const [p, value] of Object.entries(minMaxLookup.current)) {
      console.log(p + ': (' + value[0].toFixed(2) + ',' + value[1].toFixed(2) + ')');
    }
    return minMaxLookup.current;
  }
  

  
  const stateNames = {
    1: "Alabama",
    2: "Alaska",
    4: "Arizona",
    5: "Arkansas",
    6: "California",
    8: "Colorado",
    9: "Connecticut",
    10: "Delaware",
    11: "District of Columbia",
    12: "Florida",
    13: "Georgia",
    15: "Hawaii",
    16: "Idaho",
    17: "Illinois",
    18: "Indiana",
    19: "Iowa",
    20: "Kansas",
    21: "Kentucky",
    22: "Louisiana",
    23: "Maine",
    24: "Maryland",
    25: "Massachusetts",
    26: "Michigan",
    27: "Minnesota",
    28: "Mississippi",
    29: "Missouri",
    30: "Montana",
    31: "Nebraska",
    32: "Nevada",
    33: "New Hampshire",
    34: "New Jersey",
    35: "New Mexico",
    36: "New York",
    37: "North Carolina",
    38: "North Dakota",
    39: "Ohio",
    40: "Oklahoma",
    41: "Oregon",
    42: "Pennsylvania",
    44: "Rhode Island",
    45: "South Carolina",
    46: "South Dakota",
    47: "Tennessee",
    48: "Texas",
    49: "Utah",
    50: "Vermont",
    51: "Virginia",
    53: "Washington",
    54: "West Virginia",
    55: "Wisconsin",
    56: "Wyoming"
  }

  console.log('rendering US Map field ' + field)


  return (
    <div style={{}}>
      US IrrigUseMap<br/>

      <MapContainer style={{borderStyle:'solid', borderWidth:1, borderColor:'red', height:height+'px', top:0, left:0 }} 
              zoom={zoom} 
              center={center}
              dragging={false}
              doubleClickZoom={false}
              scrollWheelZoom={false}
              attributionControl={false}
              zoomControl={false}>

        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
              />

        <MapInfoControl position='bottomleft' sw={sw} gww={gww} tot={tot} gwd={gwd} stateName={stateName} />

        { // geoJson layer 
        (usData != null) && (
          <GeoJSON
            attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            //children	ReactNode	No	Yes	ParentComponent
            data={usData}
            //eventHandlers={{
            //  click: (e) => {
            //    console.log('marker clicked')
            //    },
            //}}
            //eventHandlers	LeafletEventHandlerFnMap	No	Yes	Evented
            //pane	string	No	No	Pane
            onEachFeature={InitFeature}

            style={Style}  //	PathOptions or StyleFunction	No	Yes
            >
          </GeoJSON>
        )}
      </MapContainer>
    </div> 
  )
};




USIrrigUseMap.propTypes = {
  basemap: PropTypes.string,
  zoom: PropTypes.number,
  year: PropTypes.number,
  field: PropTypes.string,
  legendTitle: PropTypes.string,
  colorMap: PropTypes.string,
  height: PropTypes.string,
}

export default USIrrigUseMap;
