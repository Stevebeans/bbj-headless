import L from "leaflet";

/**
 * Creates a Leaflet MarkerClusterGroup with BBJ-branded styling.
 * Shared between MarkerClusterLayer and ColoredMarkerLayer.
 */
export function createBbjClusterGroup() {
  return L.markerClusterGroup({
    chunkedLoading: true,
    // Face pins (42px) are wider than the old dot/pin markers — cluster a bit
    // more aggressively so mid-zoom dense areas don't overlap into soup.
    maxClusterRadius: 60,
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
