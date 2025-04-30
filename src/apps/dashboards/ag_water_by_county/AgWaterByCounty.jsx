import PropTypes from 'prop-types';
import { useState } from 'react';


import { Row, Col } from 'antd'
import { Gauge } from '@mui/x-charts/Gauge';



import GeoJsonMap from '../../../components/mapping/GeoJsonMap';

const countyDataURL = '/articles/IrrigWaterUse/data/ST41_IrrigUseByCounty.geojson';
const field = 'NAME';


const AgWaterByCounty = () => {
    function onCountyClicked(e) {

    }

    return (
        <>
            <h2>Ag Water Dashboard</h2>
        <hr/>
            <Row>
                <Col span={6}>

                    <div style={{ height: '400px' }}>

                        <GeoJsonMap
                            basemap={null}
                            geoJsonURL={countyDataURL}
                            field={field}
                            zoom={6}
                            xCenter={-121}
                            yCenter={44}
                            legendTitle="Km<sup>3</sup>/ of water used"
                            colorMap="above"
                            height='400'
                            onFeatureClicked={onCountyClicked} >
                        </GeoJsonMap>
                    </div> 
                </Col>

                <Col span={6}>
                    <h2>Crop Water Use</h2> 

                    <Gauge
                        value={75}
                        height={120}
                        startAngle={0}
                        endAngle={360}
                        innerRadius="80%"
                        outerRadius="100%"
                    // ...
                    />  
                </Col>

                <Col span={6}>
                    <h2>Groundwater</h2>

                    <Gauge
                        value={75}
                        height={120}
                        startAngle={0}
                        endAngle={360}
                        innerRadius="80%"
                        outerRadius="100%"
                        // ...
                        />
                </Col>
                <Col span={6}>
                    <h2>Water Quality</h2>

                    <Gauge
                        value={75}
                        height={120}
                            startAngle={0}
                        endAngle={360}
                        innerRadius="80%"
                        outerRadius="100%"
                    // ...
                    />
                </Col>
            </Row>



        </>
    )
};

AgWaterByCounty.propTypes = {
    //article: PropTypes.objSect,
}

export default AgWaterByCounty;
