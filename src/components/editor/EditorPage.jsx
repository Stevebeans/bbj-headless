"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
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
  const [cropData, setCropData] = useState(null);

  // UI state
  const [saveStatus, setSaveStatus] = useState("idle");
  const [lastSaved, setLastSaved] = useState(null);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!!postId);

  // Refs for auto-save — fixes stale closure bug (#3)
  // The timer-captured savePost always reads from refs, not stale state
  const saveTimerRef = useRef(null);
  const isSavingRef = useRef(false);
  const isFirstSaveRef = useRef(!postId);
  const stateRef = useRef({ title, slug, categoryIds, featuredImageId, metaDescription, currentPostId, cropData });
  const pendingContentRef = useRef(null); // For editor content loading timing (#4)

  // Keep stateRef in sync with latest state values
  useEffect(() => {
    stateRef.current = { title, slug, categoryIds, featuredImageId, metaDescription, currentPostId, cropData };
  }, [title, slug, categoryIds, featuredImageId, metaDescription, currentPostId, cropData]);

  const canPublish = hasPermission("blog_publishing") || hasPermission("blog_review");

  const editor = useEditor({
    immediatelyRender: false,
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
      transformPastedText(text) {
        return text;
      },
    },
    onUpdate: () => {
      scheduleSave();
    },
  });

  // Fix #4: If content was loaded before editor was ready, set it now
  useEffect(() => {
    if (editor && pendingContentRef.current) {
      editor.commands.setContent(pendingContentRef.current);
      pendingContentRef.current = null;
    }
  }, [editor]);

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
      setCropData(data.crop_data && Object.keys(data.crop_data).length > 0 ? data.crop_data : null);
      if (editor && data.content) {
        editor.commands.setContent(data.content);
      } else if (data.content) {
        // Editor not ready yet — store content for later
        pendingContentRef.current = data.content;
      }
    } catch (err) {
      console.error("Failed to load post:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-save logic — reads from refs to avoid stale closures
  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      doSave();
    }, 30000);
  }

  // The actual save function reads from refs, not closured state
  const doSave = useCallback(async () => {
    if (isSavingRef.current || !editor) return;
    isSavingRef.current = true;
    setSaveStatus("saving");

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

    try {
      if (isFirstSaveRef.current) {
        const result = await createPost(postData);
        setCurrentPostId(result.id);
        setSlug(result.slug);
        isFirstSaveRef.current = false;
        router.replace(`/editor/${result.id}`, { scroll: false });
      } else {
        const result = await updatePost(pid, postData);
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
  }, [editor, router]);

  // Manual save
  async function handleManualSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await doSave();
  }

  // Publish / Submit for review
  async function handlePublish() {
    await handleManualSave();
    const pid = stateRef.current.currentPostId;
    if (!pid) return;

    // Auto-generate meta description if not set
    if (!stateRef.current.metaDescription && editor) {
      try {
        const metaResult = await generateMeta(editor.getText());
        if (metaResult.description) {
          setMetaDescription(metaResult.description);
          await updatePost(pid, { meta_description: metaResult.description });
        }
      } catch (err) {
        console.error("Meta generation failed:", err);
      }
    }

    const newStatus = canPublish ? "publish" : "pending_review";
    try {
      await changePostStatus(pid, newStatus);
      setStatus(newStatus);
      if (newStatus === "publish") {
        router.push(`/posts/${stateRef.current.slug}`);
      }
    } catch (err) {
      console.error("Status change failed:", err);
    }
  }

  // Preview
  function handlePreview() {
    handleManualSave().then(() => {
      const pid = stateRef.current.currentPostId;
      if (pid) {
        window.open(`/preview/${pid}`, "_blank");
      }
    });
  }

  // Title change triggers auto-save schedule
  function handleTitleChange(e) {
    setTitle(e.target.value);
    scheduleSave();
  }

  // Prop callback for title changes from sidebar components
  function handleTitleSet(newTitle) {
    setTitle(newTitle);
    scheduleSave();
  }

  // Prop callback for inline image uploads from toolbar
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

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-gray-950 flex flex-col">
      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-2 py-6 flex flex-col flex-1 w-full gap-4">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/editor")}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {"\u2190"} Back
          </button>
          <div className="flex gap-2">
            <button onClick={handleManualSave} className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Save Draft
            </button>
            <button onClick={handlePreview} className="px-3 py-1.5 text-sm font-medium border border-primary-500 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              Preview
            </button>
            <button
              onClick={handlePublish}
              disabled={!canSubmit}
              className="px-3 py-1.5 bg-secondary-500 text-primary-600 text-sm font-bold rounded-lg hover:bg-secondary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canPublish ? "Publish" : "Submit for Review"}
            </button>
            {/* Mobile settings toggle */}
            <button
              onClick={() => setMobileSettingsOpen(true)}
              className="md:hidden px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 rounded-lg"
            >
              {"⚙️"}
            </button>
          </div>
        </div>

        <div className="flex flex-1 gap-6">
        {/* Editor area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-6">
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
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block w-72 lg:w-80 shrink-0 sticky top-[48px] self-start bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <EditorSidebar {...sidebarProps} />
        </div>
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
