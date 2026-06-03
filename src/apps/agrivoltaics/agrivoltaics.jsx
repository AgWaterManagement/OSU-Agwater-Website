import { useEffect, useRef } from "react";
import { Row, Col, Typography, Button } from "antd";
import PropTypes from "prop-types";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-legend";
import { watch as reactiveWatch } from "@arcgis/core/core/reactiveUtils.js";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer.js";

const DELTA_ETO_RASTER_URL =
    "https://tiledimageservices1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/delta_et0_annual/ImageServer";

const ENERGY_PRODUCTION_RASTER_URL =
    "https://tiledimageservices1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/cleaned_energy_annual/ImageServer";

const YlRdColorRamp = {
    type: "algorithmic",
    algorithm: "cie-lab",
    fromColor: [255, 255, 0, 255],
    toColor: "#ad3c16ff",
};

const BluesColorRamp = {
    type: "algorithmic",
    algorithm: "cie-lab",
    fromColor: [240, 255, 255, 255],
    toColor: "#08519cff",
};

const ET_RENDERER = {
    type: "raster-stretch",
    customStatistics: [{ min: 0, max: 12 }],
    numberOfStandardDeviations: 1,
    colorRamp: BluesColorRamp,
    stretchType: "min-max",
};

const ENERGY_RENDERER = {
    type: "raster-stretch",
    customStatistics: [{ min: 200, max: 420 }],
    numberOfStandardDeviations: 1,
    colorRamp: YlRdColorRamp,
    stretchType: "min-max",
};

const RasterLayer = ({ url, id, title, opacity, renderer, zoomRef, viewRef }) => {
    const mapRef = useRef(null);
    const layerRef = useRef(null);

    const formatRasterValue = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => (typeof item === "number" ? item.toFixed(2) : String(item))).join(", ");
        }

        if (typeof value === "number") {
            return value.toFixed(2);
        }

        return value == null ? "No data" : String(value);
    };

    useEffect(() => {
        const mapElement = mapRef.current;
        if (!mapElement) return undefined;

        let zoomHandle = null;

        const handleViewReady = async () => {
            const view = mapElement.view;
            if (!view || !view.map) return;

            if (viewRef) {
                viewRef.current = view;
            }

            const updateZoomRef = () => {
                if (zoomRef) {
                    zoomRef.current = {
                        level: view.zoom,
                        center: [view.center.longitude, view.center.latitude],
                    };
                }
            };

            updateZoomRef();
            zoomHandle = reactiveWatch(() => [view.zoom, view.center?.latitude, view.center?.longitude], updateZoomRef);

            const existingLayer = view.map.findLayerById(id);
            const rasterLayer = existingLayer || new ImageryTileLayer({ id, url, title, opacity, renderer });

            if (!existingLayer) {
                view.map.add(rasterLayer);
            }

            layerRef.current = rasterLayer;

            const handleClick = async (event) => {
                const activeLayer = layerRef.current;
                if (!activeLayer) return;

                try {
                    const identifyResult = await activeLayer.identify(event.mapPoint, { timeExtent: view.timeExtent });
                    const rasterValue = formatRasterValue(identifyResult?.processedValue ?? identifyResult?.value);

                    view.closePopup();
                    view.openPopup({
                        location: event.mapPoint,
                        title: title || "Raster value",
                        content: `
                            <div style="min-width: 220px;">
                                <div><b>Lat:</b> ${event.mapPoint.latitude.toFixed(5)}<b>, Lon:</b> ${event.mapPoint.longitude.toFixed(5)}</div>
                                <div><b>Value:</b> ${rasterValue}</div>
                            </div>
                        `,
                    });
                } catch (error) {
                    console.warn("Unable to identify raster value at click location:", error);
                }
            };

            view.on("click", handleClick);

            try {
                await view.when();
                await rasterLayer.when();

                if (rasterLayer.fullExtent) {
                    await view.goTo(rasterLayer.fullExtent.expand(0.7));
                    rasterLayer.refresh?.();
                }
            } catch (error) {
                console.warn("Unable to zoom to raster extent:", error);
            }
        };

        mapElement.addEventListener("arcgisViewReadyChange", handleViewReady);

        return () => {
            mapElement.removeEventListener("arcgisViewReadyChange", handleViewReady);
            zoomHandle?.remove();

            if (viewRef?.current === mapElement.view) {
                viewRef.current = null;
            }
        };
    }, [id, opacity, renderer, title, url, viewRef, zoomRef]);

    return (
        <div style={{ width: "100%", height: 640, padding: 4 }}>
            <arcgis-map
                ref={mapRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                basemap="topo-vector"
                center="-121.5,38.8"
                zoom="10"
            >
                <arcgis-zoom position="top-left" />
                <arcgis-legend position="bottom-left" />
            </arcgis-map>
        </div>
    );
};

const WeightedAverageRasterLayer = ({ layers, zoomRef, viewRef }) => {
    const mapRef = useRef(null);
    const layerRefs = useRef([]);

    useEffect(() => {
        const mapElement = mapRef.current;
        if (!mapElement) return undefined;

        let zoomHandle = null;

        const handleViewReady = async () => {
            const view = mapElement.view;
            if (!view || !view.map) return;

            if (viewRef) {
                viewRef.current = view;
            }

            const updateZoomRef = () => {
                if (zoomRef) {
                    zoomRef.current = {
                        level: view.zoom,
                        center: [view.center.longitude, view.center.latitude],
                    };
                }
            };

            updateZoomRef();
            zoomHandle = reactiveWatch(() => [view.zoom, view.center?.latitude, view.center?.longitude], updateZoomRef);

            const activeLayers = layers.map((layerConfig, index) => {
                const existingLayer = view.map.findLayerById(layerConfig.id);
                const resolvedOpacity = layerConfig.opacity ?? 1;
                const resolvedBlendMode = layerConfig.blendMode ?? (index === 1 ? "average" : "normal");

                if (existingLayer) {
                    existingLayer.opacity = resolvedOpacity;
                    existingLayer.blendMode = resolvedBlendMode;
                    return existingLayer;
                }

                const nextLayer = new ImageryTileLayer({
                    id: layerConfig.id,
                    url: layerConfig.url,
                    title: layerConfig.title,
                    opacity: resolvedOpacity,
                    renderer: layerConfig.renderer,
                    blendMode: resolvedBlendMode,
                });

                view.map.add(nextLayer);
                return nextLayer;
            });

            layerRefs.current = activeLayers;

            try {
                await view.when();
                await Promise.all(activeLayers.map((layer) => layer.when()));

                const primaryLayer = activeLayers[0];
                if (primaryLayer?.fullExtent) {
                    await view.goTo(primaryLayer.fullExtent.expand(0.7));
                    activeLayers.forEach((layer) => layer.refresh?.());
                }
            } catch (error) {
                console.warn("Unable to zoom to weighted raster extent:", error);
            }
        };

        mapElement.addEventListener("arcgisViewReadyChange", handleViewReady);

        return () => {
            mapElement.removeEventListener("arcgisViewReadyChange", handleViewReady);
            zoomHandle?.remove();

            if (viewRef?.current === mapElement.view) {
                viewRef.current = null;
            }

            layerRefs.current = [];
        };
    }, [layers, viewRef, zoomRef]);

    return (
        <div style={{ width: "100%", height: 640, padding: 4 }}>
            <arcgis-map
                ref={mapRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                basemap="topo-vector"
                center="-121.5,38.8"
                zoom="10"
            >
                <arcgis-zoom position="top-left" />
                <arcgis-legend position="bottom-left" />
            </arcgis-map>
        </div>
    );
};

export default function Agrivoltaics() {
    const zoomEnergyProduction = useRef(null);
    const zoomWaterSavings = useRef(null);
    //const zoomWeightedAverage = useRef(null);
    const energyMapView = useRef(null);
    const waterSavingsMapView = useRef(null);
    //const weightedAverageMapView = useRef(null);

    return (
        <>
            <Row style={{ padding: 16 }}>
                <Col span={24}>
                    <Typography.Title level={2} style={{ color: "white" }}>
                        Agrivoltaics Suitability Mapping
                    </Typography.Title>
                    <span>
                        This map shows the suitability of land in US Agricultural Areas for agrivoltaic siting,
                        which combines agriculture with solar energy production. 
                        These maps can help identify areas where agrivoltaics may be most beneficial.  The maps
                        show two key factors: the energy production potential from solar panels (left) 
                        and the water savings potential (right), represented on an 800m resolution grid.
                    </span>
                </Col>
            </Row>

            <Row style={{ padding: 16 }}>
                <Col span={12}>
                    <Typography.Paragraph style={{ color: "white", fontSize: 16, marginLeft: 4 }}>
                        Energy Production Potential
                    </Typography.Paragraph>
                    <span>The energy production potential map shows the amount of electricity that could be
                         generated from solar panels installed on agricultural lands.  This determined by 
                         examining solar irradiance at each location, coupled with an estimated solar panel efficiency.</span>
                </Col>

                <Col span={12}>
                    <Typography.Paragraph style={{ color: "white", fontSize: 16, marginLeft: 4 }}>
                        Water Savings Potential
                    </Typography.Paragraph>
                    <span>The water savings potential map shows the estimated reduction in reference evapotranspiration (ET0) 
                        that could be achieved by installing solar panels.  This is based on a model that estimates how much 
                        shading from solar panels would reduce crop water use, which can help identify areas where 
                        agrivoltaics may provide the greatest water conservation benefits.</span>

                </Col>
            </Row>

            <Row style={{ padding: 16 }}>
                <Col span={12}>
                    <RasterLayer
                        url={ENERGY_PRODUCTION_RASTER_URL}
                        id="energy-production-raster"
                        title="Electricity Production (W/m2)"
                        renderer={ENERGY_RENDERER}
                        opacity={0.85}
                        zoomRef={zoomEnergyProduction}
                        viewRef={energyMapView}
                    />
                    <Button
                        type="primary"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                            const sourceZoom = zoomEnergyProduction.current;
                            const targetView = waterSavingsMapView.current;

                            if (sourceZoom && targetView) {
                                targetView.goTo({
                                    center: sourceZoom.center,
                                    zoom: sourceZoom.level,
                                }).then(() => {
                                    targetView.map?.findLayerById("delta-et0-annual-raster")?.refresh?.();
                                });
                            }
                        }}
                    >
                        Sync to this map
                    </Button>
                </Col>

                <Col span={12}>
                    <RasterLayer
                        url={DELTA_ETO_RASTER_URL}
                        id="delta-et0-annual-raster"
                        title="Water Savings (mm/day)"
                        renderer={ET_RENDERER}
                        opacity={0.85}
                        zoomRef={zoomWaterSavings}
                        viewRef={waterSavingsMapView}
                    />

                    <Button
                        type="primary"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                            const sourceZoom = zoomWaterSavings.current;
                            const targetView = energyMapView.current;

                            if (sourceZoom && targetView) {
                                targetView.goTo({
                                    center: sourceZoom.center,
                                    zoom: sourceZoom.level,
                                }).then(() => {
                                    targetView.map?.findLayerById("energy-production-raster")?.refresh?.();
                                });
                            }
                        }}
                    >
                        Sync to this map
                    </Button>
                </Col>
            </Row>


{/*
            <Row style={{ padding: 16 }}>
                <Col span={24}>
                    <Typography.Paragraph style={{ color: "white", fontSize: 16, marginLeft: 4 }}>
                        Weighted Average Composite
                    </Typography.Paragraph>

                    <WeightedAverageRasterLayer
                        zoomRef={zoomWeightedAverage}
                        viewRef={weightedAverageMapView}
                        layers={[
                            {
                                id: "weighted-average-delta-et0",
                                url: DELTA_ETO_RASTER_URL,
                                title: "Delta ET0 Annual Raster",
                                renderer: ET_RENDERER,
                                opacity: 1,
                                blendMode: "normal",
                            },
                            {
                                id: "weighted-average-energy-production",
                                url: ENERGY_PRODUCTION_RASTER_URL,
                                title: "Energy Production Raster",
                                renderer: ENERGY_RENDERER,
                                opacity: 1,
                                blendMode: "average",
                            },
                        ]}
                    />
                </Col>
            </Row> */}
        </>
    );
}

RasterLayer.propTypes = {
    url: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    opacity: PropTypes.number,
    renderer: PropTypes.object,
    zoomRef: PropTypes.object,
    viewRef: PropTypes.shape({
        current: PropTypes.object,
    }),
};

WeightedAverageRasterLayer.propTypes = {
    layers: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            url: PropTypes.string.isRequired,
            title: PropTypes.string,
            opacity: PropTypes.number,
            renderer: PropTypes.object,
            blendMode: PropTypes.string,
        })
    ).isRequired,
    zoomRef: PropTypes.object,
    viewRef: PropTypes.shape({
        current: PropTypes.object,
    }),
};

Agrivoltaics.propTypes = {};



/*
import { useEffect, useRef } from "react";
import { Row, Col, Typography, Button } from "antd";
import PropTypes from "prop-types";

//const [rasterFunctionConstants, ImageryTileLayer,] = await $arcgis.import([
//    "@arcgis/core/layers/support/rasterFunctionConstants.js",
//    "@arcgis/core/layers/ImageryTileLayer.js",
//    ]);

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-legend";
import { watch as reactiveWatch } from "@arcgis/core/core/reactiveUtils.js";
//import {rasterFunctionConstants} from "@arcgis/core/layers/support/rasterFunctionConstants.js";

import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer.js";

const DELTA_ETO_RASTER_URL =
    "https://tiledimageservices1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/delta_et0_annual/ImageServer";

const ENERGY_PRODUCTION_RASTER_URL =
    "https://tiledimageservices1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/cleaned_energy_annual/ImageServer";

// Create a transparent-to-black color ramp gradient for render updates.
const YlRdColorRamp = {
    type: "algorithmic",
    algorithm: "cie-lab",
    fromColor: [255, 255, 0, 255],
    toColor: "#ad3c16ff",
    };

const BluesColorRamp = {
    type: "algorithmic",
    algorithm: "cie-lab",
    fromColor: [240, 255, 255, 255],
    toColor: "#08519cff",
    };


const ET_RENDERER = {
        type: "raster-stretch", // autocasts as new RasterStretchRenderer()
        customStatistics: [{ min: 0, max: 12 }],
        numberOfStandardDeviations: 1,
        colorRamp: BluesColorRamp,
        stretchType: 'min-max',
      };


const ENERGY_RENDERER = {
        type: "raster-stretch", // autocasts as new RasterStretchRenderer()
        customStatistics: [{ min: 200, max: 420 }],
        numberOfStandardDeviations: 1,
        colorRamp: YlRdColorRamp,
        stretchType: 'min-max',
      };
      
// Create an NDVI raster function with output scaled to 0–255.
const asiRasterFunction = {
        functionName: "ASI",
        functionArguments: {
          visibleBandID: 3,
          infraredBandID: 4,
          scientificOutput: false, // True outputs values from -1 to 1.
        },
      };

// Apply a predefined color map to the NDVI raster function result.
//const { NDVI3 } = rasterFunctionConstants.colormapName; // NDVI and NDVI2
export default function Agrivoltaics() {
    const zoomEnergyProduction = useRef(null);
    const zoomWaterSavings = useRef(null);
    const zoomWeightedAverage = useRef(null);
    const energyMapView = useRef(null);
    const waterSavingsMapView = useRef(null);
    const weightedAverageMapView = useRef(null);

    zoomEnergyProduction.current ??= 0;
    zoomWaterSavings.current ??= 0;

    return (
        <>
            <Row style={{ padding: 16 }}>
                <Col span={24}>
                    <Typography.Title level={2} style={{ color: 'white' }}>
                        Agrivoltaics Suitability Mapping
                    </Typography.Title>
                    <p>
                        This map shows the suitability of land in US Agricultural Areas for agrivoltaic siting,
                        which combines agriculture with solar energy production. The underlying raster layer represents
                        the annual reduction in daily reference evapotranspiration (ET0) across the region,
                        which is a measure of potential crop water use savings.
                        These maps can help identify areas where agrivoltaics may be most beneficial.
                    </p>
                </Col>
            </Row>

            <Row style={{ padding: 16 }}>
                <Col span={12}>
                    <Typography.Paragraph style={{ color: 'white', fontSize: 16, marginLeft: 4 }}>
                        Energy Production Potential
                    </Typography.Paragraph>
                    <RasterLayer
                        url={ENERGY_PRODUCTION_RASTER_URL}
                        id="energy-production-raster"
                        title="Electricity Production (W/m2)"
                        renderer={ENERGY_RENDERER}
                        opacity={0.85}
                        zoomRef={zoomEnergyProduction}
                        viewRef={energyMapView}
                    />
                    <Button
                        type="primary"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                            const sourceZoom = zoomEnergyProduction.current;
                            const targetView = waterSavingsMapView.current;

                            if (sourceZoom && targetView) {
                                targetView.goTo({
                                    center: sourceZoom.center,
                                    zoom: sourceZoom.level,
                                }).then(() => {
                                    targetView.map?.findLayerById("delta-et0-annual-raster")?.refresh?.();
                                });
                            }
                        }}
                    >
                        Sync to this map
                    </Button>
                </Col>
                <Col span={12}>
                    <Typography.Paragraph style={{ color: 'white', fontSize: 16, marginLeft: 4 }}>
                        Water Savings Potential
                    </Typography.Paragraph>

                    <RasterLayer
                        url={DELTA_ETO_RASTER_URL}
                        id="delta-et0-annual-raster"
                        title="Water Savings (mm/day)"
                        renderer={ET_RENDERER}
                        opacity={0.85}
                        zoomRef={zoomWaterSavings}
                        viewRef={waterSavingsMapView}
                    />

                    <Button
                        type="primary"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                            const sourceZoom = zoomWaterSavings.current;
                            const targetView = energyMapView.current;

                            if (sourceZoom && targetView) {
                                targetView.goTo({
                                    center: sourceZoom.center,
                                    zoom: sourceZoom.level,
                                }).then(() => {
                                    targetView.map?.findLayerById("energy-production-raster")?.refresh?.();
                                });
                            }
                        }}
                    >
                        Sync to this map
                    </Button>
                </Col>
            </Row>

            <Row style={{ padding: 16 }}>
                <Col span={24}>
                    <Typography.Paragraph style={{ color: 'white', fontSize: 16, marginLeft: 4 }}>
                        Weighted Average Composite
                    </Typography.Paragraph>

                    <WeightedAverageRasterLayer
                        zoomRef={zoomWeightedAverage}
                        viewRef={weightedAverageMapView}
                        layers={[
                            {
                                id: "weighted-average-delta-et0",
                                url: DELTA_ETO_RASTER_URL,
                                title: "Delta ET0 Annual Raster",
                                renderer: ET_RENDERER,
                                opacity: 1,
                                blendMode: "normal",
                            },
                            {
                                id: "weighted-average-energy-production",
                                url: ENERGY_PRODUCTION_RASTER_URL,
                                title: "Energy Production Raster",
                                renderer: ENERGY_RENDERER,
                                opacity: 1,
                                blendMode: "average",
                            },
                        ]}
                    />
                </Col>
            </Row>
        </>
    );
}
                        level: view.zoom,
                        center: [view.center.longitude, view.center.latitude],
                    };
                }
            };

            updateZoomRef();
            zoomHandle = reactiveWatch(
                () => [view.zoom, view.center?.latitude, view.center?.longitude],
                updateZoomRef
            );

            const activeLayers = layers.map((layerConfig, index) => {
                const existingLayer = view.map.findLayerById(layerConfig.id);
                const resolvedOpacity = layerConfig.opacity ?? 1;
                const resolvedBlendMode = layerConfig.blendMode ?? (index === 1 ? "average" : "normal");

                if (existingLayer) {

                const nextLayer = new ImageryTileLayer({
                    id: layerConfig.id,
                    url: layerConfig.url,
                    title: layerConfig.title,
                    renderer: layerConfig.renderer,
                    blendMode: resolvedBlendMode,
                });

                view.map.add(nextLayer);
                return nextLayer;
            });

            layerRefs.current = activeLayers;
            try {
                await view.when();
                await Promise.all(activeLayers.map((layer) => layer?.when?.()));

                const primaryLayer = activeLayers[0];
                if (primaryLayer?.fullExtent) {
                    await view.goTo(primaryLayer.fullExtent.expand(0.7));
                    activeLayers.forEach((layer) => layer.refresh?.());
                }
            } catch (error) {
                console.warn("Unable to zoom to weighted raster extent:", error);
            }
        };

        mapElement.addEventListener("arcgisViewReadyChange", handleViewReady);

        return () => {
            mapElement.removeEventListener("arcgisViewReadyChange", handleViewReady);

            zoomHandle?.remove();

            if (viewRef?.current === mapElement.view) {
                viewRef.current = null;
            }

            layerRefs.current = [];
        };
    }, [layers, title, viewRef, zoomRef]);

    return (
        <div style={{ width: "100%", height: 640, padding: 4 }}>
            <arcgis-map
                ref={mapRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                basemap="topo-vector"
                center="-121.5,38.8"
                zoom="10"
            >
                <arcgis-zoom position="top-left" />
                <arcgis-legend position="bottom-left" />
            </arcgis-map>
        </div>
    );
};

        return () => {
            mapElement.removeEventListener("arcgisViewReadyChange", handleViewReady);

    const zoomWeightedAverage = useRef(null)
            zoomHandle?.remove();

    const weightedAverageMapView = useRef(null)
            //if (imageryLayer && mapElement.view?.map?.findLayerById(imageryLayer.id)) {
            //    mapElement.view.map.remove(imageryLayer);
            //}
//
            //layerRef.current = null;
//
            //if (viewRef?.current === mapElement.view) {
            //    viewRef.current = null;
            //}
        };
    }, [id, opacity, renderer, title, url, viewRef, zoomRef]);

    return (
        <div style={{ width: "100%", height: 640, padding: 4 }}>
            <arcgis-map
                ref={mapRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                basemap="topo-vector"
                center="-121.5,38.8"
                zoom="10"
            >
                <arcgis-zoom position="top-left" />
                <arcgis-legend position="bottom-left" />
            </arcgis-map>
        </div>
    );




}


export default function Agrivoltaics() {
    const zoomEnergyProduction = useRef(null)
    const zoomWaterSavings = useRef(null)
    const energyMapView = useRef(null)
    const waterSavingsMapView = useRef(null)

    zoomEnergyProduction.current ??= 0;
    zoomWaterSavings.current ??= 0;


    return (
        <>
            <Row style={{ padding: 16 }}>
                <Col span={24}>
                    <Typography.Title level={2} style={{ color: 'white' }}>
                        Agrivoltaics Suitability Mapping
                    </Typography.Title>
                    <p>This map shows the suitability of land in US Agricultural Areas for agrivoltaic siting,
                         which combines agriculture with solar energy production. The underlying raster layer represents 
                         the annual reduction in daily reference evapotranspiration (ET0) across the region,
                         which is a measure of potential crop water use savings.
                         These maps can help identify areas where agrivoltaics may be most beneficial.
                    </p>
                </Col>
            </Row>


            <Row style={{ padding: 16 }}>
                <Col span={12}>
                    <Typography.Paragraph style={{ color: 'white', fontSize: 16, marginLeft: 4 }}>
                        Energy Production Potential
                    </Typography.Paragraph>
                    <RasterLayer
                        url={ENERGY_PRODUCTION_RASTER_URL}
                        id="energy-production-raster"
                        title="Electricity Production (W/m2)"
                        renderer={ENERGY_RENDERER}
                        opacity={0.85}
                        zoomRef={zoomEnergyProduction}
                        viewRef={energyMapView}
                    />
                    <Button type='primary' style={{ marginTop: 8 }} onClick={() => {
                        const sourceZoom = zoomEnergyProduction.current;
                        const targetView = waterSavingsMapView.current;

                        if (sourceZoom && targetView) {
                            targetView.goTo({
                                center: sourceZoom.center,

            <Row style={{ padding: 16 }}>
                <Col span={24}>
                    <Typography.Paragraph style={{ color: 'white', fontSize: 16, marginLeft: 4 }}>
                        Weighted Average Composite
                    </Typography.Paragraph>

                    <WeightedAverageRasterLayer
                        title="Weighted Average Composite"
                        zoomRef={zoomWeightedAverage}
                        viewRef={weightedAverageMapView}
                        layers={[
                            {
                                id: "weighted-average-delta-et0",
                                url: DELTA_ETO_RASTER_URL,
                                title: "Delta ET0 Annual Raster",
                                renderer: ET_RENDERER,
                                opacity: 1,
                                blendMode: "normal",
                            },
                            {
                                id: "weighted-average-energy-production",
                                url: ENERGY_PRODUCTION_RASTER_URL,
                                title: "Energy Production Raster",
                                renderer: ENERGY_RENDERER,
                                opacity: 1,
                                blendMode: "average",
                            },
                        ]}
                    />
                </Col>
            </Row>
                                zoom: sourceZoom.level,
                            }).then(() => {
                                targetView.map?.findLayerById("delta-et0-annual-raster")?.refresh?.();
                            });
                        }}}
                        >
                        Sync to this map
                    </Button>
                </Col>
                <Col span={12}>
                    <Typography.Paragraph style={{ color: 'white', fontSize: 16, marginLeft: 4 }}>
                        Water Savings Potential
                    </Typography.Paragraph>

                    <RasterLayer
                        url={DELTA_ETO_RASTER_URL}
                        id="delta-et0-annual-raster"
                        title="Water Savings (mm/day)"
                        renderer={ET_RENDERER}
WeightedAverageRasterLayer.propTypes = {
    layers: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            url: PropTypes.string.isRequired,
            title: PropTypes.string,
            opacity: PropTypes.number,
            renderer: PropTypes.object,
            blendMode: PropTypes.string,
        })
    ).isRequired,
    title: PropTypes.string,
    zoomRef: PropTypes.object,
    viewRef: PropTypes.shape({
        current: PropTypes.object,
    }),
};
                        opacity={0.85}
                        zoomRef={zoomWaterSavings}
                        viewRef={waterSavingsMapView}
                    />

                    <Button type='primary' style={{ marginTop: 8 }} onClick={() => {
                       const sourceZoom = zoomWaterSavings.current;
                        const targetView = energyMapView.current;

                        if (sourceZoom && targetView) {
                            targetView.goTo({
                                center: sourceZoom.center,
                                zoom: sourceZoom.level,
                            });
                        }}}
                        >
                        Sync to this map
                    </Button>

                </Col>
            </Row>
        </>
    )
}

import { useEffect, useRef } from "react";
import { Row, Col, Typography, Button } from "antd";
import PropTypes from "prop-types";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-legend";
import { watch as reactiveWatch } from "@arcgis/core/core/reactiveUtils.js";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer.js";

const DELTA_ETO_RASTER_URL =
    "https://tiledimageservices1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/delta_et0_annual/ImageServer";

const ENERGY_PRODUCTION_RASTER_URL =
    "https://tiledimageservices1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/cleaned_energy_annual/ImageServer";

const YlRdColorRamp = {
    type: "algorithmic",
    algorithm: "cie-lab",
    fromColor: [255, 255, 0, 255],
    toColor: "#ad3c16ff",
};

const BluesColorRamp = {
    type: "algorithmic",
    algorithm: "cie-lab",
    fromColor: [240, 255, 255, 255],
    toColor: "#08519cff",
};

const ET_RENDERER = {
    type: "raster-stretch",
    customStatistics: [{ min: 0, max: 12 }],
    numberOfStandardDeviations: 1,
    colorRamp: BluesColorRamp,
    stretchType: "min-max",
};

const ENERGY_RENDERER = {
    type: "raster-stretch",
    customStatistics: [{ min: 200, max: 420 }],
    numberOfStandardDeviations: 1,
    colorRamp: YlRdColorRamp,
    stretchType: "min-max",
};

const RasterLayer = ({ url, id, title, opacity, renderer, zoomRef, viewRef }) => {
    const mapRef = useRef(null);
    const layerRef = useRef(null);

    const formatRasterValue = (value) => {
        if (Array.isArray(value)) {
            return value
                .map((item) => (typeof item === "number" ? item.toFixed(2) : String(item)))
                .join(", ");
        }

        if (typeof value === "number") {
            return value.toFixed(2);
        }

        return value == null ? "No data" : String(value);
    };

    useEffect(() => {
        const mapElement = mapRef.current;
        if (!mapElement) return undefined;

        let zoomHandle = null;

        const handleViewReady = async () => {
            const view = mapElement.view;
            if (!view || !view.map) return;

            if (viewRef) {
                viewRef.current = view;
            }

            const updateZoomRef = () => {
                if (zoomRef) {
                    zoomRef.current = {
                        level: view.zoom,
                        center: [view.center.longitude, view.center.latitude],
                    };
                }
            };

            updateZoomRef();
            zoomHandle = reactiveWatch(
                () => [view.zoom, view.center?.latitude, view.center?.longitude],
                updateZoomRef
            );

            const existingLayer = view.map.findLayerById(id);
            const rasterLayer = existingLayer || new ImageryTileLayer({
                id,
                url,
                title,
                opacity,
                renderer,
            });

            if (!existingLayer) {
                view.map.add(rasterLayer);
            }

            layerRef.current = rasterLayer;

            const handleClick = async (event) => {
                const activeLayer = layerRef.current;
                if (!activeLayer) return;

                try {
                    const identifyResult = await activeLayer.identify(event.mapPoint, {
                        timeExtent: view.timeExtent,
                    });

                    const rasterValue = formatRasterValue(
                        identifyResult?.processedValue ?? identifyResult?.value
                    );

                    view.closePopup();
                    view.openPopup({
                        location: event.mapPoint,
                        title: title || "Raster value",
                        content: `
                            <div style="min-width: 220px;">
                                <div><b>Lat:</b> ${event.mapPoint.latitude.toFixed(5)}<b>, Lon:</b> ${event.mapPoint.longitude.toFixed(5)}</div>
                                <div><b>Value:</b> ${rasterValue}</div>
                            </div>
                        `,
                    });
                } catch (error) {
                    console.warn("Unable to identify raster value at click location:", error);
                }
            };

            view.on("click", handleClick);

            try {
                await view.when();
                await rasterLayer.when();

                if (rasterLayer.fullExtent) {
                    await view.goTo(rasterLayer.fullExtent.expand(0.7));
                    rasterLayer.refresh?.();
                }
            } catch (error) {
                console.warn("Unable to zoom to raster extent:", error);
            }
        };

        mapElement.addEventListener("arcgisViewReadyChange", handleViewReady);

        return () => {
            mapElement.removeEventListener("arcgisViewReadyChange", handleViewReady);
            zoomHandle?.remove();

            if (viewRef?.current === mapElement.view) {
                viewRef.current = null;
            }
        };
    }, [id, opacity, renderer, title, url, viewRef, zoomRef]);

    return (
        <div style={{ width: "100%", height: 640, padding: 4 }}>
            <arcgis-map
                ref={mapRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                basemap="topo-vector"
                center="-121.5,38.8"
                zoom="10"
            >
                <arcgis-zoom position="top-left" />
                <arcgis-legend position="bottom-left" />
            </arcgis-map>
        </div>
    );
};

const WeightedAverageRasterLayer = ({ layers, zoomRef, viewRef }) => {
    const mapRef = useRef(null);
    const layerRefs = useRef([]);

    useEffect(() => {
        const mapElement = mapRef.current;
        if (!mapElement) return undefined;

        let zoomHandle = null;

        const handleViewReady = async () => {
            const view = mapElement.view;
            if (!view || !view.map) return;

            if (viewRef) {
                viewRef.current = view;
            }

            const updateZoomRef = () => {
                if (zoomRef) {
                    zoomRef.current = {
                        level: view.zoom,
                        center: [view.center.longitude, view.center.latitude],
                    };
                }
            };

            updateZoomRef();
            zoomHandle = reactiveWatch(
                () => [view.zoom, view.center?.latitude, view.center?.longitude],
                updateZoomRef
            );

            const activeLayers = layers.map((layerConfig, index) => {
                const existingLayer = view.map.findLayerById(layerConfig.id);
                const resolvedOpacity = layerConfig.opacity ?? 1;
                const resolvedBlendMode = layerConfig.blendMode ?? (index === 1 ? "average" : "normal");

                if (existingLayer) {
                    existingLayer.opacity = resolvedOpacity;
                    existingLayer.blendMode = resolvedBlendMode;
                    return existingLayer;
                }

                const nextLayer = new ImageryTileLayer({
                    id: layerConfig.id,
                    url: layerConfig.url,
                    title: layerConfig.title,
                    opacity: resolvedOpacity,
                    renderer: layerConfig.renderer,
                    blendMode: resolvedBlendMode,
                });

                view.map.add(nextLayer);
                return nextLayer;
            });

            layerRefs.current = activeLayers;

            try {
                await view.when();
                await Promise.all(activeLayers.map((layer) => layer.when()));

                const primaryLayer = activeLayers[0];
                if (primaryLayer?.fullExtent) {
                    await view.goTo(primaryLayer.fullExtent.expand(0.7));
                    activeLayers.forEach((layer) => layer.refresh?.());
                }
            } catch (error) {
                console.warn("Unable to zoom to weighted raster extent:", error);
            }
        };

        mapElement.addEventListener("arcgisViewReadyChange", handleViewReady);

        return () => {
            mapElement.removeEventListener("arcgisViewReadyChange", handleViewReady);
            zoomHandle?.remove();

            if (viewRef?.current === mapElement.view) {
                viewRef.current = null;
            }

            layerRefs.current = [];
        };
    }, [layers, viewRef, zoomRef]);

    return (
        <div style={{ width: "100%", height: 640, padding: 4 }}>
            <arcgis-map
                ref={mapRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                basemap="topo-vector"
                center="-121.5,38.8"
                zoom="10"
            >
                <arcgis-zoom position="top-left" />
                <arcgis-legend position="bottom-left" />
            </arcgis-map>
        </div>
    );
};

export default function Agrivoltaics() {
    const zoomEnergyProduction = useRef(null);
    const zoomWaterSavings = useRef(null);
    const zoomWeightedAverage = useRef(null);
    const energyMapView = useRef(null);
    const waterSavingsMapView = useRef(null);
    const weightedAverageMapView = useRef(null);

    return (
        <>
            <Row style={{ padding: 16 }}>
                <Col span={24}>
                    <Typography.Title level={2} style={{ color: 'white' }}>
                        Agrivoltaics Suitability Mapping
                    </Typography.Title>
                    <p>
                        This map shows the suitability of land in US Agricultural Areas for agrivoltaic siting,
                        which combines agriculture with solar energy production. The underlying raster layer represents
                        the annual reduction in daily reference evapotranspiration (ET0) across the region,
                        which is a measure of potential crop water use savings.
                        These maps can help identify areas where agrivoltaics may be most beneficial.
                    </p>
                </Col>
            </Row>

            <Row style={{ padding: 16 }}>
                <Col span={12}>
                    <Typography.Paragraph style={{ color: 'white', fontSize: 16, marginLeft: 4 }}>
                        Energy Production Potential
                    </Typography.Paragraph>
                    <RasterLayer
                        url={ENERGY_PRODUCTION_RASTER_URL}
                        id="energy-production-raster"
                        title="Electricity Production (W/m2)"
                        renderer={ENERGY_RENDERER}
                        opacity={0.85}
                        zoomRef={zoomEnergyProduction}
                        viewRef={energyMapView}
                    />
                    <Button
                        type="primary"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                            const sourceZoom = zoomEnergyProduction.current;
                            const targetView = waterSavingsMapView.current;

                            if (sourceZoom && targetView) {
                                targetView.goTo({
                                    center: sourceZoom.center,
                                    zoom: sourceZoom.level,
                                }).then(() => {
                                    targetView.map?.findLayerById("delta-et0-annual-raster")?.refresh?.();
                                });
                            }
                        }}
                    >
                        Sync to this map
                    </Button>
                </Col>
                <Col span={12}>
                    <Typography.Paragraph style={{ color: 'white', fontSize: 16, marginLeft: 4 }}>
                        Water Savings Potential
                    </Typography.Paragraph>

                    <RasterLayer
                        url={DELTA_ETO_RASTER_URL}
                        id="delta-et0-annual-raster"
                        title="Water Savings (mm/day)"
                        renderer={ET_RENDERER}
                        opacity={0.85}
                        zoomRef={zoomWaterSavings}
                        viewRef={waterSavingsMapView}
                    />

                    <Button
                        type="primary"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                            const sourceZoom = zoomWaterSavings.current;
                            const targetView = energyMapView.current;

                            if (sourceZoom && targetView) {
                                targetView.goTo({
                                    center: sourceZoom.center,
                                    zoom: sourceZoom.level,
                                }).then(() => {
                                    targetView.map?.findLayerById("energy-production-raster")?.refresh?.();
                                });
                            }
                        }}
                    >
                        Sync to this map
                    </Button>
                </Col>
            </Row>

            <Row style={{ padding: 16 }}>
                <Col span={24}>
                    <Typography.Paragraph style={{ color: 'white', fontSize: 16, marginLeft: 4 }}>
                        Weighted Average Composite
                    </Typography.Paragraph>

                    <WeightedAverageRasterLayer
                        zoomRef={zoomWeightedAverage}
                        viewRef={weightedAverageMapView}
                        layers={[
                            {
                                id: "weighted-average-delta-et0",
                                url: DELTA_ETO_RASTER_URL,
                                title: "Delta ET0 Annual Raster",
                                renderer: ET_RENDERER,
                                opacity: 1,
                                blendMode: "normal",
                            },
                            {
                                id: "weighted-average-energy-production",
                                url: ENERGY_PRODUCTION_RASTER_URL,
                                title: "Energy Production Raster",
                                renderer: ENERGY_RENDERER,
                                opacity: 1,
                                blendMode: "average",
                            },
                        ]}
                    />
                </Col>
            </Row>
        </>
    );
}

RasterLayer.propTypes = {
    url: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    opacity: PropTypes.number,
    renderer: PropTypes.object,
    zoomRef: PropTypes.object,
    viewRef: PropTypes.shape({
        current: PropTypes.object,
    }),
};

WeightedAverageRasterLayer.propTypes = {
    layers: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            url: PropTypes.string.isRequired,
            title: PropTypes.string,
            opacity: PropTypes.number,
            renderer: PropTypes.object,
            blendMode: PropTypes.string,
        })
    ).isRequired,
    zoomRef: PropTypes.object,
    viewRef: PropTypes.shape({
        current: PropTypes.object,
    }),
};

Agrivoltaics.propTypes = {};
*/