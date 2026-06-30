import { useEffect, useRef } from "react";


import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';


const WqMap = ({ feature_url = null, geoJson_url = null, center = [-120.5, 44.0], zoom = 5, height = 400 }) => {
    const mapContainer = useRef(null);
    const mapView = useRef(null);

    useEffect(() => {
        if (!mapContainer.current) return;

        const initializeMap = async () => {
            try {
                // Create map with basemap
                const map = new Map({
                    basemap: 'osm-3d',
                });

                // Create MapView
                mapView.current = new MapView({
                    container: mapContainer.current,
                    map: map,
                    center: center,
                    zoom: zoom,
                });

                // If feature_url is provided, load and display the feature
                if (geoJson_url) {
                    try {
                        const mapLayer = new GeoJSONLayer({
                            url: geoJson_url,
                            title: 'Custom Features',
                            renderer: {
                                type: 'simple',
                                symbol: {
                                    type: 'simple-fill',
                                    color: [0, 0, 0, 0], // fully transparent fill
                                    outline: {
                                        type: 'simple-line',
                                        color: [0, 0, 0, 0.6],
                                        width: 1
                                    }
                                }
                            }
                        });

                        map.add(mapLayer);
                    } catch (error) {
                        console.error('Error adding GeoJSON layer:', error);
                    }
                }

                if (feature_url) {
                    try {
                        // Check if it's a FeatureServer URL
                        if (feature_url.includes('FeatureServer')) {
                            // Add the feature layer directly from the URL
                            const featureLayer = new FeatureLayer({
                                url: feature_url
                            });

                            map.add(featureLayer);

                            // Zoom to the extent of the feature layer
                            await mapView.current.when(async () => {
                                if (featureLayer.loaded) {
                                    mapView.current.extent = featureLayer.fullExtent;
                                }
                            });
                        } else if (feature_url.includes('query')) {
                            // Handle GeoJSON or query endpoints
                            //const response = await fetch(feature_url);
                            //if (!response.ok) {
                            //    throw new Error(`Failed to fetch feature: ${response.status}`);
                            //}

                            //const geojson = await response.json();
                            // Create a graphics layer to display the features
                            const mapLayer = new GeoJSONLayer({
                                url: feature_url,
                                title: 'Custom Features',
                                renderer: {
                                    type: 'simple',
                                    symbol: {
                                        type: 'simple-fill',
                                        color: [0, 0, 0, 0], // fully transparent fill
                                        outline: {
                                            type: 'simple-line',
                                            color: [0, 0, 0, 0.6],
                                            width: 1
                                        }
                                    }
                                }
                            });
                            map.add(mapLayer);

                            /*
                              const graphicsLayer = new GraphicsLayer();
                              map.add(graphicsLayer);
                
                              // Process GeoJSON features
                              const features = geojson.features || [];
                              features.forEach((feature) => {
                                const geometry = feature.geometry;
                                const properties = feature.properties;
                
                                let graphicGeometry = null;
                
                                if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
                                  const rings = geometry.coordinates;
                                  graphicGeometry = {
                                    type: 'polygon',
                                    rings: rings[0] ? [rings[0]] : [],
                                    spatialReference: { wkid: 4326 }
                                  };
                                } else if (geometry.type === 'Point') {
                                  graphicGeometry = {
                                    type: 'point',
                                    longitude: geometry.coordinates[0],
                                    latitude: geometry.coordinates[1],
                                    spatialReference: { wkid: 4326 }
                                  };
                                } else if (geometry.type === 'LineString') {
                                  graphicGeometry = {
                                    type: 'polyline',
                                    paths: [geometry.coordinates],
                                    spatialReference: { wkid: 4326 }
                                  };
                                }
                
                                if (graphicGeometry) {
                                  let symbol, label;
                
                                  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
                                    symbol = {
                                      type: 'simple-fill',
                                      color: [51, 102, 153, 0.3],
                                      outline: {
                                        color: [51, 102, 153],
                                        width: 2
                                      }
                                    };
                                    label = properties?.name || 'Feature Area';
                                  } else if (geometry.type === 'Point') {
                                    symbol = {
                                      type: 'simple-marker',
                                      size: 10,
                                      color: [51, 102, 153],
                                      outline: {
                                        color: [255, 255, 255],
                                        width: 2
                                      }
                                    };
                                    label = properties?.name || 'Feature Point';
                                  } else if (geometry.type === 'LineString') {
                                    symbol = {
                                      type: 'simple-line',
                                      color: [51, 102, 153],
                                      width: 3
                                    };
                                    label = properties?.name || 'Feature Line';
                                  }
                
                                  const graphic = new Graphic({
                                    geometry: graphicGeometry,
                                    symbol: symbol,
                                    attributes: properties,
                                    popupTemplate: {
                                      title: label,
                                      content: properties ? Object.entries(properties)
                                        .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
                                        .join('') : 'Feature'
                                    }
                                  });
                
                                  graphicsLayer.add(graphic);
                                }
                              });
                
                              // Zoom to graphics extent
                              if (graphicsLayer.graphics.length > 0) {
                                await mapView.current.when(() => {
                                  const extent = graphicsLayer.graphics.reduce((acc, graphic) => {
                                    if (graphic.geometry && graphic.geometry.extent) {
                                      return acc ? acc.union(graphic.geometry.extent) : graphic.geometry.extent;
                                    }
                                    return acc;
                                  }, null);
                
                                  if (extent) {
                                    mapView.current.extent = extent.expand(1.2);
                                  }
                                });
                              }
                            }  */
                        }
                    } catch (error) {
                        console.error('Error loading feature from URL:', error);
                    }
                }

            } catch (err) {
                console.error('Error initializing map:', err);
            }
        };

        initializeMap();

        return () => {
            // Cleanup if needed
            if (mapView.current) {
                mapView.current.destroy();
            }
        };
    }, [feature_url, geoJson_url, center, zoom]);

    return (
        <div
            ref={mapContainer}
            style={{
                width: '100%',
                height: `${height}px`,
                borderRadius: 8,
                overflow: 'hidden'
            }}
        />
    );
};

// add export
export default WqMap;

