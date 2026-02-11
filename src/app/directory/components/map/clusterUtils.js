import L from "leaflet";

/**
 * Creates a Leaflet MarkerClusterGroup with BBJ-branded styling.
 * Shared between MarkerClusterLayer and ColoredMarkerLayer.
 */
export function createBbjClusterGroup() {
  return L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 50,
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
