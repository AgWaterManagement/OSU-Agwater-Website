import { useEffect, useRef, useMemo } from "react";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-legend";
import { watch as reactiveWatch } from "@arcgis/core/core/reactiveUtils.js";

//import ImageryTileLayer from "@arcgis/core/layers/FeatureLayer.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";

const AgFieldLayer = () => {
    
    const id = "or-ag-boundaries";
    const name = "Oregon Agricultural Boundaries";
    const url = "https://services1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/Oregon_Hyd_Area_Ag_Boundaries_20241016/FeatureServer";

    //"https://services1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/Oregon_Hyd_Area_Ag_Boundaries_20241016/FeatureServer?f=json&where=1%3D1&returnGeometry=false&outFields=*&resultRecordCount=1"
    //const type = "Feature";
    const opacity = 0.8;
    
    const viewRef = useRef(null);
    const zoomRef = useRef({ level: null, center: null });
    const mapRef = useRef(null);
    const layerRef = useRef(null);

        // Memoize the renderer so it won't be recreated on every render
        const renderer = useMemo(() => {
            const colorVisVar = {
                type: "color",
                field: "Acres",
                stops: [
                    { value: 1, color: "#ecf41e" },
                    { value: 6000, color: "#ec0e0e" },
                ],
                legendOptions: { title: "Acres" },
            };

            return {
                type: "simple",
                symbol: {
                    type: "simple-fill",
                    style: "solid",
                    color: [6, 133, 4, 200],
                    outline: { color: [48, 48, 48, 0.8], width: 0.5 },
                },
                visualVariables: [colorVisVar],
            };
        }, []);
    
    
    //    {
    //    type: "simple", // autocasts as new SimpleRenderer()
    //    // autocasts as new SimpleMarkerSymbol()
    //    symbol: { type: "simple-marker", size: 6, color: color, outline: { width: 0.5, color: "yellow" }},
    //    visualVariables: [
    //      {
    //        type: "size", // autocasts as new SizeVariable()
    //        field: "C_Storage",
    //        legendOptions: { title: "Carbon Storage" },
    //        stops: [
    //          { value: 1000, size: 4, label: "<1000" },
    //          { value: 4000, size: 12, label: "4000" },
    //          { value: 8000, size: 20, label: "8000" },
    //          { value: 10000, size: 26, label: "10,000" },
    //          { value: 13000, size: 30, label: ">13,000" },
    //        ],
    //      },
    //    ],
    //  };

    const formatFeatureValue = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => (typeof item === "number" ? item.toFixed(2) : String(item))).join(", ");
        }

        if (typeof value === "number") {
            return value.toFixed(2);
        }

        return value == null ? "No data" : String(value);
    };

    // update layer when URL or renderer changes
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
            }

            updateZoomRef();
            zoomHandle = reactiveWatch(() => [view.zoom, view.center?.latitude, view.center?.longitude], updateZoomRef);

                        const existingLayer = view.map.findLayerById(id);
                        const featureLayer =
                            existingLayer ||
                            new FeatureLayer({
                                id,
                                url,
                                title: name,
                                opacity,
                                renderer,
                                outFields: ["*"],
                            });

            if (!existingLayer) {
                view.map.add(featureLayer);
            }

            layerRef.current = featureLayer;

            const handleClick = async (event) => {
                const activeLayer = layerRef.current;
                if (!activeLayer) return;

                try {
                    const identifyResult = await activeLayer.identify(event.mapPoint, { timeExtent: view.timeExtent });
                    const featureValue = formatFeatureValue(identifyResult?.processedValue ?? identifyResult?.value);

                    view.closePopup();
                    view.openPopup({
                        location: event.mapPoint,
                        title: name || "Feature value",
                        content: `
                            <div style="min-width: 220px;">
                                <div><b>Lat:</b> ${event.mapPoint.latitude.toFixed(5)}<b>, Lon:</b> ${event.mapPoint.longitude.toFixed(5)}</div>
                                <div><b>Value:</b> ${featureValue}</div>
                            </div>
                        `,
                    });
                } catch (error) {
                    console.warn("Unable to identify feature value at click location:", error);
                }
            };

            view.on("click", handleClick);

            try {
                await view.when();
                await featureLayer.when();

                if (featureLayer.fullExtent) {
                    await view.goTo(featureLayer.fullExtent.expand(0.7));
                    featureLayer.refresh?.();
                }
            } catch (error) {
                console.warn("Unable to zoom to feature extent:", error);
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
    }, [renderer]);

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





// ── Main component ────────────────────────────────────────────────────────────
const OregonAgrivoltaics = () => {

    //const mapRef = useRef(null);

    //const [portalItemId, setPortalItemId] = useState("");
    //const [basemap, setBasemap] = useState("dark-gray-vector");
    //const [activeLayerId, setActiveLayerId] = useState("");

    //const [mapStatus, setMapStatus] = useState("idle"); // idle | loading | ready | error
    //const [statusMsg, setStatusMsg] = useState("idle");
    //const [error, setError] = useState(null);
    //const [coords, setCoords] = useState(null);
    //const [isLoading, setIsLoading] = useState(true);

return (
    <div>
        <AgFieldLayer/>
        
    </div>
);
}


export default OregonAgrivoltaics;
