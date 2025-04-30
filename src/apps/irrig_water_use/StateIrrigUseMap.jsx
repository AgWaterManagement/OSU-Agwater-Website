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
const IrrigUseMap = ({
    basemap = 'arcgis/navigation',
    geoJsonURL = '',
    year = 2008,
    field,
    locationName = 'Oregon',
    fipsCode = '', // FIPS code
    xCenter = -121.0,
    yCenter = 45.0,
    zoom = 8,
    height = '480' }) => {

    /* refs */
    let map = useRef(null)
    let info = useRef(null);

    // this 
    const [geoData, setGeoData] = useState(null);
    let stMinMaxLookup = useRef({});
    const center = [yCenter, xCenter];  //
    //const geoJsonURL = '/public/articles/IrrigWaterUse/data/US_IrrigUseByState.geojson';
    //const geoJsonURL = './data/ST' + stateCode + '_IrrigUseByCounty.geojson'


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
            setgeoData(response.data);
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
    }, [stateData, year, field, sw, gww, tot, gwd, stateName]);


    /*
        map.fitBounds(usBounds);
    */
    function etFillColor(feature) {
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

        setSW(props['sw_total_' + year]);
        setGWW(props['gww_total_' + year]);
        setTOT(props['total_' + year]);
        setGWD(props['gwd_total_' + year]);

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
        stMinMaxLookup.current = { sw: [0, 0], gww: [0, 0], total: [0, 0], gwd: [0, 0] };

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
                    if (value < stMinMaxLookup.current[key][0]) stMinMaxLookup.current[key][0] = value;
                    if (value > stMinMaxLookup.current[key][1]) stMinMaxLookup.current[key][1] = value;
                }
            }
        }

        for (const [p, value] of Object.entries(stMinMaxLookup.current)) {
            console.log(p + ': (' + value[0].toFixed(2) + ',' + value[1].toFixed(2) + ')');
        }
        return stMinMaxLookup.current;
    }





    return (
        <div style={{}}>
            State IrrigUseMap<br />

            <MapContainer style={{ borderStyle: 'solid', borderWidth: 1, borderColor: 'red', height: height + 'px', top: 0, left: 0 }}
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

                <InfoControl position='bottomleft' sw={sw} gww={gww} tot={tot} gwd={gwd} stateName={stateName} />

                { // geoJson layer 
                    (geoData != null) && (
                        <GeoJSON
                            attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            //children	ReactNode	No	Yes	ParentComponent
                            data={geoData}
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




StateIrrigUseMap.propTypes = {
    basemap: PropTypes.string,
    zoom: PropTypes.number,
    year: PropTypes.number,
    field: PropTypes.string,
    stateName: PropTypes.string,
    xCenter: PropTypes.number,
    yCenter: PropTypes.number,
    zoom: PropTypes.number,
    legendTitle: PropTypes.string,
    colorMap: PropTypes.string,
    height: PropTypes.string,
}

export default StateIrrigUseMap;





































    //try {
    //  const response = await axios.get('https://agwater.org:5556/IrrigUseData');
    //  countyData = response.data;
    //


  function AddStateLayer() {
    setLoading(true);

    if (stateLayer != null)
      map.removeLayer(stateLayer);

    minMaxLookup = GetDataMinMax(geoData);

    stateLayer = L.geoJson(stateData, {
      style: Style,
      onEachFeature: InitFeature
    }).addTo(map);

    setLoading(false);
    return stateLayer;
  }

  function RedrawLayer() {
    map.removeLayer(usLayer)
    AddUSLayer()
  }
  
  async function LoadStateMap(e) {
    try {
      setLoading(true);

      const props = e.target.feature.properties;
      const state = String(props['STATEFP']).padStart(2, '0')
      const url = '/articles/IrrigWaterUse/data/ST' + state + '_IrrigUseByCounty.geojson'

      const response = await axios.get(url);
      geoData = response.data;

      map.removeLayer(usLayer);

      AddStateLayer();
      setCurrentDisplay(props['STATEFP']);

      //fetch(url)
      //  .then(response => {
      //    stateData = response.json();
      //    AddStateLayer();
      //  });
    } catch (error) {
      console.error('Error fetching data:', error);
    }

    map.fitBounds(e.target.getBounds());
    setLoading(false);
  }

};