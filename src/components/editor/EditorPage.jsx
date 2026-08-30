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
import TextAlign from "@tiptap/extension-text-align";
import EditorToolbar from "./EditorToolbar";
import EditorSidebar from "./EditorSidebar";
import MobileSettingsSheet from "./MobileSettingsSheet";
import { createPost, updatePost, changePostStatus, getPost, generateMeta, restoreRevision } from "@/lib/api/editor";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { shouldBlockAutoSave } from "@/lib/editor/saveGuard";
import { consumePrefill } from "@/lib/editor/draftHandoff";

// Save-toast appearance, keyed by save status. Anything unrecognized (e.g.
// "idle", which never shows a toast) falls back to the "saved" look.
const TOAST_STYLE = {
  saving: "bg-gray-800 text-white",
  error: "bg-red-600 text-white",
  paused: "bg-amber-600 text-white",
  saved: "bg-green-600 text-white",
};

const TOAST_TEXT = {
  saving: "Saving...",
  error: "Save failed",
  paused: "Auto-save paused — content shrank a lot. Click Save if that was intentional.",
  saved: "Saved",
};

export default function EditorPage({ postId = null }) {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Post state
  const [currentPostId, setCurrentPostId] = useState(postId);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  // UTC 'Y-m-d H:i:s' when the post is scheduled (status "future").
  const [scheduledFor, setScheduledFor] = useState(null);
  const [categoryIds, setCategoryIds] = useState([]);
  const [featuredImageId, setFeaturedImageId] = useState(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState(null);
  const [metaDescription, setMetaDescription] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [cropData, setCropData] = useState(null);

  // Live-thread state
  const [liveUpdates, setLiveUpdates] = useState(false);
  const [liveStart, setLiveStart] = useState(0);
  const [liveEnd, setLiveEnd] = useState(0);

  // Ghost byline (admin-only): publish under the BennyBronx account.
  const [ghostAuthor, setGhostAuthor] = useState(false);

  // UI state
  const [saveStatus, setSaveStatus] = useState("idle");
  const [lastSaved, setLastSaved] = useState(null);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!!postId);
  const [loadError, setLoadError] = useState(null); // sticky toast text when getPost fails

  // Refs for auto-save — fixes stale closure bug (#3)
  // The timer-captured savePost always reads from refs, not stale state
  const saveTimerRef = useRef(null);
  const isSavingRef = useRef(false);
  const isRestoringRef = useRef(false); // a revision restore owns the document — no saves
  const isFirstSaveRef = useRef(!postId);
  const lastSavedLenRef = useRef(0);       // content length at last successful save
  const hasLoadedRef = useRef(!postId);    // existing posts must load before any save
  const stateRef = useRef({ title, slug, categoryIds, featuredImageId, metaDescription, currentPostId, cropData, liveUpdates, liveStart, liveEnd, ghostAuthor });
  const [pendingContent, setPendingContent] = useState(null); // For editor content loading timing (#4)

  // Keep stateRef in sync with latest state values
  useEffect(() => {
    stateRef.current = { title, slug, categoryIds, featuredImageId, metaDescription, currentPostId, cropData, liveUpdates, liveStart, liveEnd, ghostAuthor };
  }, [title, slug, categoryIds, featuredImageId, metaDescription, currentPostId, cropData, liveUpdates, liveStart, liveEnd, ghostAuthor]);

  const canPublish = hasPermission("blog_publishing") || hasPermission("blog_review");
  // Server enforces this independently (manage_options); admin_settings is the
  // admin-only permission key, so in practice this is Steve.
  const canGhost = hasPermission("admin_settings");

  // editorProps callbacks are captured once at editor creation — route paste/
  // drop images through refs so they always hit the latest handler/editor.
  const handleImageUploadRef = useRef(null);
  const editorRef = useRef(null);

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
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4",
        // Chrome won't spell-check rich contenteditable regions unless it's
        // explicitly enabled on the element.
        spellcheck: "true",
      },
      transformPastedText(text) {
        return text;
      },
      // Paste an image (e.g. a screenshot) straight into the post — uploads
      // through the same compress → media-library → alt-text pipeline as the
      // toolbar image button, then inserts at the cursor.
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type?.startsWith("image/"));
        if (!imageItem) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        event.preventDefault();
        handleImageUploadRef.current?.(file);
        return true;
      },
      // Drag-and-drop an image file into the editor: place the cursor at the
      // drop point, then run the same upload pipeline.
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const file = Array.from(event.dataTransfer?.files || []).find((f) =>
          f.type?.startsWith("image/")
        );
        if (!file) return false;
        event.preventDefault();
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (coords?.pos != null) {
          editorRef.current?.commands.setTextSelection(coords.pos);
        }
        handleImageUploadRef.current?.(file);
        return true;
      },
    },
    onUpdate: () => {
      scheduleSave();
    },
  });

  // Fix #4: If content was loaded before editor was ready, set it now
  useEffect(() => {
    if (editor && pendingContent) {
      editor.commands.setContent(pendingContent);
      // Re-baseline against the editor's own serialization now that it exists
      // — same reason as applyPostData below.
      lastSavedLenRef.current = editor.getHTML().length;
      setPendingContent(null);
    }
  }, [editor, pendingContent]);

  // Keep the paste/drop refs pointed at the live editor + upload handler
  useEffect(() => {
    editorRef.current = editor;
    handleImageUploadRef.current = handleImageUpload;
  });

  // Load existing post
  useEffect(() => {
    if (postId) {
      loadPost(postId);
    }
  }, [postId]);

  // New-post prefill from the Social page's "Open in editor" handoff
  // (blog recap → title + body). One-shot: consumePrefill deletes the
  // payload, so a refresh lands on a normal blank editor.
  useEffect(() => {
    if (postId) return;
    const prefill = consumePrefill();
    if (!prefill) return;
    if (prefill.title) setTitle(prefill.title);
    // The pendingContent effect applies this once the editor exists and
    // re-baselines the save guard, same as loading an existing post.
    setPendingContent(prefill.html);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPostData(data) {
    setTitle(data.title);
    setSlug(data.slug);
    setStatus(data.status === "pending" ? "pending_review" : data.status);
    setCategoryIds(data.categories?.map((c) => c.id) || []);
    setFeaturedImageId(data.featured_image?.id || null);
    setFeaturedImageUrl(data.featured_image?.url || null);
    setMetaDescription(data.meta_description);
    setReviewNote(data.review_note);
    setCropData(data.crop_data && Object.keys(data.crop_data).length > 0 ? data.crop_data : null);
    setLiveUpdates(!!data.live_updates);
    setLiveStart(Number(data.live_start) || 0);
    setLiveEnd(Number(data.live_end) || 0);
    setGhostAuthor(!!data.ghost_author);
    setScheduledFor(data.scheduled_for || null);
    if (editor && data.content) {
      editor.commands.setContent(data.content);
      // Baseline off the editor's own serialization, not the server HTML: the
      // next auto-save measures editor.getHTML(), and TipTap's round-trip can
      // differ enough on exotic markup to trip the shrink guard for no reason.
      lastSavedLenRef.current = editor.getHTML().length;
    } else if (data.content) {
      // Editor not ready yet — store content for later. This length is a
      // stand-in; the pendingContent effect re-baselines once the editor mounts.
      setPendingContent(data.content);
      lastSavedLenRef.current = data.content.length;
    } else {
      lastSavedLenRef.current = 0;
    }
    hasLoadedRef.current = true;
  }

  async function loadPost(id) {
    setIsLoading(true);
    try {
      const data = await getPost(id);
      applyPostData(data);
    } catch (err) {
      console.error("Failed to load post:", err);
      // hasLoadedRef stays false, so both auto-save and the Save button are
      // now inert by design. Say so — an empty editor that silently refuses
      // to save looks like a working editor until the writer loses a session.
      setLoadError("Couldn't load the post — reload the page before editing. Saving is disabled to protect your content.");
    } finally {
      setIsLoading(false);
    }
  }

  // Restore from the History panel. EditorPage owns the whole round-trip so the
  // pending auto-save can be disarmed BEFORE the POST goes out: a timer armed
  // by typing (and held back by HistoryPanel's blocking confirm) would otherwise
  // fire the moment we await, and that stale PUT lands after the restore and
  // silently reverts it server-side (the 8/8 hazard). Returns the fresh post;
  // throws so HistoryPanel can show its own error.
  async function handleRestoreRevision(revId) {
    const pid = stateRef.current.currentPostId;
    if (!pid) throw new Error("No post to restore");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    isRestoringRef.current = true;
    try {
      // A save that already cleared the guard and is awaiting its PUT can't be
      // aborted, so wait it out — the restore has to be the last write. Capped
      // at ~3s so a hung request can't wedge the Restore button forever.
      for (let i = 0; i < 30 && isSavingRef.current; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const fresh = await restoreRevision(pid, revId);
      // setContent fires onUpdate synchronously, but scheduleSave is a no-op
      // while isRestoringRef is set, so no timer survives this call.
      applyPostData(fresh);
      setSaveStatus("saved");
      setLastSaved(new Date());
      return fresh;
    } finally {
      isRestoringRef.current = false;
    }
  }

  // Auto-save logic — reads from refs to avoid stale closures
  function scheduleSave() {
    // Mid-restore the document isn't the writer's anymore: setContent's own
    // onUpdate lands here, and arming a timer would re-save the replaced text.
    if (isRestoringRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      doSave();
    }, 5000);
  }

  // Immediate save for critical actions (image upload, crop, etc.)
  function saveNow() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    doSave();
  }

  // The actual save function reads from refs, not closured state
  const doSave = useCallback(async (isManual = false) => {
    if (isSavingRef.current || !editor) return;
    // A restore is in flight (or is applying its content) — any save from here
    // would write the pre-restore document straight back over it.
    if (isRestoringRef.current) return;
    // Never save an existing post before its content has loaded — a failed
    // load + 5s timer is how the 8/8 wipe happened.
    if (!hasLoadedRef.current) return;
    isSavingRef.current = true;
    setSaveStatus("saving");

    const { title: t, slug: s, categoryIds: cats, featuredImageId: imgId, metaDescription: meta, currentPostId: pid, cropData: cd, liveUpdates: lu, liveStart: ls, liveEnd: le, ghostAuthor: ga } = stateRef.current;

    const postData = {
      title: t || "Untitled Draft",
      content: editor.getHTML(),
      category_id: cats,
      featured_image_id: imgId,
      meta_description: meta,
      slug: s,
      crop_data: cd,
      live_updates: !!lu,
      live_start: Number(ls) || 0,
      live_end: Number(le) || 0,
      ...(canGhost ? { ghost_author: ga ? 1 : 0 } : {}),
    };

    if (shouldBlockAutoSave({
      lastSavedLength: lastSavedLenRef.current,
      nextLength: postData.content.length,
      isManual,
    })) {
      isSavingRef.current = false;
      setSaveStatus("paused");
      return;
    }

    try {
      if (isFirstSaveRef.current) {
        const result = await createPost(postData);
        setCurrentPostId(result.id);
        setSlug(result.slug);
        isFirstSaveRef.current = false;
        // Native replaceState instead of router.replace: updates the URL to
        // the draft's id WITHOUT remounting the editor (router.replace
        // re-rendered the route — the "flash" a few seconds into a new post —
        // and could drop focus mid-sentence). Next 14.1+ syncs native
        // history.replaceState with the app router.
        window.history.replaceState(window.history.state, "", `/editor/${result.id}`);
      } else {
        const result = await updatePost(pid, postData);
        if (result.slug) setSlug(result.slug);
      }

      lastSavedLenRef.current = postData.content.length;
      setSaveStatus("saved");
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  }, [editor, router, canGhost]);

  // Manual save
  async function handleManualSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await doSave(true);
  }

  // Featured image upload. The immediate save reads from stateRef, which a
  // passive effect syncs from state — so write the new id into stateRef here
  // too. Otherwise the first (create) save can outrun the sync and persist
  // featured_image_id: null, then the post-create reload wipes the preview.
  function handleFeaturedImageUpload(id, url) {
    setFeaturedImageId(id);
    setFeaturedImageUrl(url);
    stateRef.current = { ...stateRef.current, featuredImageId: id };
    saveNow();
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

    // Already published: this is an edit, not a (re)publish. Content is
    // persisted by the manual save above (purge-on-edit rides the WP save
    // hook), so just confirm in place instead of navigating to the post.
    if (status === "publish") {
      setNotice("Post updated");
      return;
    }

    const newStatus = canPublish ? "publish" : "pending_review";
    try {
      await changePostStatus(pid, newStatus);
      setStatus(newStatus);

      // If publishing a live thread, atomically open it (and close the previous one if any).
      // /take-over is idempotent — safe to call even if no conflict.
      if (newStatus === "publish" && stateRef.current.liveUpdates) {
        try {
          const { getToken } = await import("@/lib/auth/cookies");
          const token = getToken();
          const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "";
          await fetch(`${apiUrl}/bbjd/v1/live-thread/take-over`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ new_post_id: pid }),
          });
        } catch (takeOverErr) {
          console.error("Live-thread take-over failed:", takeOverErr);
        }
      }

      if (newStatus === "publish") {
        router.push(`/${stateRef.current.slug}`);
      }
    } catch (err) {
      console.error("Status change failed:", err);
    }
  }

  // Schedule for later: saves, then flips the post to WP's "future" status.
  // WP-cron (external on prod) publishes it at the chosen time; the plugin
  // opens the live thread on that transition if Live Updates is checked.
  async function handleSchedule(localDateTimeValue) {
    await handleManualSave();
    const pid = stateRef.current.currentPostId;
    if (!pid) return;
    const iso = new Date(localDateTimeValue).toISOString();
    try {
      const res = await changePostStatus(pid, "future", iso);
      setStatus("future");
      setScheduledFor(res.scheduled_for || iso);
      setNotice("Post scheduled");
    } catch (err) {
      console.error("Schedule failed:", err);
      setNotice(err.message || "Schedule failed");
    }
  }

  async function handleUnschedule() {
    const pid = stateRef.current.currentPostId;
    if (!pid) return;
    try {
      await changePostStatus(pid, "draft");
      setStatus("draft");
      setScheduledFor(null);
      setNotice("Schedule removed");
    } catch (err) {
      console.error("Unschedule failed:", err);
      setNotice(err.message || "Unschedule failed");
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

  // Inline image upload state
  const [inlineUpload, setInlineUpload] = useState(null); // { status, progress }

  // Prop callback for inline image uploads from toolbar
  async function handleImageUpload(file) {
    if (!file || !editor) return;
    try {
      setInlineUpload({ status: "Compressing...", progress: 15 });
      const imageCompression = (await import("browser-image-compression")).default;
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1600,
        initialQuality: 0.8,
        useWebWorker: true,
      });
      const fileName = file.name || "image.jpg";
      const fileToUpload = new File([compressed], fileName, { type: compressed.type || file.type });

      setInlineUpload({ status: "Uploading...", progress: 50 });
      const { uploadMedia, generateAltText } = await import("@/lib/api/editor");
      const result = await uploadMedia(fileToUpload);

      setInlineUpload({ status: "Generating alt text...", progress: 80 });
      let alt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      try {
        const altResult = await generateAltText(result.url);
        alt = altResult.altText;
      } catch {}

      setInlineUpload({ status: "Done", progress: 100 });
      editor.chain().focus().setImage({ src: result.url, alt }).run();
      setTimeout(() => setInlineUpload(null), 1000);
    } catch (err) {
      console.error("Image upload failed:", err);
      setInlineUpload({ status: "Upload failed", progress: 0, error: true });
      setTimeout(() => setInlineUpload(null), 3000);
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
  const publishLabel = !canPublish
    ? "Submit"
    : status === "publish"
      ? "Update"
      : status === "future"
        ? "Publish Now"
        : "Publish";

  // Auto-hide toast after save
  const [toastVisible, setToastVisible] = useState(false);
  // One-off toast text (e.g. "Post updated") that outranks the save-status label.
  const [notice, setNotice] = useState(null);
  const toastTimerRef = useRef(null);
  // A failed load outranks everything and stays red — nothing that follows it
  // is trustworthy. Otherwise a notice owns the toast and reads as success.
  const toastStatus = loadError ? "error" : notice ? "saved" : saveStatus;

  useEffect(() => {
    if (saveStatus === "saving" || saveStatus === "error") {
      setToastVisible(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    } else if (saveStatus === "saved") {
      setToastVisible(true);
      toastTimerRef.current = setTimeout(() => setToastVisible(false), 2500);
    } else if (saveStatus === "paused") {
      setToastVisible(true); // sticky — no auto-hide; cleared by the next save attempt
    }
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, [saveStatus]);

  // Sticky, no auto-hide: the writer has to see this before typing into a
  // void, and only a reload clears it.
  useEffect(() => {
    if (!loadError) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastVisible(true);
  }, [loadError]);

  useEffect(() => {
    if (!notice) return;
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      setNotice(null);
    }, 2500);
  }, [notice]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const sidebarProps = {
    postId: currentPostId,
    onRestoreRevision: handleRestoreRevision,
    // Snippets panel: insert reusable content blocks at the cursor
    onInsertSnippet: (html) => editor?.chain().focus().insertContent(html).run(),
    postStatus: status,
    scheduledFor,
    canSchedule: canPublish,
    scheduleReady: canSubmit,
    onSchedule: handleSchedule,
    onUnschedule: handleUnschedule,
    categoryIds,
    setCategoryIds,
    featuredImageId,
    setFeaturedImageId,
    featuredImageUrl,
    setFeaturedImageUrl,
    cropData,
    onCropSave: (data) => {
      setCropData(data);
      // Use timeout to let state update before saving
      setTimeout(() => saveNow(), 0);
    },
    title,
    slug,
    setSlug,
    metaDescription,
    setMetaDescription,
    checklist,
    saveStatus: null, // displayed as toast now
    reviewNote,
    onSave: scheduleSave,
    onFeaturedImageUpload: handleFeaturedImageUpload,
    onTitleChange: handleTitleSet,
    isEditMode: !!postId,
    liveUpdates,
    liveStart,
    liveEnd,
    onLiveUpdatesChange: ({ liveUpdates: lu, liveStart: ls, liveEnd: le }) => {
      setLiveUpdates(!!lu);
      setLiveStart(Number(ls) || 0);
      setLiveEnd(Number(le) || 0);
      scheduleSave();
    },
    canGhost,
    ghostAuthor,
    onGhostChange: (next) => {
      setGhostAuthor(!!next);
      scheduleSave();
    },
  };

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-gray-950 flex flex-col">
      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-2 py-6 flex flex-col flex-1 w-full gap-4">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {"\u2190"} Back
          </button>
          {/* Mobile settings toggle */}
          <button
            onClick={() => setMobileSettingsOpen(true)}
            className="md:hidden px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 rounded-lg"
          >
            {"⚙️"}
          </button>
        </div>

        <div className="flex flex-1 gap-6">
        {/* Editor area */}
        <div className="flex-1 min-w-0">
          <EditorToolbar editor={editor} onImageUpload={handleImageUpload} inlineUpload={inlineUpload} />
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-6">
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
        {/* top offset clears the sticky site header + nav (+ countdown banner
            when active) so the Save/Preview/Publish bar stays visible */}
        <div className="hidden md:block w-72 lg:w-80 shrink-0 sticky top-[170px] self-start bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Action bar — moved here from a floating bottom-right pill so it no longer
              collides with the Ask-the-Bean launcher anchored at bottom-right. */}
          <div className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-800">
            <button onClick={handleManualSave} className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Save
            </button>
            <button onClick={handlePreview} className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              Preview
            </button>
            <button
              onClick={handlePublish}
              disabled={!canSubmit}
              className="flex-1 px-4 py-1.5 bg-secondary-500 text-primary-600 text-sm font-bold rounded-lg hover:bg-secondary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishLabel}
            </button>
          </div>
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

      {/* Floating action buttons — mobile only (desktop uses the sidebar action bar).
          Anchored bottom-left so it clears the Ask-the-Bean launcher at bottom-right. */}
      <div className="md:hidden fixed bottom-6 left-6 z-40 flex gap-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg px-2 py-1.5">
        <button onClick={handleManualSave} className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          Save
        </button>
        <button onClick={handlePreview} className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
          Preview
        </button>
        <button
          onClick={handlePublish}
          disabled={!canSubmit}
          className="px-4 py-1.5 bg-secondary-500 text-primary-600 text-sm font-bold rounded-full hover:bg-secondary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {publishLabel}
        </button>
      </div>

      {/* Save toast — a one-off notice outranks the save status and reads as success */}
      <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <div className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${TOAST_STYLE[toastStatus] || TOAST_STYLE.saved}`}>
          {toastStatus === "saving" && (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          )}
          {toastStatus === "saved" && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          )}
          {toastStatus === "error" && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          {toastStatus === "paused" && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
          )}
          {loadError || notice || TOAST_TEXT[toastStatus] || TOAST_TEXT.saved}
        </div>
      </div>
    </div>
  );
}
