# Featured Image Crop Tool — Design Spec

## Summary

Add a manual crop tool to the blog editor's featured image uploader. After uploading, users can adjust crop areas for three target sizes: post header (928x333), homepage thumbnail (250x150), and OG image (1200x630). Crops are stored as coordinates in post meta so they can be re-adjusted later. The original image is never modified.

## Crop Sizes

| Name | Key | Dimensions | Aspect Ratio | Used For |
|---|---|---|---|---|
| Header | `header` | 928x333 | 2.79:1 | Top of blog post |
| Thumbnail | `thumbnail` | 250x150 | 1.67:1 | Homepage post cards |
| OG Image | `og` | 1200x630 | 1.9:1 | Facebook/Twitter shares |

## Important: Coordinate System

The uploaded image is compressed to max 1600px on the client before upload (`ImageUploader.jsx` uses `browser-image-compression` with `maxWidthOrHeight: 1600`). All crop coordinates are in **natural pixel space** of this compressed image, not the rendered display size.

`react-image-crop` returns coordinates in rendered pixels by default. The frontend MUST convert to natural image pixels before sending to the server:

```js
const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
const naturalCrop = {
  x: Math.round(crop.x * scaleX),
  y: Math.round(crop.y * scaleY),
  width: Math.round(crop.width * scaleX),
  height: Math.round(crop.height * scaleY),
};
```

## Small Image Guard

If the source image (after compression) is smaller than a crop target size, the crop should still work but the output will be at the aspect ratio without upscaling beyond the source dimensions. The frontend should show a warning: "Image may appear blurry at this size" when the source is smaller than the target dimensions for a given crop.

## User Flow

1. Upload featured image via existing ImageUploader (drag/drop or click)
2. After upload succeeds, a **"Crop Image"** button appears below the image preview
3. Clicking opens a **CropModal** with three tabs (Header, Thumbnail, OG Image)
4. Each tab shows the uploaded image with a crop box locked to that size's aspect ratio
5. Default crop is centered, covering the maximum area at the correct ratio
6. All three crop previews are shown at the bottom of the modal simultaneously
7. User adjusts any/all crops, then clicks **"Save Crops"**
8. Frontend converts rendered coordinates to natural pixels, sends to server
9. Server generates cropped image files from the original
10. Post meta `_bbj_crop_data` stores original attachment ID + coordinates for future re-cropping
11. User can reopen the crop modal anytime to re-adjust — server regenerates from original

## Frontend

### New Dependencies

- `react-image-crop` — lightweight crop UI component with aspect ratio locking

### New Component: `CropModal.jsx`

Location: `src/components/editor/CropModal.jsx`

**Props:**
- `imageUrl` — URL of the original uploaded image
- `attachmentId` — WordPress attachment ID
- `initialCrops` — Previously saved crop coordinates (for re-cropping), or null
- `onSave(cropData)` — Callback with saved crop URLs and coordinates
- `onClose` — Close modal

**Behavior:**
- Three tabs: Header, Thumbnail, OG Image
- Each tab renders a `ReactCrop` component with the aspect ratio locked to the target size
- Store an `imgRef` on the `<img>` inside ReactCrop to read `naturalWidth`/`naturalHeight`
- Default crop for each: centered, maximum area at the correct ratio
- Bottom section shows live previews of all three crops using canvas or CSS
- If source image is smaller than target crop size, show a yellow warning
- "Save Crops" button converts all coordinates to natural pixels, sends to server in one request
- Loading state while server generates crops
- On success, calls `onSave` with the returned crop data (URLs + coordinates) and closes

### Modified Component: `ImageUploader.jsx`

New props added to interface:
- `cropData` — existing crop data (for showing "Crop Image" button and passing to modal)
- `onCropSave(cropData)` — callback when crops are saved

Changes:
- After successful upload, show "Crop Image" button below the image preview
- Clicking opens `CropModal`
- If crop data already exists (editing an existing post), pass as `initialCrops` to modal

### Modified Component: `EditorPage.jsx`

- Add `cropData` to component state AND to `stateRef` (critical: `stateRef` must include it to avoid stale-closure bug in auto-save)
- Pass `cropData` and `onCropSave` to `ImageUploader` via sidebar props
- Include `crop_data` when saving post (in `updatePost` call)
- Load existing `crop_data` from `getPost` response when editing a post

### Modified Component: `EditorSidebar.jsx`

- Pass new `cropData` and `onCropSave` props through to `ImageUploader`

### New API Function: `cropImage()` in `editor.js`

```js
export async function cropImage(attachmentId, crops) {
  return adminFetch("/editor/crop-image", {
    method: "POST",
    body: JSON.stringify({ attachment_id: attachmentId, crops }),
  });
}
```

## Backend

### New Endpoint: `POST /bbjd/v1/editor/crop-image`

Location: `EditorRoutes.php`

**Request body:**
```json
{
  "attachment_id": 12345,
  "crops": {
    "header": { "x": 0, "y": 50, "width": 1600, "height": 574 },
    "thumbnail": { "x": 100, "y": 200, "width": 800, "height": 480 },
    "og": { "x": 0, "y": 30, "width": 1600, "height": 840 }
  }
}
```

**Processing (for each crop):**
1. Get original file path via `get_attached_file($attachment_id)`
2. Load with `wp_get_image_editor($path)` — handle `WP_Error` if GD/Imagick unavailable
3. Call `->crop($x, $y, $width, $height)`
4. Call `->resize($target_width, $target_height)` — if source crop area is smaller than target, resize to fit without upscaling
5. Save to same uploads directory with suffix: `{original-name}-bbj-{key}.{ext}` (e.g., `my-image-bbj-header.jpg`)
6. Preserve source format (JPEG stays JPEG, PNG stays PNG with transparency)
7. If a previous crop file exists for this key, overwrite it (handles re-cropping)

**Response:**
```json
{
  "success": true,
  "crops": {
    "header": { "url": "https://.../my-image-bbj-header.jpg", "width": 928, "height": 333 },
    "thumbnail": { "url": "https://.../my-image-bbj-thumbnail.jpg", "width": 250, "height": 150 },
    "og": { "url": "https://.../my-image-bbj-og.jpg", "width": 1200, "height": 630 }
  }
}
```

**Error handling:**
- Return 400 if `attachment_id` is missing or invalid
- Return 500 with error message if `wp_get_image_editor` fails
- Return 500 with error message if any crop/save operation fails

**Permission:** Uses existing `canWrite()` callback (covers `blog_writing`, `blog_publishing`, `blog_review`).

### Modified Endpoint: `GET /bbjd/v1/editor/post/{id}`

Add `crop_data` to the response, read from `_bbj_crop_data` post meta.

### Modified Endpoint: `POST /bbjd/v1/editor/post/{id}`

Accept `crop_data` in the request body and save to `_bbj_crop_data` post meta.

### Post Meta: `_bbj_crop_data`

Stored when saving a post. Contains:
```json
{
  "original_id": 12345,
  "crops": {
    "header": { "x": 0, "y": 50, "width": 1600, "height": 574, "url": "..." },
    "thumbnail": { "x": 100, "y": 200, "width": 800, "height": 480, "url": "..." },
    "og": { "x": 0, "y": 30, "width": 1600, "height": 840, "url": "..." }
  }
}
```

When the featured image is removed, `_bbj_crop_data` should be cleared from post meta. Orphaned crop files are left on disk (non-goal to clean up).

### Auto-Crop Default

Auto-crop is triggered within the `uploadMedia` endpoint immediately after successful upload. This ensures every uploaded featured image has default crops without any extra user action.

Logic:
1. After `media_handle_upload` succeeds, calculate centered crop coordinates for each target ratio
2. Generate the three cropped files using the same crop logic as the manual endpoint
3. Return the crop data alongside the existing upload response (`id`, `url`, `thumbnail`, `crops`)

This makes auto-crop transparent — the editor gets crop data back from the upload call itself.

## Consuming the Crops (future work, not part of initial build)

### Post Header (`[slug]/page.jsx`)
- Use `_bbj_crop_data.crops.header.url` if available, fall back to original featured image

### Homepage Thumbnails (`PostCard.jsx`)
- Use `_bbj_crop_data.crops.thumbnail.url` if available, fall back to original

### OG Meta Tags (`generateMetadata`)
- Use `_bbj_crop_data.crops.og.url` if available, fall back to original featured image

## Non-Goals

- No cropping for in-content images (only featured image)
- No client-side crop file generation (server handles it for quality)
- No bulk re-cropping of existing posts
- No cleanup of orphaned crop files on image removal
- No changes to WordPress media library organization
