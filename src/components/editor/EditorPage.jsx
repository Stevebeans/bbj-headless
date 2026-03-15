"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import EditorToolbar from "./EditorToolbar";
import EditorSidebar from "./EditorSidebar";
import MobileSettingsSheet from "./MobileSettingsSheet";
import { createPost, updatePost, changePostStatus, getPost, generateMeta } from "@/lib/api/editor";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function EditorPage({ postId = null }) {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Post state
  const [currentPostId, setCurrentPostId] = useState(postId);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [categoryIds, setCategoryIds] = useState([]);
  const [featuredImageId, setFeaturedImageId] = useState(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState(null);
  const [metaDescription, setMetaDescription] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  // UI state
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [lastSaved, setLastSaved] = useState(null);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!!postId);

  // Auto-save refs
  const saveTimerRef = useRef(null);
  const isSavingRef = useRef(false);
  const isFirstSaveRef = useRef(!postId);

  const canPublish = hasPermission("blog_publishing") || hasPermission("blog_review");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Color,
      TextStyle,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: "Start writing your post..." }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4",
      },
      // Errata #6: Use transformPastedText for plain-text paste handling
      transformPastedText(text) {
        return text;
      },
    },
    onUpdate: () => {
      scheduleSave();
    },
  });

  // Load existing post
  useEffect(() => {
    if (postId) {
      loadPost(postId);
    }
  }, [postId]);

  async function loadPost(id) {
    setIsLoading(true);
    try {
      const data = await getPost(id);
      setTitle(data.title);
      setSlug(data.slug);
      setStatus(data.status === "pending" ? "pending_review" : data.status);
      setCategoryIds(data.categories?.map((c) => c.id) || []);
      setFeaturedImageId(data.featured_image_id);
      setFeaturedImageUrl(data.featured_image_url);
      setMetaDescription(data.meta_description);
      setReviewNote(data.review_note);
      if (editor && data.content) {
        editor.commands.setContent(data.content);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-save logic
  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      savePost();
    }, 30000);
  }

  const savePost = useCallback(async () => {
    if (isSavingRef.current || !editor) return;
    isSavingRef.current = true;
    setSaveStatus("saving");

    const postData = {
      title: title || "Untitled Draft",
      content: editor.getHTML(),
      category_id: categoryIds,
      featured_image_id: featuredImageId,
      meta_description: metaDescription,
      slug,
    };

    try {
      if (isFirstSaveRef.current) {
        // First save — create post
        const result = await createPost(postData);
        setCurrentPostId(result.id);
        setSlug(result.slug);
        isFirstSaveRef.current = false;
        router.replace(`/editor/${result.id}`, { scroll: false });
      } else {
        const result = await updatePost(currentPostId, postData);
        if (result.slug) setSlug(result.slug);
      }

      setSaveStatus("saved");
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  }, [title, slug, categoryIds, featuredImageId, metaDescription, editor, currentPostId, router]);

  // Manual save
  async function handleManualSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await savePost();
  }

  // Publish / Submit for review
  // Errata #14: Generate meta description before publishing
  async function handlePublish() {
    await handleManualSave();
    if (!currentPostId) return;

    // Auto-generate meta description if not set
    if (!metaDescription && editor) {
      try {
        const metaResult = await generateMeta(editor.getText());
        if (metaResult.description) {
          setMetaDescription(metaResult.description);
          await updatePost(currentPostId, { meta_description: metaResult.description });
        }
      } catch (err) {
        console.error("Meta generation failed:", err);
      }
    }

    const newStatus = canPublish ? "publish" : "pending_review";
    try {
      await changePostStatus(currentPostId, newStatus);
      setStatus(newStatus);
      if (newStatus === "publish") {
        router.push(`/posts/${slug}`);
      }
    } catch (err) {
      console.error("Status change failed:", err);
    }
  }

  // Preview
  function handlePreview() {
    handleManualSave().then(() => {
      if (currentPostId) {
        window.open(`/preview/${currentPostId}`, "_blank");
      }
    });
  }

  // Title change triggers auto-save schedule
  function handleTitleChange(e) {
    setTitle(e.target.value);
    scheduleSave();
  }

  // Errata #7: Prop callback for title changes from sidebar components
  function handleTitleSet(newTitle) {
    setTitle(newTitle);
    scheduleSave();
  }

  // Errata #7: Prop callback for inline image uploads from toolbar
  async function handleImageUpload(file) {
    if (!file || !editor) return;
    try {
      const imageCompression = (await import("browser-image-compression")).default;
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1600,
        initialQuality: 0.8,
        useWebWorker: true,
      });
      const { uploadMedia, generateAltText } = await import("@/lib/api/editor");
      const result = await uploadMedia(compressed);

      let alt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      try {
        const altResult = await generateAltText(result.url);
        alt = altResult.altText;
      } catch {}

      editor.chain().focus().setImage({ src: result.url, alt }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  }

  // Publish checklist
  const checklist = {
    category: categoryIds.length > 0,
    featuredImage: !!featuredImageId,
    title: title.trim().length > 0,
    content: editor ? editor.getText().length >= 100 : false,
  };
  const canSubmit = Object.values(checklist).every(Boolean);

  // Save status display
  function getSaveStatusText() {
    if (saveStatus === "saving") return "Saving...";
    if (saveStatus === "saved" && lastSaved) {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
      if (seconds < 5) return "Saved just now";
      if (seconds < 60) return `Saved ${seconds}s ago`;
      return `Saved ${Math.floor(seconds / 60)}m ago`;
    }
    if (saveStatus === "error") return "Save failed";
    return "Draft";
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const sidebarProps = {
    categoryIds,
    setCategoryIds,
    featuredImageId,
    setFeaturedImageId,
    featuredImageUrl,
    setFeaturedImageUrl,
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
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-primary-500 px-4 py-2 flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={() => router.push("/editor")}
          className="text-white text-sm hover:text-secondary-500 transition"
        >
          {"\u2190"} Back
        </button>
        <div className="flex gap-2">
          <button onClick={handleManualSave} className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition">
            Save Draft
          </button>
          <button onClick={handlePreview} className="px-3 py-1 border border-secondary-500 text-secondary-500 text-sm rounded hover:bg-secondary-500 hover:text-primary-600 transition">
            Preview
          </button>
          <button
            onClick={handlePublish}
            disabled={!canSubmit}
            className="px-3 py-1 bg-secondary-500 text-primary-600 text-sm font-bold rounded hover:bg-secondary-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canPublish ? "Publish" : "Submit for Review"}
          </button>
          {/* Mobile settings toggle */}
          <button
            onClick={() => setMobileSettingsOpen(true)}
            className="md:hidden px-3 py-1 border border-secondary-500 text-secondary-500 text-sm rounded"
          >
            {"⚙️"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Editor area */}
        <div className="flex-1 p-4 md:p-6">
          <EditorToolbar editor={editor} onImageUpload={handleImageUpload} />
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Post title..."
            className="w-full text-2xl font-bold border border-gray-200 rounded-lg p-3 mb-4 focus:outline-none focus:border-primary-400"
          />
          <div className="bg-white border border-gray-200 rounded-lg min-h-[400px]">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block w-72 lg:w-80 border-l border-gray-200 bg-white overflow-y-auto sticky top-[48px] h-[calc(100vh-48px)]">
          <EditorSidebar {...sidebarProps} />
        </div>
      </div>

      {/* Mobile settings sheet */}
      <MobileSettingsSheet
        open={mobileSettingsOpen}
        onClose={() => setMobileSettingsOpen(false)}
        {...sidebarProps}
      />
    </div>
  );
}
