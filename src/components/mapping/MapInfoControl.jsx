import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { useLeafletContext } from '@react-leaflet/core'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapping.css';

function MapInfoControl(props) {
    const context = useLeafletContext()

    L.Control.MapInfoControl = L.Control.extend({
        onAdd: function (map) {
            var div = L.DomUtil.create('div', 'info');
            let locationName = props.locationName;
            if (locationName === '')
                locationName = 'Total'; 

            div.innerHTML = (props ?
                    '<div class="info-header">Irrigation Water Use: ' + locationName + '</div>'
                    + '<hr/>'
                    + '<div><div style="width:75%"><b>Surface Withdrawals</b>    </div>  <div style="display:inline-block;text-align:right">' + props.sw.toFixed(2)  + ' km<sup>3</sup>/year</div></div>'
                    + '<div><div style="width:75%"><b>Groundwater Withdrawals</b></div>  <div style="display:inline-block;text-align:right">' + props.gww.toFixed(2) + ' km<sup>3</sup>/year</div></div>'
                    + '<div><div style="width:75%"><b>Total Withdrawals</b>      </div>  <div style="display:inline-block;text-align:right">' + props.tot.toFixed(2) + ' km<sup>3</sup>/year</div></div><hr/>'
                    + '<div><div style="width:75%"><b>Groundwater Depletions</b> </div>  <div style="display:inline-block;text-align:right">' + props.gwd.toFixed(2) + ' km<sup>3</sup>/year</div></div>'
                    : 'Hover over a state');


 //           '<div style="padding-top:0;margin-top:0">Irrigation Water Use: ' + props.stateName + '</div>'
 //               + '<hr/>'
 //               + '<div><span style="width:75%"><b>Surface Withdrawals</b></span>     <span style="float:right;text-align:right">' + props.sw.toFixed(2) + ' km<sup>3</sup>/year</span></div>'
 //               + '<div><span style="float:clear;width:75%"><b>Groundwater Withdrawals</b></span> <span style="float:right;text-align:right">' + props.gww.toFixed(2) + ' km<sup>3</sup>/year</span></div>'
 //               + '<div><span style="float:clear;width:75%"><b>Total Withdrawals</b></span>       <span style="float:right;text-align:right">' + props.tot.toFixed(2) + ' km<sup>3</sup>/year</span></div>'
 //               + '<div><span style="float:clear;width:75%"><b>Groundwater Depletions</b></span>  <span style="float:right;text-align:right">' + props.gwd.toFixed(2) + ' km<sup>3</sup>/year</span></div>'


            this.div = div;
            return div;
        },
        onRemove: function (map) {
            // Nothing to do here
        }
    });

    L.control.mapInfoControl = function (opts) {
        return new L.Control.MapInfoControl(opts);
    }

    useEffect(() => {
        const container = context.layerContainer || context.map

        const control = L.control.mapInfoControl({ position: props.position })
        container.addControl(control)

        return () => { container.removeControl(control) }
    })
    return null;
}


MapInfoControl.propTypes = {
  sw: PropTypes.number,
  gww: PropTypes.number,
  tot: PropTypes.number,
  gwd: PropTypes.number,
  stateName: PropTypes.string,
}

export default MapInfoControl;
