import L from "leaflet";

// BBJ primary — default ring for the free-tier marker layer.
export const FACE_RING_DEFAULT = "#35546e";

const DISC = 42; // face circle diameter
const TAIL = 9; // pointer tail (rotated square) size
const H = DISC + TAIL; // total icon height incl. tail overlap

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/);
  const chars = (parts[0]?.charAt(0) || "?") + (parts[1]?.charAt(0) || "");
  return chars.toUpperCase();
}

/**
 * Circular face marker with a colored ring and a small pointer tail so it
 * still reads as "this exact spot". Falls back to an initials disc when the
 * player has no photo (common pre-BB22) or the image fails to load.
 */
export function createFaceIcon(player, ringColor = FACE_RING_DEFAULT) {
  // Initials disc: hidden behind the photo (revealed by img onerror) or shown
  // directly when the player has no photo.
  const disc = (display) =>
    `<div style="display:${display};width:100%;height:100%;align-items:center;justify-content:center;background:#e2e8f0;color:#64748b;font-weight:700;font-size:15px">${initials(player.name)}</div>`;

  const inner = player.photo
    ? `<img src="${player.photo}" alt="" loading="lazy" draggable="false"
         style="width:100%;height:100%;object-fit:cover;display:block"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
       ${disc("none")}`
    : disc("flex");

  return L.divIcon({
    className: "bbj-face-pin",
    html: `
      <div style="position:relative;width:${DISC}px;height:${H}px;font-family:system-ui,sans-serif">
        <div style="position:absolute;left:50%;bottom:1px;width:${TAIL}px;height:${TAIL}px;background:${ringColor};transform:translateX(-50%) rotate(45deg);border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,.35)"></div>
        <div style="position:absolute;top:0;left:0;width:${DISC}px;height:${DISC}px;border-radius:50%;border:2.5px solid ${ringColor};outline:2px solid rgba(255,255,255,.9);background:#fff;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.35)">
          ${inner}
        </div>
      </div>`,
    iconSize: [DISC, H],
    iconAnchor: [DISC / 2, H], // tail tip sits on the coordinate
    popupAnchor: [0, -(DISC + 4)],
  });
}
