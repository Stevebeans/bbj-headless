"use client";

import CategoryPicker from "./CategoryPicker";
import ImageUploader from "./ImageUploader";
import SEOPanel from "./SEOPanel";
import PublishChecklist from "./PublishChecklist";

export default function EditorSidebar({
  categoryIds, setCategoryIds,
  featuredImageId, setFeaturedImageId,
  featuredImageUrl, setFeaturedImageUrl,
  title, slug, setSlug,
  metaDescription, setMetaDescription,
  checklist, saveStatus, reviewNote,
  editor, onSave, onTitleChange, isEditMode,
}) {
  return (
    <div className="p-4 space-y-5">
      <CategoryPicker
        categoryIds={categoryIds}
        setCategoryIds={setCategoryIds}
        onTitleSuggestion={onTitleChange}
        onSave={onSave}
        isEditMode={isEditMode}
      />

      <div>
        <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
          Featured Image <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <ImageUploader
            imageId={featuredImageId}
            imageUrl={featuredImageUrl}
            onUpload={(id, url, altText) => {
              setFeaturedImageId(id);
              setFeaturedImageUrl(url);
              onSave?.();
            }}
            onRemove={() => {
              setFeaturedImageId(null);
              setFeaturedImageUrl(null);
              onSave?.();
            }}
          />
        </div>
      </div>

      <SEOPanel
        title={title}
        slug={slug}
        setSlug={setSlug}
        onSave={onSave}
        onTitleChange={onTitleChange}
        editor={editor}
      />

      <PublishChecklist checklist={checklist} />

      {/* Save status */}
      <div className="text-xs text-green-600">{saveStatus}</div>

      {/* Review note (if returned from reviewer) */}
      {reviewNote && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-red-600 uppercase mb-1">Review Note</h4>
          <p className="text-sm text-red-700">{reviewNote}</p>
        </div>
      )}
    </div>
  );
}
