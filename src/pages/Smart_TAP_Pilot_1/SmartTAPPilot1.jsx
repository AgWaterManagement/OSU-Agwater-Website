import OpenETMap from './OpenETMap';

const SmartTAPPilot1 = () => (
    <div className='content-container' style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', padding: 0 }}>
        <div style={{ padding: '0.5em 1em 0' }}>
            <div className='content-container-header'>Smart TAP Pilot: OpenET Field Analysis</div>
            <p style={{ margin: '0.25em 0 0.5em' }}>
                <i>Interactive map of agricultural field-level evapotranspiration (ET), applied water, and precipitation
                data from <a href="https://openetdata.org" target="_blank" rel="noreferrer">OpenET</a> for the Klamath Basin pilot area.
                Select a variable and year, then click a field to view its full time-series.</i>
            </p>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
            <OpenETMap />
        </div>
    </div>
);

export default SmartTAPPilot1;
