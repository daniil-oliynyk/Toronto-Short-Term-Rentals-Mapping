"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import mapboxgl from "mapbox-gl";
import {
  fetchMapListings,
  type Bounds,
  type MapFeatureCollection,
} from "@/lib/api";

const torontoCenter: [number, number] = [-79.3832, 43.6465];
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const sourceID = "toronto-str-listings";
const clusterGlowLayerID = "toronto-str-clusters-glow";
const clusterLayerID = "toronto-str-clusters";
const clusterCountLayerID = "toronto-str-cluster-counts";
const clusterCountHoverLayerID = "toronto-str-cluster-counts-hover";
const listingGlowLayerID = "toronto-str-listings-glow";
const listingLayerID = "toronto-str-listings";
const individualListingsMinZoom = 16;
const emptyFeatureCollection: MapFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export function TorontoMap({
  onListingSelect,
  onViewportChange,
  propertyType,
  q,
}: {
  onListingSelect: (id: string) => void;
  onViewportChange?: (viewport: { bounds: Bounds; zoom: number }) => void;
  propertyType?: string;
  q?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fallbackRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const filtersRef = useRef({ propertyType, q });
  const refreshMapDataRef = useRef<(() => void) | null>(null);
  const viewportChangeRef = useRef(onViewportChange);

  useEffect(() => {
    viewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    filtersRef.current = { propertyType, q };
    refreshMapDataRef.current?.();
  }, [propertyType, q]);

  useEffect(() => {
    if (!mapboxToken) {
      return;
    }

    if (!containerRef.current || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      // style: "mapbox://styles/mapbox/light-v11",
      style: "mapbox://styles/daniiloliynyk/cmiuwhtq4006901qn06rwb9kd",
      center: torontoCenter,
      zoom: 14.5,
      minZoom: 9,
      maxZoom: 18,
      attributionControl: false,
      pitch: 45
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }));
    map.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
      }),
    );

    mapRef.current = map;
    fallbackRef.current?.setAttribute("hidden", "");

    const refreshMapData = () => {
      abortRef.current?.abort();

      const bounds = map.getBounds();
      if (!bounds) {
        return;
      }

      const abortController = new AbortController();
      abortRef.current = abortController;

      const mapBounds = {
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      };
      const zoom = map.getZoom();

      viewportChangeRef.current?.({ bounds: mapBounds, zoom });

      fetchMapListings(
        {
          bbox: mapBounds,
          propertyType: filtersRef.current.propertyType,
          q: filtersRef.current.q,
          zoom,
        },
        { signal: abortController.signal },
      )
        .then((featureCollection) => {
          const source = map.getSource(sourceID);
          if (isGeoJSONSource(source)) {
            source.setData(withPromotedFeatureIDs(featureCollection));
          }
        })
        .catch((error: unknown) => {
          if (isAbortError(error)) {
            return;
          }

          const source = map.getSource(sourceID);
          if (isGeoJSONSource(source)) {
            source.setData(emptyFeatureCollection);
          }
        });
    };

    const scheduleMapDataRefresh = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(refreshMapData, 200);
    };

    refreshMapDataRef.current = refreshMapData;

    map.on("load", () => {
      addListingsSourceAndLayers(map);
      addClusterInteractions(map);
      addListingInteractions(map, onListingSelect, popupRef);
      refreshMapData();
    });
    map.on("moveend", scheduleMapDataRefresh);
    map.on("zoomend", scheduleMapDataRefresh);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      abortRef.current?.abort();
      mapRef.current?.remove();
      mapRef.current = null;
      popupRef.current = null;
      refreshMapDataRef.current = null;
    };
  }, [onListingSelect]);

  return (
    <div className="absolute inset-0">
      <div className="h-full w-full" ref={containerRef} />
      <div
        className="absolute inset-0 flex items-center justify-center bg-[#edf2f3] px-6"
        ref={fallbackRef}
      >
        <div className="max-w-sm rounded-md border border-[#aec0c2] bg-white/95 px-4 py-3 text-center text-sm font-medium text-[#526368] shadow-sm">
          Loading Toronto map
        </div>
      </div>
    </div>
  );
}

function addClusterInteractions(map: mapboxgl.Map) {
  map.on("click", clusterLayerID, (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== "Point") {
      return;
    }

    map.easeTo({
      center: feature.geometry.coordinates as [number, number],
      zoom: Math.min(Math.ceil(map.getZoom()) + 2, individualListingsMinZoom),
      duration: 500,
    });
  });

  let hoveredClusterID: string | number | undefined;

  map.on("mousemove", clusterLayerID, (event) => {
    const feature = event.features?.[0];
    const featureID =
      stringProperty(feature?.properties?.id) ??
      (feature?.id === undefined ? undefined : String(feature.id));

    if (featureID === undefined) {
      return;
    }

    map.getCanvas().style.cursor = "pointer";

    if (hoveredClusterID !== undefined && hoveredClusterID !== featureID) {
      map.setFeatureState(
        { source: sourceID, id: hoveredClusterID },
        { hover: false },
      );
    }

    hoveredClusterID = featureID;

    map.setFeatureState(
      { source: sourceID, id: hoveredClusterID },
      { hover: true },
    );
  });


  map.on("mouseleave", clusterLayerID, () => {
    map.getCanvas().style.cursor = "";

    if (hoveredClusterID !== undefined) {
      map.setFeatureState(
        { source: sourceID, id: hoveredClusterID },
        { hover: false },
      );
    }

    hoveredClusterID = undefined;
  });
}

function addListingInteractions(
  map: mapboxgl.Map,
  onListingSelect: (id: string) => void,
  popupRef: MutableRefObject<mapboxgl.Popup | null>,
) {
  map.on("click", listingLayerID, (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== "Point") {
      return;
    }

    const id = stringProperty(feature.properties?.id);
    if (!id) {
      return;
    }

    const address = stringProperty(feature.properties?.address) ?? id;
    onListingSelect(id);

    popupRef.current?.remove();
    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 12,
    })
      .setLngLat(feature.geometry.coordinates as [number, number])
      .setHTML(
        `<div class="str-popup"><strong>${escapeHTML(address)}</strong><span>${escapeHTML(id)}</span></div>`,
      )
      .addTo(map);
  });

  map.on("mouseenter", listingLayerID, () => {
    map.getCanvas().style.cursor = "pointer";
  });

  let hoveredListingID: string | number | undefined;

  map.on("mousemove", listingLayerID, (event) => {
    const feature = event.features?.[0];
    const featureID =
      stringProperty(feature?.properties?.id) ??
      (feature?.id === undefined ? undefined : String(feature.id));

    if (featureID === undefined) {
      return;
    }

    map.getCanvas().style.cursor = "pointer";

    if (hoveredListingID !== undefined && hoveredListingID !== featureID) {
      map.setFeatureState(
        { source: sourceID, id: hoveredListingID },
        { hover: false },
      );
    }

    hoveredListingID = featureID;

    map.setFeatureState(
      { source: sourceID, id: hoveredListingID },
      { hover: true },
    );
  });

  map.on("mouseleave", listingLayerID, () => {
    map.getCanvas().style.cursor = "";

    if (hoveredListingID !== undefined) {
      map.setFeatureState(
        { source: sourceID, id: hoveredListingID },
        { hover: false },
      );
    }

    hoveredListingID = undefined;
  });
}

function addListingsSourceAndLayers(map: mapboxgl.Map) {
  if (!map.getSource(sourceID)) {
    map.addSource(sourceID, {
      type: "geojson",
      promoteId: "id",
      data: emptyFeatureCollection,
    });
  }

  if (!map.getLayer(clusterGlowLayerID)) {
    map.addLayer({
      id: clusterGlowLayerID,
      type: "circle",
      source: sourceID,
      filter: ["==", ["get", "cluster"], true],
      paint: {
        "circle-color": "#d316ec",
        "circle-radius": [
          "+",
          [
            "step",
            ["get", "count"],
            25,
            25,
            31,
            100,
            39,
          ],
          [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            8,
            0,
          ],
        ],
        "circle-radius-transition": { duration: 120 },
        "circle-blur": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.45,
          0.35,
        ],
        "circle-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.5,
          0.32,
        ],
      },
    });
  }

  if (!map.getLayer(clusterLayerID)) {
    map.addLayer({
      id: clusterLayerID,
      type: "circle",
      source: sourceID,
      filter: ["==", ["get", "cluster"], true],
      paint: {
        "circle-color": [
          "step",
          ["get", "count"],
          "#2c7a7b",
          25,
          "#1f7a6b",
          100,
          "#0f5f63",
        ],
        "circle-radius": [
          "+",
          [
            "step",
            ["get", "count"],
            15,
            25,
            20,
            100,
            26,
          ],
          [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            4,
            0,
          ],
        ],
        "circle-radius-transition": { duration: 120 },
        "circle-stroke-color": "#d316ec",
        "circle-stroke-width": 3,
      },
    });
  }

  if (!map.getLayer(clusterCountLayerID)) {
    map.addLayer({
      id: clusterCountLayerID,
      type: "symbol",
      source: sourceID,
      filter: ["==", ["get", "cluster"], true],
      layout: {
        "text-field": ["to-string", ["get", "count"]],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": 12,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0,
          1,
        ],
      },
    });
  }

  if (!map.getLayer(clusterCountHoverLayerID)) {
    map.addLayer({
      id: clusterCountHoverLayerID,
      type: "symbol",
      source: sourceID,
      filter: ["==", ["get", "cluster"], true],
      layout: {
        "text-field": ["to-string", ["get", "count"]],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": 14,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          1,
          0,
        ],
      },
    });
  }

  if (!map.getLayer(listingGlowLayerID)) {
    map.addLayer({
      id: listingGlowLayerID,
      type: "circle",
      source: sourceID,
      filter: ["==", ["get", "cluster"], false],
      paint: {
        "circle-color": "#ff0000",
        "circle-radius": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          18,
          14,
        ],
        "circle-radius-transition": { duration: 120 },
        "circle-blur": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.45,
          0.35,
        ],
        "circle-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.5,
          0.32,
        ],
      },
    });
  }

  if (!map.getLayer(listingLayerID)) {
    map.addLayer({
      id: listingLayerID,
      type: "circle",
      source: sourceID,
      filter: ["==", ["get", "cluster"], false],
      paint: {
        "circle-color": "#ff0000",
        "circle-radius": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          11,
          8,
        ],
        "circle-radius-transition": { duration: 120 },
        "circle-stroke-color": "#ff0000",
        "circle-stroke-width": 1.5,
      },
    });
  }
}

function isGeoJSONSource(
  source: mapboxgl.Source | undefined,
): source is mapboxgl.GeoJSONSource {
  return Boolean(source && "setData" in source);
}

function withPromotedFeatureIDs(
  featureCollection: MapFeatureCollection,
): MapFeatureCollection {
  return {
    ...featureCollection,
    features: featureCollection.features.map((feature) => {
      const id = feature.properties.id ?? feature.id;

      return {
        ...feature,
        id,
        properties: {
          ...feature.properties,
          id,
        },
      };
    }),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function stringProperty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}
