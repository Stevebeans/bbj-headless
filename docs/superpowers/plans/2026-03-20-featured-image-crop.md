# Featured Image Crop Tool — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual crop tool to the blog editor so users can adjust featured image crops for post header (928x333), thumbnail (250x150), and OG image (1200x630).

**Architecture:** Frontend crop UI using `react-image-crop` sends natural-pixel coordinates to a new WordPress REST endpoint that generates cropped files server-side via `wp_get_image_editor()`. Crop coordinates are stored in `_bbj_crop_data` post meta for re-cropping. Auto-crop defaults are generated on upload.

**Tech Stack:** react-image-crop, WordPress WP_Image_Editor (GD/Imagick), Next.js React components

**Spec:** `docs/superpowers/specs/2026-03-20-featured-image-crop-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/components/editor/CropModal.jsx` | Modal with tabbed crop UI, coordinate conversion, previews |
| Modify | `src/components/editor/ImageUploader.jsx` | Add "Crop Image" button, pass crop state |
| Modify | `src/components/editor/EditorPage.jsx` | Add `cropData` state + stateRef, pass through sidebar |
| Modify | `src/components/editor/EditorSidebar.jsx` | Pass crop props to ImageUploader |
| Modify | `src/lib/api/editor.js` | Add `cropImage()` API function |
| Modify | `EditorRoutes.php` | Add crop endpoint, update getPost/updatePost for crop_data |

**WordPress plugin location:** `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\EditorRoutes.php`

---

### Task 1: Install react-image-crop

**Files:** package.json

- [ ] **Step 1: Install the package**

```bash
cd /c/xampp/htdocs/bbj-app && npm install react-image-crop
```

- [ ] **Step 2: Verify installation**

```bash
ls node_modules/react-image-crop/dist
```
Expected: CSS and JS files present.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install react-image-crop for featured image cropping"
```

---

### Task 2: Backend — Crop Image Endpoint

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\EditorRoutes.php`

- [ ] **Step 1: Register the route**

In `registerRoutes()`, after the existing media route registration (around line 72), add:

```php
register_rest_route($namespace, '/editor/crop-image', [
    'methods' => 'POST',
    'callback' => [$this, 'cropImage'],
    'permission_callback' => [$this, 'canWrite'],
]);
```

- [ ] **Step 2: Add the crop handler method**

Add this method after the existing `uploadMedia` method (after line 439):

```php
// --- Image Cropping ---

private const CROP_SIZES = [
    'header'    => ['width' => 928, 'height' => 333],
    'thumbnail' => ['width' => 250, 'height' => 150],
    'og'        => ['width' => 1200, 'height' => 630],
];

public function cropImage(\WP_REST_Request $request): \WP_REST_Response
{
    $params = $request->get_json_params();
    $attachmentId = (int) ($params['attachment_id'] ?? 0);
    $crops = $params['crops'] ?? [];

    if (!$attachmentId || !wp_get_attachment_url($attachmentId)) {
        return new \WP_REST_Response(['error' => 'Invalid attachment ID'], 400);
    }

    if (empty($crops)) {
        return new \WP_REST_Response(['error' => 'No crop data provided'], 400);
    }

    require_once ABSPATH . 'wp-admin/includes/image.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';

    $filePath = get_attached_file($attachmentId);
    if (!$filePath || !file_exists($filePath)) {
        return new \WP_REST_Response(['error' => 'Original file not found'], 404);
    }

    $uploadDir = wp_upload_dir();
    $pathInfo = pathinfo($filePath);
    $results = [];

    foreach (self::CROP_SIZES as $key => $targetSize) {
        if (!isset($crops[$key])) {
            continue;
        }

        $crop = $crops[$key];
        $x = (int) ($crop['x'] ?? 0);
        $y = (int) ($crop['y'] ?? 0);
        $w = (int) ($crop['width'] ?? 0);
        $h = (int) ($crop['height'] ?? 0);

        if ($w <= 0 || $h <= 0) {
            continue;
        }

        $editor = wp_get_image_editor($filePath);
        if (is_wp_error($editor)) {
            error_log("BBJ crop failed for {$key}: " . $editor->get_error_message());
            return new \WP_REST_Response([
                'error' => "Image editor failed: " . $editor->get_error_message(),
            ], 500);
        }

        // Crop to selected area
        $cropped = $editor->crop($x, $y, $w, $h);
        if (is_wp_error($cropped)) {
            return new \WP_REST_Response([
                'error' => "Crop failed for {$key}: " . $cropped->get_error_message(),
            ], 500);
        }

        // Resize to target dimensions (will not upscale beyond source crop area)
        $editor->resize($targetSize['width'], $targetSize['height'], true);

        // Save with suffix
        $outputName = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . "-bbj-{$key}." . $pathInfo['extension'];
        $saved = $editor->save($outputName);

        if (is_wp_error($saved)) {
            return new \WP_REST_Response([
                'error' => "Save failed for {$key}: " . $saved->get_error_message(),
            ], 500);
        }

        // Convert file path to URL
        $relPath = str_replace($uploadDir['basedir'], '', $saved['path']);
        $url = $uploadDir['baseurl'] . $relPath;

        $results[$key] = [
            'url' => $url,
            'width' => $saved['width'],
            'height' => $saved['height'],
        ];
    }

    return new \WP_REST_Response([
        'success' => true,
        'crops' => $results,
    ]);
}
```

- [ ] **Step 3: Test the endpoint manually**

```bash
# Use a real attachment ID from the WP database
curl -X POST "https://stg-wp.bigbrotherjunkies.com/wp-json/bbjd/v1/editor/crop-image" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"attachment_id": 12345, "crops": {"header": {"x":0,"y":0,"width":1600,"height":574}}}'
```

Expected: 201 response with crop URL, or 400/500 with descriptive error.

- [ ] **Step 4: Commit**

```bash
cd /c/xampp/htdocs/bbj/wp-content/plugins/bigbrotherjunkies-data
git add -A
git commit -m "feat(editor): add crop-image endpoint for featured image cropping"
```

---

### Task 3: Backend — Add crop_data to getPost/updatePost

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\EditorRoutes.php`

- [ ] **Step 1: Add crop_data to getPost response**

In `getPost()` (line 259), add `crop_data` to the response array, after `review_note`:

```php
'crop_data' => json_decode(get_post_meta($postId, '_bbj_crop_data', true) ?: '{}', true),
```

- [ ] **Step 2: Add crop_data saving to updatePost**

In `updatePost()`, after the meta_description block (around line 333), add:

```php
// Update crop data
if (isset($params['crop_data'])) {
    if (empty($params['crop_data'])) {
        delete_post_meta($postId, '_bbj_crop_data');
    } else {
        update_post_meta($postId, '_bbj_crop_data', wp_json_encode($params['crop_data']));
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(editor): add crop_data to getPost/updatePost endpoints"
```

---

### Task 4: Frontend — Add cropImage API function

**Files:**
- Modify: `src/lib/api/editor.js`

- [ ] **Step 1: Add the cropImage function**

After the `uploadMedia` function (around line 66), add:

```js
// --- Image Cropping ---

export async function cropImage(attachmentId, crops) {
  return adminFetch("/editor/crop-image", {
    method: "POST",
    body: JSON.stringify({ attachment_id: attachmentId, crops }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api/editor.js
git commit -m "feat(editor): add cropImage API function"
```

---

### Task 5: Frontend — CropModal Component

**Files:**
- Create: `src/components/editor/CropModal.jsx`

- [ ] **Step 1: Create the CropModal component**

```jsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { cropImage } from "@/lib/api/editor";

const CROP_CONFIGS = [
  { key: "header", label: "Post Header", width: 928, height: 333, aspect: 928 / 333 },
  { key: "thumbnail", label: "Thumbnail", width: 250, height: 150, aspect: 250 / 150 },
  { key: "og", label: "Social Share", width: 1200, height: 630, aspect: 1200 / 630 },
];

function getDefaultCrop(aspect, imgWidth, imgHeight) {
  // Calculate centered crop at max area for this aspect ratio
  const imgAspect = imgWidth / imgHeight;
  let cropWidth, cropHeight;

  if (imgAspect > aspect) {
    // Image is wider — constrain by height
    cropHeight = 100;
    cropWidth = (aspect * imgHeight / imgWidth) * 100;
  } else {
    // Image is taller — constrain by width
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

export default function CropModal({ imageUrl, attachmentId, initialCrops, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const [crops, setCrops] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const imgRef = useRef(null);

  // Initialize crops when image loads
  const onImageLoad = useCallback((e) => {
    imgRef.current = e.currentTarget;
    const { naturalWidth, naturalHeight } = e.currentTarget;

    const initial = {};
    CROP_CONFIGS.forEach((config) => {
      if (initialCrops?.[config.key]) {
        // Convert saved natural pixel coords back to percentage for ReactCrop
        const saved = initialCrops[config.key];
        initial[config.key] = {
          unit: "%",
          x: (saved.x / naturalWidth) * 100,
          y: (saved.y / naturalHeight) * 100,
          width: (saved.width / naturalWidth) * 100,
          height: (saved.height / naturalHeight) * 100,
        };
      } else {
        initial[config.key] = getDefaultCrop(config.aspect, naturalWidth, naturalHeight);
      }
    });
    setCrops(initial);
  }, [initialCrops]);

  function handleCropChange(key, newCrop) {
    setCrops((prev) => ({ ...prev, [key]: newCrop }));
  }

  async function handleSave() {
    if (!imgRef.current) return;
    setSaving(true);
    setError(null);

    const { naturalWidth, naturalHeight } = imgRef.current;

    // Convert percentage crops to natural pixel coordinates
    const naturalCrops = {};
    CROP_CONFIGS.forEach((config) => {
      const c = crops[config.key];
      if (!c) return;
      naturalCrops[config.key] = {
        x: Math.round((c.x / 100) * naturalWidth),
        y: Math.round((c.y / 100) * naturalHeight),
        width: Math.round((c.width / 100) * naturalWidth),
        height: Math.round((c.height / 100) * naturalHeight),
      };
    });

    try {
      const result = await cropImage(attachmentId, naturalCrops);
      // Merge coordinates with returned URLs
      const cropData = { original_id: attachmentId, crops: {} };
      CROP_CONFIGS.forEach((config) => {
        if (result.crops[config.key]) {
          cropData.crops[config.key] = {
            ...naturalCrops[config.key],
            url: result.crops[config.key].url,
          };
        }
      });
      onSave(cropData);
    } catch (err) {
      setError(err.message || "Failed to save crops");
    } finally {
      setSaving(false);
    }
  }

  const activeConfig = CROP_CONFIGS[activeTab];
  const activeCrop = crops[activeConfig.key];

  // Check if source image is smaller than target
  const sizeWarning = imgRef.current && (
    imgRef.current.naturalWidth < activeConfig.width ||
    imgRef.current.naturalHeight < activeConfig.height
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-osw text-lg font-bold text-gray-800 dark:text-white">Crop Featured Image</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {CROP_CONFIGS.map((config, i) => (
            <button
              key={config.key}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === i
                  ? "text-primary-500 border-b-2 border-primary-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {config.label}
              <span className="block text-[10px] text-gray-400">{config.width}x{config.height}</span>
            </button>
          ))}
        </div>

        {/* Crop Area */}
        <div className="flex-1 overflow-auto p-4">
          {sizeWarning && (
            <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-700 dark:text-yellow-400">
              Source image is smaller than {activeConfig.width}x{activeConfig.height} — crop may appear blurry.
            </div>
          )}

          {error && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {activeCrop && (
            <ReactCrop
              crop={activeCrop}
              onChange={(_, percentCrop) => handleCropChange(activeConfig.key, percentCrop)}
              aspect={activeConfig.aspect}
              className="max-h-[50vh]"
            >
              <img
                src={imageUrl}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-w-full"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          )}

          {/* Previews */}
          {imgRef.current && Object.keys(crops).length === 3 && (
            <div className="mt-4 flex gap-3 justify-center">
              {CROP_CONFIGS.map((config) => {
                const c = crops[config.key];
                if (!c || !imgRef.current) return null;
                const nat = imgRef.current;
                // Calculate preview clip
                const previewH = 60;
                const previewW = previewH * config.aspect;
                return (
                  <div key={config.key} className="text-center">
                    <div
                      className="overflow-hidden rounded border border-gray-200 dark:border-gray-700"
                      style={{ width: previewW, height: previewH }}
                    >
                      <img
                        src={imageUrl}
                        alt={config.label}
                        style={{
                          width: nat.naturalWidth * (previewW / ((c.width / 100) * nat.naturalWidth)),
                          height: nat.naturalHeight * (previewH / ((c.height / 100) * nat.naturalHeight)),
                          marginLeft: -(c.x / 100) * nat.naturalWidth * (previewW / ((c.width / 100) * nat.naturalWidth)),
                          marginTop: -(c.y / 100) * nat.naturalHeight * (previewH / ((c.height / 100) * nat.naturalHeight)),
                          maxWidth: "none",
                        }}
                        crossOrigin="anonymous"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">{config.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Crops"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders without errors**

Import it temporarily in a test page or check for lint errors:

```bash
npx next lint src/components/editor/CropModal.jsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/CropModal.jsx
git commit -m "feat(editor): add CropModal component with tabbed crop UI"
```

---

### Task 6: Frontend — Wire ImageUploader to CropModal

**Files:**
- Modify: `src/components/editor/ImageUploader.jsx`

- [ ] **Step 1: Update ImageUploader with crop button and modal**

Replace the full contents of `ImageUploader.jsx`:

```jsx
"use client";

import { useState, useRef, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { uploadMedia, generateAltText } from "@/lib/api/editor";
import CropModal from "./CropModal";

export default function ImageUploader({ imageId, imageUrl, cropData, onUpload, onRemove, onCropSave }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const fileRef = useRef(null);

  const compressAndUpload = useCallback(async (file) => {
    setUploading(true);
    setProgress(10);

    try {
      // Client-side compression
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1600,
        initialQuality: 0.8,
        useWebWorker: true,
      });
      setProgress(40);

      // Ensure the compressed blob has a proper filename
      const fileName = file.name || "image.jpg";
      const fileToUpload = new File([compressed], fileName, { type: compressed.type || file.type });

      // Upload to WordPress
      const result = await uploadMedia(fileToUpload);
      setProgress(70);

      // Generate AI alt text
      let altText = "";
      try {
        const altResult = await generateAltText(result.url);
        altText = altResult.altText;
      } catch {
        altText = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      }
      setProgress(100);

      onUpload(result.id, result.url, altText);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUpload]);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      compressAndUpload(file);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) compressAndUpload(file);
  }

  if (imageUrl) {
    return (
      <>
        <div className="relative group">
          <img src={imageUrl} alt="Featured" className="w-full rounded-lg border border-gray-200" />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition"
          >
            ✕
          </button>
        </div>
        <button
          onClick={() => setShowCrop(true)}
          className="mt-2 w-full py-1.5 text-xs font-medium text-primary-500 hover:text-primary-600 border border-primary-300 hover:border-primary-400 rounded-lg transition-colors"
        >
          Crop Image
        </button>

        {showCrop && (
          <CropModal
            imageUrl={imageUrl}
            attachmentId={imageId}
            initialCrops={cropData?.crops || null}
            onSave={(data) => {
              onCropSave?.(data);
              setShowCrop(false);
            }}
            onClose={() => setShowCrop(false)}
          />
        )}
      </>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
        dragOver ? "border-primary-400 bg-primary-50" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      {uploading ? (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500">Compressing & uploading...</p>
        </div>
      ) : (
        <>
          <div className="text-2xl text-gray-400 mb-1">📷</div>
          <p className="text-xs text-gray-500">Drag & drop or click to upload</p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/ImageUploader.jsx
git commit -m "feat(editor): add crop button and modal to ImageUploader"
```

---

### Task 7: Frontend — Wire EditorPage and EditorSidebar

**Files:**
- Modify: `src/components/editor/EditorPage.jsx`
- Modify: `src/components/editor/EditorSidebar.jsx`

- [ ] **Step 1: Add cropData state to EditorPage**

In `EditorPage.jsx`, after `const [reviewNote, setReviewNote] = useState("");` (line 37), add:

```js
const [cropData, setCropData] = useState(null);
```

- [ ] **Step 2: Add cropData to stateRef**

Update the `stateRef` initial value (line 50):

```js
const stateRef = useRef({ title, slug, categoryIds, featuredImageId, metaDescription, currentPostId, cropData });
```

Update the `useEffect` that syncs stateRef (line 54-56):

```js
useEffect(() => {
  stateRef.current = { title, slug, categoryIds, featuredImageId, metaDescription, currentPostId, cropData };
}, [title, slug, categoryIds, featuredImageId, metaDescription, currentPostId, cropData]);
```

- [ ] **Step 3: Load cropData in loadPost**

In `loadPost()`, after `setReviewNote(data.review_note);` (line 117), add:

```js
setCropData(data.crop_data && Object.keys(data.crop_data).length > 0 ? data.crop_data : null);
```

- [ ] **Step 4: Include cropData in save**

In the `doSave` function, update the `postData` object (around line 147) to include crop_data:

```js
const { title: t, slug: s, categoryIds: cats, featuredImageId: imgId, metaDescription: meta, currentPostId: pid, cropData: cd } = stateRef.current;

const postData = {
  title: t || "Untitled Draft",
  content: editor.getHTML(),
  category_id: cats,
  featured_image_id: imgId,
  meta_description: meta,
  slug: s,
  crop_data: cd,
};
```

- [ ] **Step 5: Clear cropData when featured image is removed**

In the `sidebarProps` section, update the `onRemove` handler. First, add `cropData` and `onCropSave` to `sidebarProps` (around line 292):

```js
const sidebarProps = {
  categoryIds,
  setCategoryIds,
  featuredImageId,
  setFeaturedImageId,
  featuredImageUrl,
  setFeaturedImageUrl,
  cropData,
  onCropSave: (data) => {
    setCropData(data);
    scheduleSave();
  },
  title,
  slug,
  setSlug,
  metaDescription,
  setMetaDescription,
  checklist,
  saveStatus: getSaveStatusText(),
  reviewNote,
  editor,
  onSave: scheduleSave,
  onTitleChange: handleTitleSet,
  isEditMode: !!postId,
};
```

- [ ] **Step 6: Update EditorSidebar to pass crop props**

In `EditorSidebar.jsx`, add `cropData` and `onCropSave` to the destructured props:

```jsx
export default function EditorSidebar({
  categoryIds, setCategoryIds,
  featuredImageId, setFeaturedImageId,
  featuredImageUrl, setFeaturedImageUrl,
  cropData, onCropSave,
  title, slug, setSlug,
  metaDescription, setMetaDescription,
  checklist, saveStatus, reviewNote,
  editor, onSave, onTitleChange, isEditMode,
}) {
```

Update the `ImageUploader` usage to pass the new props:

```jsx
<ImageUploader
  imageId={featuredImageId}
  imageUrl={featuredImageUrl}
  cropData={cropData}
  onUpload={(id, url, altText) => {
    setFeaturedImageId(id);
    setFeaturedImageUrl(url);
    onSave?.();
  }}
  onRemove={() => {
    setFeaturedImageId(null);
    setFeaturedImageUrl(null);
    onCropSave?.(null);
    onSave?.();
  }}
  onCropSave={onCropSave}
/>
```

- [ ] **Step 7: Build and verify**

```bash
npx next build 2>&1 | tail -15
```

Expected: Build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/editor/EditorPage.jsx src/components/editor/EditorSidebar.jsx
git commit -m "feat(editor): wire cropData state through EditorPage and EditorSidebar"
```

---

### Task 8: Deploy and Test End-to-End

**Files:** None (deployment + manual testing)

- [ ] **Step 1: Deploy plugin to staging**

```bash
bash /c/xampp/htdocs/bbj-app/.claude/scripts/deploy-plugin.sh --staging
```

- [ ] **Step 2: Test on localhost**

1. Open `localhost:3000/editor/new`
2. Upload a featured image — should upload successfully
3. Click "Crop Image" — modal should open with three tabs
4. Adjust the header crop — drag the crop box
5. Switch to Thumbnail and OG tabs — each should have its own crop area
6. Check the previews at the bottom — all three should update
7. Click "Save Crops" — should succeed, no console errors
8. Save the post — crop data should be saved with the post
9. Reload the editor — crop data should be restored, "Crop Image" should re-open with saved coordinates

- [ ] **Step 3: Push to staging**

```bash
git add -A
git push
```

- [ ] **Step 4: Deploy plugin to staging**

```bash
bash /c/xampp/htdocs/bbj-app/.claude/scripts/deploy-plugin.sh --staging
```
