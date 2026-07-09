import L from "leaflet";

/**
 * Creates a Leaflet MarkerClusterGroup with BBJ-branded styling.
 * Shared between MarkerClusterLayer and ColoredMarkerLayer.
 */
export function createBbjClusterGroup() {
  return L.markerClusterGroup({
    chunkedLoading: true,
    // Keep faces individual unless they'd truly pile up: only cluster when
    // markers are within ~half a face-pin of each other. Same-city players
    // (identical coordinates) always cluster — clicking fans them out.
    maxClusterRadius: 25,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction: (clusterObj) => {
      const count = clusterObj.getChildCount();
      let size = "small";
      if (count >= 50) size = "large";
      else if (count >= 10) size = "medium";

      return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster marker-cluster-${size} bbj-cluster`,
        iconSize: L.point(40, 40),
      });
    },
  });
}
