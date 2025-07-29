import React from "react";

const StationInfo = ({ stationInfo }) => {
    if (!stationInfo) return null;

    return (
        <div>
            {stationInfo.title && <span><strong>Site: {stationInfo.title}</strong><br /></span>}
            {stationInfo.siteid && <span>Site ID: {stationInfo.siteid}<br /></span>}
            {stationInfo.region && <span>Program: {stationInfo.region}<br /></span>}
            {stationInfo.url && <span>Link: {stationInfo.url}<br /></span>}
            {stationInfo.install && <span>Installed: {stationInfo.install}<br /></span>}
        </div>
    );
};

export default StationInfo;