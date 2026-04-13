//import { useState, useEffect } from 'react';
import { Collapse, Divider } from 'antd';
import PropTypes from 'prop-types';

import WeatherChart from './WeatherChart';

const WeatherForecast = ({ forecast }) => {
    if (!forecast) {
        return null; // Return null if no forecast is provided or if showForecast is false
    }


    return ( <>
            <div style={{ flex: '1 1 30%', textAlign: 'center' }}>
                <span style={{ fontSize: 'large', fontWeight: 'bold', color:'yellow' }}>{forecast.periods[0].name}</span>
                <img src={forecast.periods[0].icon} alt={forecast.periods[0].shortForecast}
                    style={{ width: '60px', height: '60px' }} />
                <p><strong>Temperature:</strong> {forecast.periods[0].temperature}°{forecast.periods[0].temperatureUnit}</p>
                <p><strong>Short Forecast:</strong> {forecast.periods[0].shortForecast}</p>
            </div>

            <Collapse items={[{
                key: '1', label: '7-day Forecast', children: ( <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {forecast.periods.map((period, index) => (<>
                            {index > 0 && period.name.includes('Night') == false && (
                                <div key={index} style={{ flex: '1 1 30%', margin: '0px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: 'large', fontWeight: 'bold', color:'yellow' }}>{period.name}</span>
                                    <p>{period.temperature}°{period.temperatureUnit}</p>
                                    <img
                                        src={period.icon}
                                        alt={period.shortForecast}
                                        style={{ width: '50px', height: '50px' }}
                                    />
                                </div>
                            )}
                        </>))}
                            <Divider />
                    <div><span style={{color: 'yellow'}}>Seven Day Temperature Forecast</span></div>
                    <WeatherChart forecast={forecast} chartType={"temperature"} />

                    <div><span style={{color: 'yellow'}}>Seven Day Precipitation Probability Forecast</span></div>
                    <WeatherChart forecast={forecast} chartType={"precipitation"} />

                    </div>

                </>


                )
            }]}
            />
        </>
    );
};

WeatherForecast.propTypes = {
    forecast: PropTypes.object,
    showForecast: PropTypes.bool,
}

export default WeatherForecast;