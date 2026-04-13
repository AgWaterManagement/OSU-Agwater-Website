import { useState, useEffect, useRef } from 'react';
import { Row, Col, Spin, Typography, message, Radio, Switch, Space } from 'antd';
import PropTypes from 'prop-types';
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-legend";
import "@arcgis/map-components/components/arcgis-search";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";
import wetlandStatsData from './wetland_stats.json';
import streamStatsData from './stream_stats.json';
import PrecipEtData from './PrecipEtData';

const { Text } = Typography;

// feature service
//const webMapID = '55db86333a7049288428a149d1f92a5e';
const FEATURE_SERVICE_URL = 'https://services1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/WOTUS_Wetlands_States_gdb_2_view/FeatureServer';
const NHD_STREAM_SERVICE_URL = 'https://services1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/NHD_Flowlines_HW/FeatureServer';
const WETLANDS_FEATURE_SERVICE_URL = 'https://services1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/WOTUS_Wetlands_States_gdb/FeatureServer';
const NHD_STREAM_MIN_ZOOM = 10;
const WETLANDS_MIN_ZOOM = 10;

// Wetland Types:
const wetlandTypes = [
    ['Riverine', [200, 200, 200]],
    ['Freshwater Emergent Wetland', [180, 30, 89]],
    ['Freshwater Forested/Shrub Wetland', [34, 139, 34]],
    ['Freshwater Pond', [70, 130, 180]],
    ['Estuarine and Marine Wetland', [255, 140, 0]],
    ['Lake', [0, 0, 255]],
    ['Estuarine and Marine Deepwater', [0, 0, 128]],
    ['Other', [128, 128, 128]]
];

// Color gradient function - from light blue to dark blue based on wetland area (linear scale)
const getColorForWetlandArea = (area, minArea, maxArea) => {
    if (area === null || area === undefined || area <= 0) {
        return [200, 200, 200, 0.6]; // Gray for no data
    }
    
    // Use linear scale for color distribution
    const range = maxArea - minArea;
    const normalized = range > 0 
        ? Math.min(1, Math.max(0, (area - minArea) / range))
        : 0.5; // Default to middle of range if all values are the same
    
    // Create a gradient from light blue to dark blue
    // Light: rgb(227, 242, 253) -> Dark: rgb(13, 71, 161)
    const r = Math.round(227 - (normalized * 214));
    const g = Math.round(242 - (normalized * 171));
    const b = Math.round(253 - (normalized * 92));
    
    return [r, g, b, 0.7];
};

// Generate legend gradient stops
const getLegendGradientCSS = () => {
    return 'linear-gradient(to right, rgb(227, 242, 253), rgb(100, 181, 246), rgb(30, 136, 229), rgb(13, 71, 161))';
};

// Get color for stream length (turquoise gradient - light to dark teal)
// Uses linear scale for color distribution
const getColorForStreamLength = (length, minLength, maxLength) => {
    if (length === null || length === undefined || length <= 0) {
        return [200, 200, 200, 0.6]; // Gray for no data
    }
    
    // Use linear scale for color distribution
    const range = maxLength - minLength;
    const normalized = range > 0 
        ? Math.min(1, Math.max(0, (length - minLength) / range))
        : 0.5;
    
    // Create a gradient from light turquoise to dark teal
    // Light: rgb(224, 247, 250) -> Dark: rgb(0, 77, 64)
    const r = Math.round(224 - (normalized * 224));
    const g = Math.round(247 - (normalized * 170));
    const b = Math.round(250 - (normalized * 186));
    
    return [r, g, b, 0.7];
};

// Generate stream legend gradient stops
const getStreamLegendGradientCSS = () => {
    return 'linear-gradient(to right, rgb(224, 247, 250), rgb(128, 203, 196), rgb(38, 166, 154), rgb(0, 77, 64))';
};

// Get color for wetland protected fraction (blue gradient - light to dark blue)
// Uses linear scale for percentage values (0-100%)
const getColorForWetlandProtectedFraction = (fraction) => {
    if (fraction === null || fraction === undefined || fraction < 0) {
        return [200, 200, 200, 0.6]; // Gray for no data
    }
    
    // Normalize percentage (0-100) to 0-1
    const normalized = Math.min(1, Math.max(0, fraction / 100));
    
    // Create a gradient from light blue to dark blue
    // Light: rgb(227, 242, 253) -> Dark: rgb(13, 71, 161)
    const r = Math.round(227 - (normalized * 214));
    const g = Math.round(242 - (normalized * 171));
    const b = Math.round(253 - (normalized * 92));
    
    return [r, g, b, 0.7];
};

// Generate wetland protected fraction legend gradient stops
const getWetlandProtectedFractionLegendGradientCSS = () => {
    return 'linear-gradient(to right, rgb(227, 242, 253), rgb(100, 181, 246), rgb(30, 136, 229), rgb(13, 71, 161))';
};

// Get color for stream protected fraction (green gradient - light to dark green)
// Uses linear scale for percentage values (0-100%)
const getColorForStreamProtectedFraction = (fraction) => {
    if (fraction === null || fraction === undefined || fraction < 0) {
        return [200, 200, 200, 0.6]; // Gray for no data
    }
    
    // Normalize percentage (0-100) to 0-1
    const normalized = Math.min(1, Math.max(0, fraction / 100));
    
    // Create a gradient from light green to dark green
    // Light: rgb(232, 245, 233) -> Dark: rgb(27, 94, 32)
    const r = Math.round(232 - (normalized * 205));
    const g = Math.round(245 - (normalized * 151));
    const b = Math.round(233 - (normalized * 201));
    
    return [r, g, b, 0.7];
};

// Generate stream protected fraction legend gradient stops
const getStreamProtectedFractionLegendGradientCSS = () => {
    return 'linear-gradient(to right, rgb(232, 245, 233), rgb(165, 214, 167), rgb(76, 175, 80), rgb(27, 94, 32))';
};

// Parse stream query string to extract protection criteria
const parseStreamProtectionCriteria = (query) => {
    if (!query) return { streamOrder: null, streamTypeCodes: [], drainageArea: null };
    const params = new URLSearchParams(query);
    const streamOrder = params.get('stream_order') ? parseInt(params.get('stream_order')) : null;
    const drainageArea = params.get('drainage_area_threshold') ? parseFloat(params.get('drainage_area_threshold')) : null;
    const streamTypeCodesStr = params.get('stream_type_code');
    const streamTypeCodes = streamTypeCodesStr
        ? streamTypeCodesStr.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c))
        : [];
    return { streamOrder, streamTypeCodes, drainageArea };
};

// Build Arcade expression that classifies a stream feature as "protected" or "unprotected"
// NOTE: Field names in NHD_Flowlines_HW feature service are lowercase:
//   fcode      – specific NHD feature code (46000, 46003, 46006, …)
//   ftype      – general category code (460, 336, …)
//   streamorde – Strahler stream order
//   totdasqkm  – total upstream drainage area in sq km
const buildProtectedStreamArcade = (criteria) => {
    const conditions = [];
    if (criteria.streamTypeCodes.length > 0) {
        // stream_type_code values from the query are FCode values (e.g. 46000, 46003)
        const typeChecks = criteria.streamTypeCodes.map(code => `$feature.fcode == ${code}`).join(' || ');
        conditions.push(`(${typeChecks})`);
    }
    if (criteria.streamOrder !== null) {
        conditions.push(`$feature.streamorde >= ${criteria.streamOrder}`);
    } else if (criteria.drainageArea !== null) {
        conditions.push(`$feature.totdasqkm >= ${criteria.drainageArea}`);
    }
    if (conditions.length === 0) return 'return "unprotected";';
    return `if (${conditions.join(' && ')}) { return "protected"; } return "unprotected";`;
};

// Build a renderer that colors protected streams dark blue and unprotected streams red
const buildStreamProtectionRenderer = (criteria) => {
    const arcade = buildProtectedStreamArcade(criteria);
    return {
        type: 'unique-value',
        valueExpression: arcade,
        defaultSymbol: {
            type: 'simple-line',
            color: [198, 82, 72, 0.6],
            width: 1
        },
        defaultLabel: 'Unclassified Stream',
        uniqueValueInfos: [
            {
                value: 'protected',
                symbol: {
                    type: 'simple-line',
                    color: [0, 60, 140, 0.9],
                    width: 2.5
                },
                label: 'Protected Stream'
            },
            {
                value: 'unprotected',
                symbol: {
                    type: 'simple-line',
                    color: [198, 82, 72, 0.9],
                    width: 2
                },
                label: 'Unprotected Stream'
            }
        ]
    };
};

// Map water regime numeric codes (from API query) to NWI water regime letters
const waterRegimeCodeToLetters = {
    2: ['J', 'A', 'S'],  // Temporarily Flooded
    3: ['B'],              // Seasonally Saturated
    4: ['D'],              // Continuously Saturated
    5: ['C', 'R'],         // Seasonally Flooded
    6: ['E', 'P'],         // Seasonally Flooded/Saturated
    7: ['F', 'N', 'Q'],    // Semipermanently Flooded
    8: ['G', 'M', 'T'],    // Intermittently Exposed
    9: ['H', 'L', 'V']     // Permanently Flooded
};

// Map wetland type numeric codes (from API query) to WETLAND_TYPE field values
const wetlandTypeCodeToName = {
    1: 'Estuarine and Marine Deepwater',
    2: 'Estuarine and Marine Wetland',
    3: 'Freshwater Emergent Wetland',
    4: 'Freshwater Forested/Shrub Wetland',
    5: 'Freshwater Pond',
    6: 'Lake',
    7: 'Other',
    8: 'Riverine'
};

// Parse wetland query string to extract protection and display criteria
const parseWetlandProtectionCriteria = (query) => {
    if (!query) return { nearOrder: null, nearDistThreshold: null, waterRegimeCodes: [], includeHumanImpacted: true, wetlandTypeCodes: [] };
    const params = new URLSearchParams(query);
    const nearOrder = params.get('near_order') ? parseInt(params.get('near_order')) : null;
    const nearDistThreshold = params.get('near_dist_threshold') ? parseFloat(params.get('near_dist_threshold')) : null;
    const waterRegimeCodesStr = params.get('water_regime_code');
    const waterRegimeCodes = waterRegimeCodesStr
        ? waterRegimeCodesStr.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c))
        : [];
    const includeHumanImpacted = params.get('include_human_impacted') !== '0';
    const wetlandTypeCodesStr = params.get('wetland_type_code');
    const wetlandTypeCodes = wetlandTypeCodesStr
        ? wetlandTypeCodesStr.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c))
        : [];
    return { nearOrder, nearDistThreshold, waterRegimeCodes, includeHumanImpacted, wetlandTypeCodes };
};

// Build Arcade expression that classifies a wetland feature as "TYPE_protected" or "TYPE_unprotected"
// Uses feature service fields: Near_Order, Near_Dist, ATTRIBUTE, WETLAND_TYPE
const buildProtectedWetlandArcade = (criteria) => {
    const lines = [];

    // Extract water regime letter from NWI ATTRIBUTE code.
    // The water regime is the last uppercase letter before any lowercase special modifiers.
    lines.push('var attr = $feature.ATTRIBUTE;');
    lines.push('var len = Count(attr);');
    lines.push('var regime = "";');
    lines.push('for (var i = len - 1; i >= 0; i--) {');
    lines.push('  var ch = Mid(attr, i, 1);');
    lines.push('  if (ch >= "a" && ch <= "z") { continue; }');
    lines.push('  if (ch >= "0" && ch <= "9") { continue; }');
    lines.push('  regime = ch;');
    lines.push('  break;');
    lines.push('}');

    lines.push('var isProtected = true;');

    // Stream order criterion: nearest stream must be at or above threshold
    if (criteria.nearOrder !== null) {
        lines.push(`if (IsEmpty($feature.Near_Order) || $feature.Near_Order < ${criteria.nearOrder}) { isProtected = false; }`);
    }

    // Distance criterion: wetland must be within threshold distance of nearest stream
    if (criteria.nearDistThreshold !== null) {
        lines.push(`if (IsEmpty($feature.Near_Dist) || $feature.Near_Dist > ${criteria.nearDistThreshold}) { isProtected = false; }`);
    }

    // Water regime criterion: wetland's regime must be in the allowed set
    if (criteria.waterRegimeCodes.length > 0) {
        let allowedLetters = [];
        criteria.waterRegimeCodes.forEach(code => {
            if (waterRegimeCodeToLetters[code]) {
                allowedLetters = allowedLetters.concat(waterRegimeCodeToLetters[code]);
            }
        });

        if (allowedLetters.length > 0) {
            const letterArray = allowedLetters.map(l => `"${l}"`).join(', ');
            lines.push(`var allowedRegimes = [${letterArray}];`);
            lines.push('if (IndexOf(allowedRegimes, regime) == -1) { isProtected = false; }');
        }
    }

    lines.push('if (isProtected) { return $feature.WETLAND_TYPE + "_protected"; }');
    lines.push('return $feature.WETLAND_TYPE + "_unprotected";');

    return lines.join('\n');
};

// Lighten a color by blending towards white
const lightenColor = (rgb, factor = 0.6) => {
    return rgb.map(c => Math.round(c + (255 - c) * factor));
};

// Build a renderer that colors protected wetlands darker and unprotected lighter, per type
const buildWetlandProtectionRenderer = (criteria) => {
    const arcade = buildProtectedWetlandArcade(criteria);

    const uniqueValueInfos = [];

    const protectedColor = [70, 130, 180]; // Steel blue for protected wetlands
    const unprotectedColor = [198, 82, 72]; // Red for unprotected wetlands (matches unprotected streams)

    wetlandTypes.forEach(([typeName, baseColor]) => {
        // Protected: use the full base color, higher opacity, thicker outline
        uniqueValueInfos.push({
            value: typeName + '_protected',
            symbol: {
                type: 'simple-fill',
                // IMPORTANT: The below line of code allows for different wetland types to be colored differently while still distinguishing protected vs
                // unprotected status by using a consistent color scheme (e.g. all protected wetlands are shades of blue, all unprotected wetlands are
                // lighter shades of their base color). If you change this to use the baseColor directly, you will lose the visual distinction between
                // different wetland types.
                //color: [...baseColor, 0.7],
                //outline: { color: [...baseColor, 0.9], width: 2 }
                // Use a consistent blue color for all protected wetlands.
                color: [...protectedColor, 0.7],
                outline: { color: [...protectedColor, 0.9], width: 2 }
            },
            label: typeName + ' (Protected)'
        });

        // Unprotected: crosshatch pattern to visually distinguish from protected wetlands
        uniqueValueInfos.push({
            value: typeName + '_unprotected',
            symbol: {
                type: 'simple-fill',
                style: 'backward-diagonal', // Crosshatch pattern to distinguish unprotected wetlands
                color: [...unprotectedColor, 0.7],
                outline: { color: [...unprotectedColor, 0.6], width: 2 }
            },
            label: typeName + ' (Unprotected)'
        });
    });

    return {
        type: 'unique-value',
        valueExpression: arcade,
        defaultSymbol: {
            type: 'simple-fill',
            color: [200, 200, 200, 0.3],
            outline: { color: [150, 150, 150, 0.6], width: 1 }
        },
        defaultLabel: 'Unclassified Wetland',
        uniqueValueInfos: uniqueValueInfos
    };
};

// Build a definition expression to filter which wetland types are displayed
const buildWetlandDefinitionExpression = (criteria) => {
    const conditions = [];

    // Filter by wetland type
    if (criteria.wetlandTypeCodes.length > 0) {
        const typeNames = criteria.wetlandTypeCodes
            .map(code => wetlandTypeCodeToName[code])
            .filter(name => name !== undefined)
            .map(name => `'${name.replace(/'/g, "''")}'`);

        if (typeNames.length > 0) {
            conditions.push(`WETLAND_TYPE IN (${typeNames.join(', ')})`);
        }
    } else {
        // No types selected — show nothing
        return '1=0';
    }

    // Filter by human impact (artificial wetlands)
    // NWI modifiers: h=diked/impounded, d=partially drained, f=farmed, x=excavated, r=artificial substrate, s=spoil
    if (!criteria.includeHumanImpacted) {
        conditions.push("ATTRIBUTE NOT LIKE '%h%'");
        conditions.push("ATTRIBUTE NOT LIKE '%d%'");
        conditions.push("ATTRIBUTE NOT LIKE '%f%'");
        conditions.push("ATTRIBUTE NOT LIKE '%x%'");
        conditions.push("ATTRIBUTE NOT LIKE '%r%'");
        conditions.push("ATTRIBUTE NOT LIKE '%s%'");
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
};


const WotusMap = ({ domain, streamQuery, wetlandQuery, currentState, usStates, setCurrentState, onLocationClick, initialCenter, initialZoom, onViewStateChange }) => {
    const [clickedLocation, setClickedLocation] = useState(null);
    const mapView = useRef(null);
    const featureLayer = useRef(null);
    const geoJSONLayer = useRef(null);
    const nhdStreamLayer = useRef(null);
    const wetlandsFeatureLayerRef = useRef(null);
    const viewRef = useRef(null);
    const wetlandsDataRef = useRef({});
    const updateNHDStreamLayerFn = useRef(null);
    const updateWetlandsFeatureLayerFn = useRef(null);
    const streamQueryRef = useRef(streamQuery);
    const wetlandQueryRef = useRef(wetlandQuery);

    const [loading, setLoading] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(4);
    const [featureCount, setFeatureCount] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Ready');
    const [wetlandsData, setWetlandsData] = useState({});
    const [streamsData, setStreamsData] = useState({});
    const [dataStats, setDataStats] = useState({ min: 0, max: 0 });
    const [streamStats, setStreamStats] = useState({ min: 0, max: 0 });
    const [showLegend, setShowLegend] = useState(false);
    const [geoJSONLayerReady, setGeoJSONLayerReady] = useState(false);
    const [gradientMode, setGradientMode] = useState(domain === 'streams' ? 'streams' : 'wetlands'); // 'wetlands', 'streams', 'wetlandsFraction', 'streamsFraction'
    const [conusStats, setConusStats] = useState({ wetlands: {}, streams: {} });
    const [conusStatsLoading, setConusStatsLoading] = useState(false);
    const [fractionStats, setFractionStats] = useState({ wetlandsMin: 0, wetlandsMax: 100, streamsMin: 0, streamsMax: 100 });
    const [showStatsLayer, setShowStatsLayer] = useState(true);
    
    const formatter = new Intl.NumberFormat('en-US');

    // Load wetland data for all states from JSON file on mount
    useEffect(() => {
        const loadWetlandsData = () => {
            setStatusMessage('Loading wetland data...');
            
            const wetlandsMap = {};
            let minArea = Infinity;
            let maxArea = 0;

            // Load data for each state from the imported JSON
            usStates.forEach((state) => {
                const stateData = wetlandStatsData[state.abbr];
                
                if (stateData) {
                    const area = stateData.total_wetlands_area || 0;
                    wetlandsMap[state.name] = {
                        abbr: state.abbr,
                        totalArea: area,
                        wetlandsCount: stateData.total_wetlands_count || 0
                    };
                    
                    if (area > 0) {
                        minArea = Math.min(minArea, area);
                        maxArea = Math.max(maxArea, area);
                    }
                }
            });
            
            // Handle case where no data was found
            if (minArea === Infinity) minArea = 0;
            
            wetlandsDataRef.current = wetlandsMap;
            setWetlandsData(wetlandsMap);
            setDataStats({ min: minArea, max: maxArea });
            setShowLegend(true);
            setStatusMessage(`Loaded wetland data for ${Object.keys(wetlandsMap).length} states`);
        };

        if (usStates && usStates.length > 0) {
            loadWetlandsData();
        }
    }, [usStates]);

    // Load stream data for all states from JSON file on mount
    useEffect(() => {
        const loadStreamsData = () => {
            const streamsMap = {};
            let minLength = Infinity;
            let maxLength = 0;

            // Load data for each state from the imported JSON
            usStates.forEach((state) => {
                const stateData = streamStatsData[state.abbr];
                
                if (stateData) {
                    // Convert from km to miles (1 km = 0.621371 miles)
                    const length = (stateData.total_stream_length || 0) * 0.621371;
                    streamsMap[state.name] = {
                        abbr: state.abbr,
                        totalLength: length,
                        streamsCount: stateData.total_stream_count || 0
                    };
                    
                    if (length > 0) {
                        minLength = Math.min(minLength, length);
                        maxLength = Math.max(maxLength, length);
                    }
                }
            });
            
            // Handle case where no data was found
            if (minLength === Infinity) minLength = 0;
            
            setStreamsData(streamsMap);
            setStreamStats({ min: minLength, max: maxLength });
        };

        if (usStates && usStates.length > 0) {
            loadStreamsData();
        }
    }, [usStates]);

    // Fetch CONUS stats from API when query changes
    useEffect(() => {
        const fetchConusStats = async () => {
            // Require only the query relevant to the active domain
            const needsStream = domain === 'streams' || domain === 'both';
            const needsWetland = domain === 'wetlands' || domain === 'both';
            if (needsStream && (!streamQuery || streamQuery.length === 0)) return;
            if (needsWetland && (!wetlandQuery || wetlandQuery.length === 0)) return;
            
            setConusStatsLoading(true);
            setStatusMessage('Loading protected fraction data...');
            
            try {
                // Build URL using only the non-empty query parameters
                const queryParts = [streamQuery, wetlandQuery].filter(q => q && q.length > 0);
                const url = `https://agwater.org:5556/wotus/conus_stats?${queryParts.join('&')}`;
                const response = await fetch(url, {
                    headers: {
                        "X-API-Key": "agwater-web-app"
                    }
                });
                const result = await response.json();
                
                if (result.success && result.data) {
                    // Process wetland stats
                    const wetlandsMap = {};
                    let wetlandsMinFraction = 100;
                    let wetlandsMaxFraction = 0;
                    
                    if (result.data.wetland_stats) {
                        result.data.wetland_stats.forEach(stat => {
                            const stateObj = usStates.find(s => s.abbr === stat.State);
                            if (stateObj) {
                                const fraction = stat.Total_Wetland_Acres > 0 
                                    ? (stat.Protected_Wetland_Acres / stat.Total_Wetland_Acres) * 100 
                                    : 0;
                                wetlandsMap[stateObj.name] = {
                                    abbr: stat.State,
                                    protectedArea: stat.Protected_Wetland_Acres,
                                    totalArea: stat.Total_Wetland_Acres,
                                    fraction: fraction
                                };
                                if (fraction > 0) {
                                    wetlandsMinFraction = Math.min(wetlandsMinFraction, fraction);
                                    wetlandsMaxFraction = Math.max(wetlandsMaxFraction, fraction);
                                }
                            }
                        });
                    }
                    
                    // Process stream stats
                    const streamsMap = {};
                    let streamsMinFraction = 100;
                    let streamsMaxFraction = 0;
                    
                    if (result.data.stream_stats) {
                        result.data.stream_stats.forEach(stat => {
                            const stateObj = usStates.find(s => s.abbr === stat.State);
                            if (stateObj) {
                                const fraction = stat.Total_Stream_Length_km > 0 
                                    ? (stat.Protected_Stream_Length_km / stat.Total_Stream_Length_km) * 100 
                                    : 0;
                                streamsMap[stateObj.name] = {
                                    abbr: stat.State,
                                    protectedLength: stat.Protected_Stream_Length_km * 0.621371, // Convert to miles
                                    totalLength: stat.Total_Stream_Length_km * 0.621371,
                                    fraction: fraction
                                };
                                if (fraction > 0) {
                                    streamsMinFraction = Math.min(streamsMinFraction, fraction);
                                    streamsMaxFraction = Math.max(streamsMaxFraction, fraction);
                                }
                            }
                        });
                    }
                    
                    if (wetlandsMinFraction === 100) wetlandsMinFraction = 0;
                    if (streamsMinFraction === 100) streamsMinFraction = 0;
                    
                    setConusStats({ wetlands: wetlandsMap, streams: streamsMap });
                    setFractionStats({
                        wetlandsMin: wetlandsMinFraction,
                        wetlandsMax: wetlandsMaxFraction,
                        streamsMin: streamsMinFraction,
                        streamsMax: streamsMaxFraction
                    });
                    setStatusMessage(`Loaded protected fraction data for ${Object.keys(wetlandsMap).length} states`);
                } else {
                    console.error('Error fetching CONUS stats:', result.message);
                    setStatusMessage('Error loading protected fraction data');
                }
            } catch (error) {
                console.error('Error fetching CONUS stats:', error);
                setStatusMessage('Error loading protected fraction data');
            } finally {
                setConusStatsLoading(false);
            }
        };

        fetchConusStats();
    }, [streamQuery, wetlandQuery, usStates, domain]);

    // Initialize the map
    useEffect(() => {
        // get the MapView for the map
        const mapElement = document.querySelector("arcgis-map");
        mapView.current = mapElement;

        // Add event listener for view ready
        const handleViewReady = async () => {
            if (!mapView.current?.view) return;

            const view = mapView.current.view;
            viewRef.current = view;

            // Disable the built-in auto-popup behavior so only our click handler
            // drives popup opening. Without this, every click triggers BOTH the
            // ArcGIS auto-popup and our manual view.popup.open() call, which
            // causes the popup widget to enter an inconsistent state after ~2 clicks.
            view.popupEnabled = false;

            // Add event listener for zoom changes
            view.watch('zoom', (newZoom) => {
                setCurrentZoom(Math.round(newZoom));
            });

            // Add event listener for extent changes (pan/zoom)
            view.watch('extent', (newExtent) => {
                //console.log('Extent changed:', newExtent);
                // You can update status or perform other actions here
            });

            // Add event listener for center changes (pan)
            view.watch('center', (newCenter) => {
                //console.log('Center changed:', newCenter);
            });

            // Add event listener for stationary (when map stops moving)
            view.watch('stationary', (isStationary) => {
                if (isStationary) {
                    //console.log('Map view is now stationary');
                    //setStatusMessage(`View updated - Zoom: ${Math.round(view.zoom)}`);
                    if (onViewStateChange && view.center) {
                        onViewStateChange({
                            center: `${view.center.longitude}, ${view.center.latitude}`,
                            zoom: Math.round(view.zoom)
                        });
                    }
                    if (updateNHDStreamLayerFn.current) updateNHDStreamLayerFn.current(view);
                    if (updateWetlandsFeatureLayerFn.current) updateWetlandsFeatureLayerFn.current(view);
                }
            });

            // Add click event listener for feature popups
            view.on('click', async (event) => {
                // Set clicked location for PrecipEtData panel
                setClickedLocation({ lat: event.mapPoint.latitude, lon: event.mapPoint.longitude });

                // Fire location callback with the clicked map coordinates
                if (onLocationClick) {
                    onLocationClick(event.mapPoint.latitude, event.mapPoint.longitude);
                }

                // Perform a hitTest to check if any features were clicked
                const response = await view.hitTest(event);

                // Close any existing popup first to guarantee a clean state
                // before opening a new one (avoids stuck popup after rapid clicks).
                view.closePopup();

                if (response.results.length > 0) {
                    const graphic = response.results[0].graphic;

                    // Open popup at the clicked location
                    view.openPopup({
                        location: event.mapPoint,
                        features: [graphic]
                    });
                }
            });

            // Load GeoJSON layer after view is ready
            await loadGeoJSONLayer();
        }

        // Add or remove the NHD Flowlines FeatureLayer based on current zoom level.
        // The layer uses a definitionExpression so the server only returns features
        // within the map's current extent, keeping the request small.
        const updateNHDStreamLayer = (view) => {
            if (!mapView.current?.map) return;
            if (domain === 'wetlands') return;
            const zoom = Math.round(view.zoom);

            if (zoom >= NHD_STREAM_MIN_ZOOM) {
                if (!nhdStreamLayer.current) {
                    // Create the layer once; ArcGIS will automatically filter to the
                    // current extent because we leave geometry set to the view extent.
                    // Use protection-aware renderer based on current stream query criteria
                    const criteria = parseStreamProtectionCriteria(streamQueryRef.current);
                    const streamLayer = new FeatureLayer({
                        url: NHD_STREAM_SERVICE_URL,
                        title: 'NHD Stream Flowlines',
                        outFields: ['*'],
                        renderer: buildStreamProtectionRenderer(criteria),
                        popupTemplate: {
                            title: '{GNIS_NAME}',
                            content: [
                                {
                                    type: 'fields',
                                    fieldInfos: [
                                        { fieldName: 'GNIS_NAME',   label: 'Stream Name' },
                                        { fieldName: 'LENGTHKM',   label: 'Length (km)' },
                                        { fieldName: 'STREAMORDE', label: 'Stream Order' },
                                        { fieldName: 'FTYPE',      label: 'Feature Type' }
                                    ]
                                }
                            ]
                        }
                    });
                    mapView.current.map.add(streamLayer);
                    nhdStreamLayer.current = streamLayer;
                    setStatusMessage(`Stream flowlines loaded (zoom ${zoom})`);
                }
                // Layer already exists — ArcGIS SDK automatically refreshes the
                // visible features as the user pans/zooms.
            } else {
                // Zoom is below threshold — remove the layer to avoid fetching
                // an enormous dataset at small scales.
                if (nhdStreamLayer.current) {
                    mapView.current.map.remove(nhdStreamLayer.current);
                    nhdStreamLayer.current = null;
                }
            }
        };

        // Add or remove the WOTUS Wetlands FeatureLayer based on toggle and zoom level.
        // Only fetches features within the current view extent (ArcGIS on-demand behavior).
        const updateWetlandsFeatureLayer = (view) => {
            if (!mapView.current?.map) return;
            const zoom = Math.round(view.zoom);

            if (zoom >= WETLANDS_MIN_ZOOM) {
                if (!wetlandsFeatureLayerRef.current) {
                    // Create the wetlands feature layer — ArcGIS automatically paginates
                    // to only fetch features within the current view extent.
                    // Build protection-aware renderer based on current wetland query criteria
                    const wetlandCriteria = parseWetlandProtectionCriteria(wetlandQueryRef.current);
                    const wetlandsLayer = new FeatureLayer({
                        url: WETLANDS_FEATURE_SERVICE_URL,
                        title: 'WOTUS Wetlands',
                        outFields: ['*'],
                        definitionExpression: buildWetlandDefinitionExpression(wetlandCriteria),
                        renderer: buildWetlandProtectionRenderer(wetlandCriteria),
                        popupTemplate: {
                            title: '{WETLAND_TYPE}',
                            content: [
                                {
                                    type: 'fields',
                                    fieldInfos: [
                                        { fieldName: 'WETLAND_TYPE',  label: 'Wetland Type' },
                                        { fieldName: 'ATTRIBUTE',     label: 'Attribute' },
                                        { fieldName: 'ACRES',         label: 'Area (acres)',
                                          format: { digitSeparator: true, places: 2 } },
                                        { fieldName: 'Near_Order',    label: 'Nearest Stream Order' },
                                        { fieldName: 'Near_Dist',     label: 'Distance to Nearest Stream (m)',
                                          format: { digitSeparator: true, places: 0 } }
                                    ]
                                }
                            ]
                        }
                    });
                    mapView.current.map.add(wetlandsLayer);
                    wetlandsFeatureLayerRef.current = wetlandsLayer;
                    setStatusMessage(`Wetlands layer loaded (zoom ${zoom})`);
                }
                // Layer exists — ArcGIS SDK automatically refreshes visible features
                // as the user pans/zooms (on-demand mode).
            } else {
                // Zoom below threshold — remove to avoid fetching the full dataset.
                if (wetlandsFeatureLayerRef.current) {
                    mapView.current.map.remove(wetlandsFeatureLayerRef.current);
                    wetlandsFeatureLayerRef.current = null;
                    //setStatusMessage(`Zoom in to level ${WETLANDS_MIN_ZOOM}+ to see wetland features`);
                }
            }
        };

        // Store update functions in refs so toggle effects can invoke them
        updateNHDStreamLayerFn.current = updateNHDStreamLayer;
        updateWetlandsFeatureLayerFn.current = updateWetlandsFeatureLayer;


        // Load GeoJSON layer
        const loadGeoJSONLayer = async () => {
            if (!mapView.current?.view) return;

            try {
                // Create GeoJSON layer from the public folder
                const geoJSON = new GeoJSONLayer({
                    url: "/apps/wotus/gz_2010_us_040_00_20m.json",
                    title: "US States",
                    renderer: {
                        type: "simple",
                        symbol: {
                            type: "simple-fill",
                            color: [0, 0, 0, 0.1],
                            outline: {
                                color: [0, 0, 0, 0.4],
                                width: 1
                            }
                        }
                    },
                    popupTemplate: {
                        title: "{NAME}",
                        content: async (feature) => {
                            const stateName = feature.graphic.attributes.NAME;
                            const stateAbbr = usStates.find(s => s.name === stateName)?.abbr;
                            
                            if (!stateAbbr) {
                                return `<p>State abbreviation not found for ${stateName}</p>`;
                            }

                            // Update the current state in parent component (this will trigger query regeneration)
                            setCurrentState(stateAbbr);

                            // Create loading placeholder
                            const container = document.createElement('div');
                            container.innerHTML = '<div style="text-align: center; padding: 20px;">Loading statistics...</div>';

                            // Build query strings based on current query, replacing State parameter
                            const buildQueryForState = (baseQuery, state) => {
                                if (!baseQuery || baseQuery.length === 0) {
                                    return `state=${state}`;
                                }
                                // Replace existing State parameter or add it
                                const params = new URLSearchParams(baseQuery);
                                // Handle both 'State' and 'state' parameter names
                                if (params.has('State')) {
                                    params.delete('State');
                                }
                                if (params.has('state')) {
                                    params.delete('state');
                                }
                                params.set('state', state);
                                return params.toString();
                            };

                            const stateQuery = buildQueryForState(query, stateAbbr);

                            // Fetch data based on domain
                            let fetchWetlandsData = null;
                            let fetchStreamsData = null;

                            if (domain === 'wetlands' || domain === 'both') {
                                fetchWetlandsData = fetch(`https://agwater.org:5556/wotus/wetlands?${stateQuery}`, {
                                    headers: { "X-API-Key": "agwater-web-app" }
                                }).then(res => res.json());
                            }

                            if (domain === 'streams' || domain === 'both') {
                                fetchStreamsData = fetch(`https://agwater.org:5556/wotus/streams?${stateQuery}`, {
                                    headers: { "X-API-Key": "agwater-web-app" }
                                }).then(res => res.json());
                            }

                            // Wait for requests based on domain
                            const requests = [];
                            if (fetchWetlandsData) requests.push(fetchWetlandsData);
                            if (fetchStreamsData) requests.push(fetchStreamsData);

                            Promise.all(requests)
                                .then((results) => {
                                    const formatter = new Intl.NumberFormat('en-US');
                                    let wetlandsResult = null;
                                    let streamsResult = null;

                                    // Parse results based on domain
                                    if (domain === 'wetlands') {
                                        wetlandsResult = results[0];
                                    } else if (domain === 'streams') {
                                        streamsResult = results[0];
                                    } else if (domain === 'both') {
                                        wetlandsResult = results[0];
                                        streamsResult = results[1];
                                    }
                                    
                                    let contentHTML = '';
                                    
                                    // Wetlands data
                                    if (domain === 'wetlands' || domain === 'both') {
                                        let wetlandsHTML = '<div style="color: red;">Error loading wetlands data</div>';
                                        if (wetlandsResult && wetlandsResult.success) {
                                            const totalWetlands = wetlandsResult.data.total_wetlands_area;
                                            const protectedWetlands = wetlandsResult.data.query_wetlands_area;
                                            const wetlandsPercent = totalWetlands > 0 
                                                ? ((protectedWetlands / totalWetlands) * 100).toFixed(1) 
                                                : '0.0';
                                            
                                            wetlandsHTML = `
                                                <div style="margin-bottom: 5px;"><strong>Total Area:</strong> ${formatter.format(totalWetlands.toFixed(0))} acres</div>
                                                <div style="margin-bottom: 5px;"><strong>Protected Area:</strong> ${formatter.format(protectedWetlands.toFixed(0))} acres</div>
                                                <div><strong>Protected:</strong> ${wetlandsPercent}%</div>
                                            `;
                                        }
                                        contentHTML += `
                                            <div>
                                                <h4 style="margin-top: 0; margin-bottom: 10px; color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 5px;">Wetlands</h4>
                                                ${wetlandsHTML}
                                            </div>
                                        `;
                                    }

                                    // Streams data
                                    if (domain === 'streams' || domain === 'both') {
                                        let streamsHTML = '<div style="color: red;">Error loading streams data</div>';
                                        if (streamsResult && streamsResult.success) {
                                            const totalStreams = streamsResult.data.total_stream_length / 1.609; // Convert to miles
                                            const protectedStreams = streamsResult.data.query_stream_length / 1.609;
                                            const streamsPercent = totalStreams > 0 
                                                ? ((protectedStreams / totalStreams) * 100).toFixed(1) 
                                                : '0.0';
                                            
                                            streamsHTML = `
                                                <div style="margin-bottom: 5px;"><strong>Total Length:</strong> ${formatter.format(totalStreams.toFixed(0))} miles</div>
                                                <div style="margin-bottom: 5px;"><strong>Protected Length:</strong> ${formatter.format(protectedStreams.toFixed(0))} miles</div>
                                                <div><strong>Protected:</strong> ${streamsPercent}%</div>
                                            `;
                                        }
                                        contentHTML += `
                                            <div>
                                                <h4 style="margin-top: 0; margin-bottom: 10px; color: #52c41a; border-bottom: 2px solid #52c41a; padding-bottom: 5px;">Streams</h4>
                                                ${streamsHTML}
                                            </div>
                                        `;
                                    }

                                    const gridColumns = (domain === 'both') ? '1fr 1fr' : '1fr';
                                    container.innerHTML = `
                                        <div style="display: grid; grid-template-columns: ${gridColumns}; gap: 20px; padding: 10px;">
                                            ${contentHTML}
                                        </div>
                                    `;
                                })
                                .catch(error => {
                                    console.error('Error fetching state statistics:', error);
                                    container.innerHTML = '<div style="color: red; padding: 10px;">Error loading statistics</div>';
                                });

                            return container;
                        }
                    }
                });

                // Add to map
                mapView.current.map.add(geoJSON);
                geoJSONLayer.current = geoJSON;

                // Wait for layer to load
                await geoJSON.load();
                setGeoJSONLayerReady(true);
                setStatusMessage('GeoJSON layer loaded');
            } catch (error) {
                console.error('Error loading GeoJSON layer:', error);
                setStatusMessage('Error loading GeoJSON layer');
            }
        };

        // Wait for arcgis-map to be ready
        if (mapElement) {
            mapElement.addEventListener('arcgisViewReadyChange', handleViewReady);

            const arcgisSearch = document.querySelector("arcgis-search");
            //arcgisSearch.addEventListener("arcgisSearchComplete", async (event) => {
            //    const result = event.detail.results[0].results[0].name;
            //    setStatusMessage(`Search result: ${result}`);
            //});
            arcgisSearch.addEventListener("arcgisSelectResult", async (event) => {
                const result = event.detail.result.name;
                // parse results to look for state name and set currentState
                const matchedState = usStates.find(s => result.includes(s.name));
                if (matchedState) {
                    setCurrentState(matchedState.abbr);
                }
                setStatusMessage(`Search result: ${result}`);
            });
        }

        // Load the selected layer
        const loadStateFeatures = async () => {
            if (!mapView.current) return;

            if (currentState == null) return;

            if (mapView.current.zoom < 12) {
                //    //message.warning('Please zoom in to level 5 or higher to view wetlands data.');
                //    return;
            }
            setLoading(true);
            //setStatusMessage('Loading layer...');

            try {
                // Remove existing feature layer if any
                if (featureLayer.current) {
                    mapView.current.map.remove(featureLayer.current);
                }

                // Get state name from abbreviation
                const stateObj = usStates.find(s => s.abbr === currentState);
                const currentStateName = stateObj ? stateObj.name : currentState;

                // Create new feature layer with color-coded renderer based on WETLAND_TYPE
                /*
                const newLayer = new FeatureLayer({
                    url: `${FEATURE_SERVICE_URL}/${currentState}`,
                    outFields: ['*'],
                    title: `${currentStateName} Wetlands`,
                    popupTemplate: {
                        title: '{WETLAND_TYPE}',
                        content: [
                            {
                                type: 'fields',
                                fieldInfos: [
                                    {
                                        fieldName: 'WETLAND_TYPE',
                                        label: 'Wetland Type'
                                    },
                                    {
                                        fieldName: 'ATTRIBUTE',
                                        label: 'Attribute'
                                    },
                                    {
                                        fieldName: 'ACRES',
                                        label: 'Area (acres)',
                                        format: {
                                            digitSeparator: true,
                                            places: 2
                                        }
                                    },
                                    {
                                        fieldName: 'WETLAND_ORDER',
                                        label: 'Wetland Order'
                                    }
                                ]
                            }
                        ]
                    },
                    renderer: {
                        type: 'unique-value',
                        field: 'WETLAND_TYPE',
                        defaultSymbol: {
                            type: 'simple-fill',
                            color: [200, 200, 200, 0.3],
                            outline: {
                                color: [150, 150, 150, 0.6],
                                width: 1
                            }
                        },
                        uniqueValueInfos: wetlandTypes.map(wtype => ({
                            value: wtype[0],
                            symbol: {
                                type: 'simple-fill',
                                color: [...wtype[1], 0.5],
                                outline: {
                                    color: [...wtype[1], 0.9],
                                    width: 2
                                }
                            },
                            label: wtype[0]
                        }))
                    }
                });

                // Add layer to map
                mapView.current.map.add(newLayer);
                featureLayer.current = newLayer;

                // Wait for layer to load and get extent
                await newLayer.load();

                // Query for feature count
                const query = newLayer.createQuery();
                query.where = '1=1';
                query.returnGeometry = false;

                const result = await newLayer.queryFeatureCount(query);
                setFeatureCount(result);

                // Zoom to layer extent if available
                if (newLayer.fullExtent) {
                    await mapView.current.goTo(newLayer.fullExtent.expand(1.2));
                } else {
                    // Zoom to Oregon
                    const oregonExtent = {
                        xmin: -124.79,
                        ymin: 41.98,
                        xmax: -116.47,
                        ymax: 49.05,
                        spatialReference: { wkid: 4326 }
                    };
                    await mapView.current.goTo(oregonExtent);
                }
                

                setStatusMessage(`Loaded ${currentState} (${result} features)`);
            */
                } catch (error) {
                console.error('Error loading layer:', error);
                //message.error('Failed to load layer');
                setStatusMessage('Error loading layer');
            } finally {
                setLoading(false);
            }
        };

        if (currentState) {
            loadStateFeatures();
        }

        return () => {
            if (mapElement) {
                mapElement.removeEventListener('arcgisViewReadyChange', handleViewReady);
            }
        };

    }, [currentState, usStates]);

    // Update NHD stream layer renderer when stream protection criteria change
    useEffect(() => {
        streamQueryRef.current = streamQuery;
        if (nhdStreamLayer.current) {
            const criteria = parseStreamProtectionCriteria(streamQuery);
            nhdStreamLayer.current.renderer = buildStreamProtectionRenderer(criteria);
        }
    }, [streamQuery]);

    // Update wetlands feature layer renderer and filter when wetland protection criteria change
    useEffect(() => {
        wetlandQueryRef.current = wetlandQuery;
        if (wetlandsFeatureLayerRef.current) {
            const criteria = parseWetlandProtectionCriteria(wetlandQuery);
            wetlandsFeatureLayerRef.current.renderer = buildWetlandProtectionRenderer(criteria);
            wetlandsFeatureLayerRef.current.definitionExpression = buildWetlandDefinitionExpression(criteria);
        }
    }, [wetlandQuery]);

    // Zoom to selected state
    useEffect(() => {
        const zoomToState = async () => {
            if (!mapView.current?.view || !currentState || !geoJSONLayer.current) return;

            try {
                const view = mapView.current.view;
                const layer = geoJSONLayer.current;

                // Wait for layer to be loaded
                await layer.load();

                // Query for the selected state
                const query = layer.createQuery();
                query.where = `STATE = '${currentState.toString().padStart(2, '0')}'`;
                query.returnGeometry = true;

                const result = await layer.queryFeatures(query);

                if (result.features.length > 0) {
                    // Zoom to the state's extent
                    await view.goTo({
                        target: result.features[0].geometry,
                        zoom: 7
                    });
                    setStatusMessage(`Zoomed to ${usStates.find(s => s.abbr === currentState)?.name || currentState}`);
                }
            } catch (error) {
                console.error('Error zooming to state:', error);
            }
        };

        zoomToState();
    }, [currentState, usStates]);

    // Update layer renderer based on gradient mode
    useEffect(() => {
        if (!geoJSONLayer.current || !geoJSONLayerReady) return;

        const updateRenderer = async () => {
            try {
                const layer = geoJSONLayer.current;
                const formatter = new Intl.NumberFormat('en-US');

                // If stats layer is toggled off, reset to plain renderer
                if (!showStatsLayer) {
                    layer.renderer = {
                        type: "simple",
                        symbol: {
                            type: "simple-fill",
                            color: [0, 0, 0, 0.1],
                            outline: {
                                color: [0, 0, 0, 0.4],
                                width: 1
                            }
                        }
                    };
                    setShowLegend(false);
                    //setStatusMessage('State statistics layer hidden');
                    return;
                }

                // Handle 'wetlands' mode
                if (gradientMode === 'wetlands' && Object.keys(wetlandsData).length > 0) {
                    let minArea = Infinity;
                    let maxArea = 0;
                    Object.values(wetlandsData).forEach(data => {
                        if (data.totalArea > 0) {
                            minArea = Math.min(minArea, data.totalArea);
                            maxArea = Math.max(maxArea, data.totalArea);
                        }
                    });
                    if (minArea === Infinity) minArea = 0;

                    const uniqueValueInfos = Object.entries(wetlandsData).map(([stateName, data]) => {
                        const color = getColorForWetlandArea(data.totalArea, minArea, maxArea);
                        return {
                            value: stateName,
                            symbol: {
                                type: "simple-fill",
                                color: color,
                                outline: {
                                    color: [50, 50, 50, 0.9],
                                    width: 1
                                }
                            },
                            label: `${stateName}: ${formatter.format(Math.round(data.totalArea))} acres`
                        };
                    });

                    layer.renderer = {
                        type: "unique-value",
                        field: "NAME",
                        defaultSymbol: {
                            type: "simple-fill",
                            color: [200, 200, 200, 0.5],
                            outline: {
                                color: [100, 100, 100, 0.8],
                                width: 1
                            }
                        },
                        uniqueValueInfos: uniqueValueInfos
                    };

                    setDataStats({ min: minArea, max: maxArea });
                    setShowLegend(true);
                    setStatusMessage(`Map colored by wetland area (${Object.keys(wetlandsData).length} states)`);
                }

                // Handle 'streams' mode
                if (gradientMode === 'streams' && Object.keys(streamsData).length > 0) {
                    let minLength = Infinity;
                    let maxLength = 0;
                    Object.values(streamsData).forEach(data => {
                        if (data.totalLength > 0) {
                            minLength = Math.min(minLength, data.totalLength);
                            maxLength = Math.max(maxLength, data.totalLength);
                        }
                    });
                    if (minLength === Infinity) minLength = 0;

                    const uniqueValueInfos = Object.entries(streamsData).map(([stateName, data]) => {
                        const color = getColorForStreamLength(data.totalLength, minLength, maxLength);
                        return {
                            value: stateName,
                            symbol: {
                                type: "simple-fill",
                                color: color,
                                outline: {
                                    color: [50, 50, 50, 0.9],
                                    width: 1
                                }
                            },
                            label: `${stateName}: ${formatter.format(Math.round(data.totalLength))} miles`
                        };
                    });

                    layer.renderer = {
                        type: "unique-value",
                        field: "NAME",
                        defaultSymbol: {
                            type: "simple-fill",
                            color: [200, 200, 200, 0.5],
                            outline: {
                                color: [100, 100, 100, 0.8],
                                width: 1
                            }
                        },
                        uniqueValueInfos: uniqueValueInfos
                    };

                    setStreamStats({ min: minLength, max: maxLength });
                    setShowLegend(true);
                    setStatusMessage(`Map colored by stream length (${Object.keys(streamsData).length} states)`);
                }

                // Handle 'wetlandsFraction' mode - protected wetland fraction
                if (gradientMode === 'wetlandsFraction' && Object.keys(conusStats.wetlands).length > 0) {
                    const uniqueValueInfos = Object.entries(conusStats.wetlands).map(([stateName, data]) => {
                        const color = getColorForWetlandProtectedFraction(data.fraction);
                        return {
                            value: stateName,
                            symbol: {
                                type: "simple-fill",
                                color: color,
                                outline: {
                                    color: [50, 50, 50, 0.9],
                                    width: 1
                                }
                            },
                            label: `${stateName}: ${data.fraction.toFixed(1)}%`
                        };
                    });

                    layer.renderer = {
                        type: "unique-value",
                        field: "NAME",
                        defaultSymbol: {
                            type: "simple-fill",
                            color: [200, 200, 200, 0.5],
                            outline: {
                                color: [100, 100, 100, 0.8],
                                width: 1
                            }
                        },
                        uniqueValueInfos: uniqueValueInfos
                    };

                    setShowLegend(true);
                    setStatusMessage(`Map colored by protected wetland fraction (${Object.keys(conusStats.wetlands).length} states)`);
                }

                // Handle 'streamsFraction' mode - protected stream fraction
                if (gradientMode === 'streamsFraction' && Object.keys(conusStats.streams).length > 0) {
                    const uniqueValueInfos = Object.entries(conusStats.streams).map(([stateName, data]) => {
                        const color = getColorForStreamProtectedFraction(data.fraction);
                        return {
                            value: stateName,
                            symbol: {
                                type: "simple-fill",
                                color: color,
                                outline: {
                                    color: [50, 50, 50, 0.9],
                                    width: 1
                                }
                            },
                            label: `${stateName}: ${data.fraction.toFixed(1)}%`
                        };
                    });

                    layer.renderer = {
                        type: "unique-value",
                        field: "NAME",
                        defaultSymbol: {
                            type: "simple-fill",
                            color: [200, 200, 200, 0.5],
                            outline: {
                                color: [100, 100, 100, 0.8],
                                width: 1
                            }
                        },
                        uniqueValueInfos: uniqueValueInfos
                    };

                    setShowLegend(true);
                    setStatusMessage(`Map colored by protected stream fraction (${Object.keys(conusStats.streams).length} states)`);
                }
            } catch (error) {
                console.error('Error updating renderer:', error);
            }
        };

        updateRenderer();
    }, [wetlandsData, streamsData, conusStats, geoJSONLayerReady, gradientMode, showStatsLayer]);

    return (
        <Row style={{ height: '100%', width: '100%' }}>
            <Col style={{width: '100%', height: '100%'}}>
                <span>
                    {loading && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1000
                        }}>
                            <Spin size="large" />
                        </div>
                    )}
                </span>

                <div style={{ position: 'relative' }}>
                    <arcgis-map id="wotusMap"
                        basemap="streets-vector"
                        center={initialCenter || "-98.5795, 39.8283"}
                        zoom={initialZoom || 3}
                        style={{
                            width: '100%',
                            height: '36em',
                            display: loading ? 'none' : 'block'
                        }}>
                        <arcgis-zoom slot="top-left"></arcgis-zoom>
                        <arcgis-search slot="top-right" ></arcgis-search>
                    </arcgis-map>
                    
                    {/* Dynamic Legend based on gradient mode */}
                    {showLegend && gradientMode === 'wetlands' && dataStats.max > 0 && (
                        <div style={{
                            position: 'absolute',
                            bottom: '30px',
                            left: '10px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 100,
                            minWidth: '200px'
                        }}>
                            <div style={{ 
                                fontWeight: 'bold', 
                                marginBottom: '8px', 
                                fontSize: '13px',
                                color: '#333'
                            }}>
                                Wetland Area
                            </div>
                            <div style={{
                                height: '16px',
                                background: getLegendGradientCSS(),
                                borderRadius: '4px',
                                marginBottom: '6px'
                            }} />
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                fontSize: '11px',
                                color: '#666'
                            }}>
                                <span>{formatter.format(Math.round(dataStats.min))} acres</span>
                                <span>{formatter.format(Math.round(dataStats.max))} acres</span>
                            </div>
                        </div>
                    )}
                    
                    {showLegend && gradientMode === 'streams' && streamStats.max > 0 && (
                        <div style={{
                            position: 'absolute',
                            bottom: '30px',
                            left: '10px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 100,
                            minWidth: '200px'
                        }}>
                            <div style={{ 
                                fontWeight: 'bold', 
                                marginBottom: '8px', 
                                fontSize: '13px',
                                color: '#333'
                            }}>
                                Stream Length
                            </div>
                            <div style={{
                                height: '16px',
                                background: getStreamLegendGradientCSS(),
                                borderRadius: '4px',
                                marginBottom: '6px'
                            }} />
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                fontSize: '11px',
                                color: '#666'
                            }}>
                                <span>{formatter.format(Math.round(streamStats.min))} miles</span>
                                <span>{formatter.format(Math.round(streamStats.max))} miles</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Wetlands Protected Fraction Legend */}
                    {showLegend && gradientMode === 'wetlandsFraction' && Object.keys(conusStats.wetlands).length > 0 && (
                        <div style={{
                            position: 'absolute',
                            bottom: '30px',
                            left: '10px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 100,
                            minWidth: '200px'
                        }}>
                            <div style={{ 
                                fontWeight: 'bold', 
                                marginBottom: '8px', 
                                fontSize: '13px',
                                color: '#333'
                            }}>
                                Wetland Area Protected
                            </div>
                            <div style={{
                                height: '16px',
                                background: getWetlandProtectedFractionLegendGradientCSS(),
                                borderRadius: '4px',
                                marginBottom: '6px'
                            }} />
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                fontSize: '11px',
                                color: '#666'
                            }}>
                                <span>{fractionStats.wetlandsMin.toFixed(1)}%</span>
                                <span>{fractionStats.wetlandsMax.toFixed(1)}%</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Streams Protected Fraction Legend */}
                    {showLegend && gradientMode === 'streamsFraction' && Object.keys(conusStats.streams).length > 0 && (
                        <div style={{
                            position: 'absolute',
                            bottom: '30px',
                            left: '10px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 100,
                            minWidth: '200px'
                        }}>
                            <div style={{ 
                                fontWeight: 'bold', 
                                marginBottom: '8px', 
                                fontSize: '13px',
                                color: '#333'
                            }}>
                                Stream Length Protected
                            </div>
                            <div style={{
                                height: '16px',
                                background: getStreamProtectedFractionLegendGradientCSS(),
                                borderRadius: '4px',
                                marginBottom: '6px'
                            }} />
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                fontSize: '11px',
                                color: '#666'
                            }}>
                                <span>{fractionStats.streamsMin.toFixed(1)}%</span>
                                <span>{fractionStats.streamsMax.toFixed(1)}%</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Stream Flowlines Feature Legend - visible when zoomed in */}
                    {(domain === 'streams' || domain === 'both') && currentZoom >= NHD_STREAM_MIN_ZOOM && (
                        <div style={{
                            position: 'absolute',
                            bottom: '130px',
                            left: '10px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 100,
                            minWidth: '160px'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: '#333' }}>
                                Stream Flowlines
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                <div style={{ width: '28px', height: '3px', background: 'rgba(0, 60, 140, 0.9)', marginRight: '8px', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: '#333' }}>Protected</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '28px', height: '3px', background: 'rgba(198, 82, 72, 0.9)', marginRight: '8px', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: '#333' }}>Unprotected</span>
                            </div>
                        </div>
                    )}

                    {/* Wetlands Feature Legend - visible when zoomed in */}
                    {(domain === 'wetlands' || domain === 'both') && currentZoom >= WETLANDS_MIN_ZOOM && (
                        <div style={{
                            position: 'absolute',
                            bottom: '130px',
                            left: '10px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 100,
                            minWidth: '160px'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: '#333' }}>
                                Wetlands
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                <div style={{ width: '18px', height: '14px', background: 'rgba(70, 130, 180, 0.7)', border: '2px solid rgba(70, 130, 180, 0.9)', marginRight: '8px', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: '#333' }}>Protected</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    width: '18px',
                                    height: '14px',
                                    background: 'repeating-linear-gradient(-45deg, rgba(198, 82, 72, 0.7) 0px, rgba(198, 82, 72, 0.7) 2px, transparent 2px, transparent 4px)',
                                    border: '1px solid rgba(198, 82, 72, 0.6)',
                                    marginRight: '8px',
                                    flexShrink: 0
                                }} />
                                <span style={{ fontSize: '12px', color: '#333' }}>Unprotected</span>
                            </div>
                        </div>
                    )}

                    {/* Layer Toggles Panel */}
                    <div style={{
                        position: 'absolute',
                        bottom: '30px',
                        right: '10px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 100
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '12px', color: '#333' }}>
                            Layers
                        </div>
                        <Space direction="vertical" size={6}>
                            <div style={{ borderTop: '1px solid #e0e0e0', marginTop: '4px', paddingTop: '6px' }}>
                                <Space size={8}>
                                    <Switch
                                        size="small"
                                        checked={showStatsLayer}
                                        onChange={(checked) => setShowStatsLayer(checked)}
                                    />
                                    <span style={{ fontSize: '12px', color: '#333' }}>
                                        State Statistics
                                    </span>
                                </Space>
                                {showStatsLayer && (
                                    <Radio.Group
                                        value={gradientMode}
                                        onChange={(e) => setGradientMode(e.target.value)}
                                        size="small"
                                        style={{ marginTop: '6px', marginLeft: '4px' }}
                                    >
                                        <Space direction="vertical" size={2}>
                                            {domain === 'wetlands' && <Radio value="wetlands" style={{ fontSize: '11px', color: '#333' }}>Wetland Area</Radio>}
                                            {domain === 'streams' && <Radio value="streams" style={{ fontSize: '11px', color: '#333' }}>Stream Length</Radio>}
                                            {domain === 'wetlands' && <Radio value="wetlandsFraction" style={{ fontSize: '11px', color: '#333' }}>Wetland % Protected</Radio>}
                                            {domain === 'streams' && <Radio value="streamsFraction" style={{ fontSize: '11px', color: '#333' }}>Stream % Protected</Radio>}
                                        </Space>
                                    </Radio.Group>
                                )}
                            </div>
                        </Space>
                    </div>
                </div>

                <span style={{
                    marginTop: '10px',
                    padding: '8px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    textAlign: 'center'
                }}>
                    <Text type="secondary">{statusMessage || 'Ready'}</Text>
                    <Text type="secondary" style={{ float: 'right' }}>Zoom Level: {currentZoom}</Text>
                </span>

                {/* <div style={{ padding: '4px 8px' }}>
                    <Text type="secondary">Zoom in to level {NHD_STREAM_MIN_ZOOM}+ to see stream flowlines</Text>
                </div> */}
                <p>Zoom in to level {NHD_STREAM_MIN_ZOOM}+ to see stream flowlines</p>

                {/* Precipitation & ET data panel */}
                {clickedLocation && (
                    <PrecipEtData clickedLocation={clickedLocation} onClearLocation={() => setClickedLocation(null)} />
                )}
            </Col>
        </Row>
    );
};

WotusMap.propTypes = {
    domain: PropTypes.string.isRequired,
    streamQuery: PropTypes.string.isRequired,
    wetlandQuery: PropTypes.string.isRequired,
    currentState: PropTypes.string,
    usStates: PropTypes.array.isRequired,
    setCurrentState: PropTypes.func.isRequired,
    onLocationClick: PropTypes.func,
    initialCenter: PropTypes.string,
    initialZoom: PropTypes.number,
    onViewStateChange: PropTypes.func
};

export default WotusMap;