import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { MapContainer, TileLayer, Pane, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { useLeafletContext } from '@react-leaflet/core'
import { GeoJSON } from 'react-leaflet/GeoJSON'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './irrigWaterUse.css';

//import L from 'leaflet';
import colormap from 'colormap';
import axios from 'axios';

import MapInfoControl from '../../components/mapping/MapInfoControl';


// define React component
const IrrigUseMap = ({
    //mapID = '',
    basemap = 'arcgis/navigation',
    geoJsonURL = '',
    year = 2008,
    field,
    xCenter = -121.0,
    yCenter = 45.0,
    zoom = 8,
    height = '480',
    onFeatureClicked =  ()=>{}
}) => {

    /// refs 
    let map = useRef(null)
    //const map = useMap();

    let info = useRef(null);

    // this 
    let geoLayer = useRef(null);
    
    const [geoData, setGeoData] = useState(null);
    let minMaxLookup = useRef({});
    const center = [yCenter, xCenter];  //
    //const geoJsonURL = '/public/articles/IrrigWaterUse/data/US_IrrigUseByState.geojson';
    //const geoJsonURL = './data/ST' + stateCode + '_IrrigUseByCounty.geojson'

    const [sw, setSW] = useState(0);
    const [gww, setGWW] = useState(0);
    const [tot, setTOT] = useState(0);
    const [gwd, setGWD] = useState(0);
    const [locationName, setLocationName] = useState('');   
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
            console.log("fetching irrig data from " + geoJsonURL);
            const response = await axios.get(geoJsonURL);
            const geojson = response.data;
            setDataMinMax(geojson);
            setGeoData(geojson);
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    }

    // when unmounted
    //useEffect(() => {
    //}, [yourDependency]);

    // when mounted
    useEffect(() => {
        ////// new
        //if (map.current === null) {
        //    map.current = L.map(mapID).setView([yCenter, xCenter], zoom);
        //
        //    // basemap
        //    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //        maxZoom: 19,
        //        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        //    }).addTo(map.current);
        //
        //    info = L.control();
        //    info.onAdd = function (map) {
        //        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        //        this.update();
        //        return this._div;
        //    };
        //    // method that we will use to update the control based on feature properties passed
        //    info.update = UpdateInfo;
        //    info.addTo(map.current);
        //}
    });
 
    // when updated geoJsonURL - fetch the data at the URL  
    useEffect(() => {
        console.log('updated geoJsonURL=' + geoJsonURL)
        getGeoJsonData();
    }, [geoJsonURL]);

    // geoData updated - reload map
    useEffect(() => {
        console.log('updated geoData, adding layer');
    //    if (map.current !== null) {
    //        if (geoLayer.current != null) {
    //            map.current.removeLayer(geoLayer.current);
    //    
    //            geoLayer.current = L.geoJson(geoData, {
    //                style: Style,
    //                onEachFeature: InitFeature
    //            }).addTo(map.current);
    //        }
    //    }
    }, [geoData]);

    //useEffect(() => {
    //    console.log('useEffect updating, field=' + field + ', location: ' + locationName);
    //    console.log('year: ' + year + ', sw: ' + sw + ', tot: ' + tot);
    //}, [geoData, year, field, sw, gww, tot, gwd, locationName]);


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
        let _sw = 0.01; //props['sw_total_' + year];
        let _gww = 0.01; // props['gww_total_' + year];
        let _tot = 0; // props['total_' + year];
        let _gwd = 0; // props['gwd_total_' + year];
        let name = '';

        if (props == undefined) { // off any feature

            //for (let _year = 2008; _year < 2021; _year++) {
            //    _sw += props['sw_total_' + _year];
            //    _gww += props['gww_total_' + _year];
            //    _tot += props['total_' + _year];
            //    _gwd += props['gwd_total_' + _year];
            //}
        }
        else {
            _sw = props['sw_total_' + year];
            _gww = props['gww_total_' + year];
            _tot = props['total_' + year];
            _gwd = props['gwd_total_' + year];

            if ("NAME" in props)
                setLocationName(props['NAME']);  // county map
            else {
                const state = props['STATEFP'];  // state map
                setLocationName(stateNames[state]);
            }
        }

        setSW(_sw);
        setGWW(_gww);
        setTOT(_tot);
        setGWD(_gwd);
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
            click: onFeatureClicked
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
    
return (
    <div style={{ }} >
            
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

                <MapInfoControl position='bottomleft' sw={sw} gww={gww} tot={tot} gwd={gwd} locationName={locationName} />

                {  // geoJson layer
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
                    )
                }
            </MapContainer>
        </div>
    )
};


IrrigUseMap.propTypes = {
    basemap: PropTypes.string,
    year: PropTypes.number,
    field: PropTypes.string,
    locationName: PropTypes.string,
    xCenter: PropTypes.number,
    yCenter: PropTypes.number,
    zoom: PropTypes.number,
    legendTitle: PropTypes.string,
    colorMap: PropTypes.string,
    height: PropTypes.string,
}

export default IrrigUseMap;
