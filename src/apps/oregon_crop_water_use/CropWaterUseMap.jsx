import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { MapContainer, TileLayer, Pane, Tooltip, useMapEvents } from 'react-leaflet'
import { useLeafletContext } from '@react-leaflet/core'
import { GeoJSON } from 'react-leaflet/GeoJSON'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './OregonCropWaterUse.css';

//import L from 'leaflet';
import colormap from 'colormap';
import axios from 'axios';

//import MapInfoControl from './MapInfoControl';


// define React component
const CropWaterUseMap = ({
    basemap = 'arcgis/navigation',
    geometryURL = null,
    //dataDef = null,    // field:url
    dataPath = null,    // 
    dataField = null,
    xCenter = -121.0,
    yCenter = 45.0,
    zoom = 8,
    height = '480',
    onFeatureClicked = null }) => {

    // refs
    let map = useRef(null)
    let info = useRef(null);
    let minMaxLookup = useRef({});
    let fieldData= useRef(null);


    // useState defines variables that can be updated
    // and trigger a re-render
    const [geoData, setGeoData] = useState(null);
    const [loading, setLoading] = useState(true);

    // instance variables
    const center = [yCenter, xCenter];  //
    const cmap = colormap({
        colormap: 'freesurface-blue',
        nshades: 72,
        format: 'hex',
        alpha: 1
    });

    async function GetGeometryData() {
        //fetch(geometryURL)
        //   .then(response => response.json())
        //   .then(users => setUserList(users))
        try {
            const response = await axios.get(geometryURL);
            setGeoData(response.data);
            setLoading(false);
            console.log("Fetched geometry data: " + response.data.features.length);

            GetFieldData();

        } catch (error) {
            console.error(error);
        }
    }

    async function GetFieldData() {
        if (dataField == null) {
            console.log('GetFieldData(): dataPath or field is null: ' + dataField);
            return null;
        }
        try {
            const _url = dataPath + dataField + '.json';
            //console.log('  GetGeoData() called for field ' + _field + ', URL:' + _url);

            const response = await axios.get(_url);
            fieldData = response.data;

            //AddDataLayer(_field, response.data);// .json array of floats
            //SetDataMinMax();
            setLoading(false);
            //console.log('  Field ' + _field + ' was successfully added')
        } catch (error) {
            console.error(error);
        }
    }

    function AddDataLayer(field, data) {
        if (data == null || geoData == null)
            return null;

        // have we already added this field?
        if (field in geoData.features[0].properties) {
            //console.log('AddDataLayer(): ' + field + ' was previously added...');
            return geoData;
        }

        // haven't added this field yet, so add the field to each feature
        let i = 0;
        for (const f of geoData.features) {
            f.properties[field] = data[i];
            i++;
            }   

        //console.log('AddDataLayer(): ' + field + ' has been added to the collection...');
        //console.log('  - setting geoData state to ' + geoData);
        setGeoData(geoData);
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

    // when will unmount
    //useEffect(() => {
    //}, [yourDependency]);

    // when mounted
    useEffect(() => {
        //if (field != null) {
            console.log('Mounting map control (useEffect), calling GetFieldData() for ' + dataField);
            GetGeometryData();
        //}
    }, []);

    // when dataURL is updated 
    useEffect(() => {
        if (dataField != null) {
            console.log('Map:useEffect(): dataField Updated to ' + dataField);
            GetFieldData();
        }
        return () => { };
    }, [dataField]);



    /*
        map.fitBounds(usBounds);
    */
    function GetFillColor(feature) {

        const index = feature.properties['Index'];
        if (index == 0) {
            console.log('feature.properties[Index] == 0');
        }
        if (fieldData == null)
            return 'rgba(1,1,1,0)';

        const value = fieldData[index];
        return 'green';
        
        //const minMax = minMaxLookup.current[key];
        //let dataMax = minMax[1];
        //let dataMin = minMax[0];
        //
        //if (dataValue > dataMax)
        //    dataValue = dataMax;
        //
        //const scaledD = 71.99 * (dataValue - dataMin) / (dataMax - dataMin);  // [0-1] -> [0-72)
        //const rgb = cmap[71 - Math.floor(scaledD)];
        //return rgb;
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

        //let name = '';
        //if ("NAME" in props)
        //    setStateName(props['NAME']);
        //else {
        //    const state = props['STATEFP'];
        //    setStateName(stateNames[state]);
        //}S
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
        //setGWD(0);

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
    function SetDataMinMax() {
        if (geoData == null)
            return null;

        minMaxLookup.current = {};
        //sw: [0, 0], gww: [0, 0], total: [0, 0], gwd: [0, 0]
        // };

        for (const f of geoData.features) {
            const props = f.properties;
            for (const [p, value] of Object.entries(props)) {
                let key = null;

                // FIX
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

        //for (const [p, value] of Object.entries(stMinMaxLookup.current)) {
        //    console.log(p + ': (' + value[0].toFixed(2) + ',' + value[1].toFixed(2) + ')');
        //}
        return minMaxLookup.current;
    }

    return (
        
        <div style={{}}>
            {console.log('Rendering CropWaterUseMap...')}
            {console.log('geodata=' + geoData)}

            {(geoData == null) && (<div>GeoJSON data NOT loaded...</div>)}
            {(geoData != null) && (<div>GeoJSON data loaded...</div>)}

            <MapContainer style={{ borderStyle: 'solid', borderWidth: 1, borderColor: 'red', height: height + 'px', top: 0, left: 0 }}
                zoom={zoom}
                center={center}
                dragging={false}
                doubleClickZoom={false}
                scrollWheelZoom={false}
                attributionControl={false}
                zoomControl={false}

            >

                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />

                { // <InfoControl position='bottomleft' sw={sw} gww={gww} tot={tot} gwd={gwd} stateName={stateName} />
                }

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


CropWaterUseMap.propTypes = {
    basemap: PropTypes.string,
    dataDef: PropTypes.string,
    xCenter: PropTypes.number,
    yCenter: PropTypes.number,
    zoom: PropTypes.number,
    height: PropTypes.string,
}


export default CropWaterUseMap;