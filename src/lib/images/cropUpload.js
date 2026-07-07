/**
 * Pure geometry helpers for the pre-upload crop flow (player photos etc.).
 * Kept free of DOM/canvas so they're unit-testable.
 */

/**
 * Largest centered percent-crop of the given aspect that fits the image.
 * Mirrors the editor CropModal's default-crop behavior.
 */
export function centeredCrop(aspect, imgWidth, imgHeight) {
  const imgAspect = imgWidth / imgHeight;
  let cropWidth;
  let cropHeight;

  if (imgAspect > aspect) {
    cropHeight = 100;
    cropWidth = ((aspect * imgHeight) / imgWidth) * 100;
  } else {
    cropWidth = 100;
    cropHeight = (imgWidth / aspect / imgHeight) * 100;
  }

  return {
    unit: "%",
    x: (100 - cropWidth) / 2,
    y: (100 - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
}

/**
 * Convert a react-image-crop percent crop to natural-pixel coordinates,
 * clamped to the image bounds.
 */
export function toPixelCrop(percentCrop, naturalWidth, naturalHeight) {
  const x = Math.max(0, Math.round((percentCrop.x / 100) * naturalWidth));
  const y = Math.max(0, Math.round((percentCrop.y / 100) * naturalHeight));
  const width = Math.min(naturalWidth - x, Math.round((percentCrop.width / 100) * naturalWidth));
  const height = Math.min(naturalHeight - y, Math.round((percentCrop.height / 100) * naturalHeight));
  return { x, y, width, height };
}
