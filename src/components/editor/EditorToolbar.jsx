"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import EmbedModal from "./EmbedModal";

const COLORS = [
  "#000000", "#E55C41", "#35546e", "#FFBF0F", "#059669",
  "#EF4444", "#6366F1", "#EC4899", "#94A3B8", "#FFFFFF",
];

export default function EditorToolbar({ editor, onImageUpload, inlineUpload }) {
  const [showColors, setShowColors] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [fixedStyle, setFixedStyle] = useState({});
  const observerRef = useRef(null);
  const sentinelNodeRef = useRef(null);

  // Measure the editor column and header, apply to fixed toolbar
  const updateFixedPosition = useCallback(() => {
    const sentinel = sentinelNodeRef.current;
    if (!sentinel) return;
    const column = sentinel.parentElement;
    const header = document.querySelector("header");
    const rect = column.getBoundingClientRect();
    setFixedStyle({
      top: header ? header.offsetHeight : 0,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Callback ref — fires every time the sentinel DOM node changes
  const sentinelCallback = useCallback((node) => {
    sentinelNodeRef.current = node;
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      const header = document.querySelector("header");
      const obs = new IntersectionObserver(
        ([entry]) => {
          const shouldFix = !entry.isIntersecting;
          setIsFixed(shouldFix);
        },
        { threshold: 0, rootMargin: `-${header?.offsetHeight || 0}px 0px 0px 0px` }
      );
      obs.observe(node);
      observerRef.current = obs;
    }
  }, []);

  // Recalculate position on scroll/resize when fixed
  useEffect(() => {
    if (!isFixed) return;
    updateFixedPosition();
    const onResize = () => updateFixedPosition();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isFixed, updateFixedPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  if (!editor) return null;

  function ToolButton({ onClick, active, children, title }) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`px-2 py-1 text-sm rounded transition ${
          active
            ? "bg-primary-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        {children}
      </button>
    );
  }

  return (
    <>
    <div ref={sentinelCallback} className="h-0 w-full" />
    {isFixed && <div className="h-[44px]" />}
    <div
      className={`bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 p-2 flex flex-wrap gap-1 items-center ${
        isFixed
          ? "fixed z-[45] shadow-md rounded-b-xl rounded-t-none border-t-0"
          : "rounded-xl shadow-sm mb-3 z-40"
      }`}
      style={isFixed ? fixedStyle : undefined}
    >
      {/* Text formatting */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <strong>B</strong>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <em>I</em>
      </ToolButton>

      <span className="text-gray-300 mx-1">|</span>

      {/* Headings */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        active={editor.isActive("heading", { level: 4 })}
        title="Heading 4"
      >
        H4
      </ToolButton>

      <span className="text-gray-300 mx-1">|</span>

      {/* Lists */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003h12m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 1 1 1.591 1.59l-1.83 1.83h2.16M2.99 15.745h1.125a1.125 1.125 0 0 1 0 2.25H3.74m0-.002h.375a1.125 1.125 0 0 1 0 2.25H2.99" /></svg>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" /></svg>
      </ToolButton>

      <span className="text-gray-300 mx-1">|</span>

      {/* Alignment */}
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        title="Align Left"
      >
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5M3.75 17.25h13.5" /></svg>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        title="Align Center"
      >
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M6.75 12h10.5M5.25 17.25h13.5" /></svg>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        title="Align Right"
      >
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M9.75 12h10.5M6.75 17.25h13.5" /></svg>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        active={editor.isActive({ textAlign: "justify" })}
        title="Justify"
      >
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" /></svg>
      </ToolButton>

      <span className="text-gray-300 mx-1">|</span>

      {/* Link */}
      <ToolButton
        onClick={() => {
          const url = window.prompt("Enter URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
          }
        }}
        active={editor.isActive("link")}
        title="Link"
      >
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
      </ToolButton>

      {/* Image */}
      <ToolButton
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              onImageUpload?.(file);
            }
          };
          input.click();
        }}
        title="Insert Image"
      >
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
      </ToolButton>

      {/* Embed */}
      <ToolButton onClick={() => setShowEmbed(true)} title="Embed Tweet/Instagram">
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>
      </ToolButton>

      {/* Table */}
      <ToolButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert Table"
      >
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M12 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" /></svg>
      </ToolButton>

      {/* Color */}
      <div className="relative">
        <ToolButton onClick={() => setShowColors(!showColors)} title="Text Color">
          <svg className="w-4 h-4 inline" viewBox="0 0 20 20"><text x="3" y="14" fontSize="14" fontWeight="bold" fill="currentColor" fontFamily="sans-serif">A</text><rect x="2" y="16" width="16" height="3" rx="0.5" fill="#E55C41" /></svg>
        </ToolButton>
        {showColors && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg p-2 shadow-lg z-50 flex flex-wrap gap-1 w-40">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  editor.chain().focus().setColor(color).run();
                  setShowColors(false);
                }}
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <button
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setShowColors(false);
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-700 mt-1"
            >
              Reset color
            </button>
          </div>
        )}
      </div>

      {/* Inline upload progress */}
      {inlineUpload && (
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-28 bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${inlineUpload.error ? "bg-red-500" : "bg-primary-500"}`}
              style={{ width: `${inlineUpload.progress}%` }}
            />
          </div>
          <span className={`text-xs whitespace-nowrap ${inlineUpload.error ? "text-red-500" : "text-gray-500"}`}>
            {inlineUpload.status}
          </span>
        </div>
      )}

      {/* Embed modal */}
      {showEmbed && (
        <EmbedModal editor={editor} onClose={() => setShowEmbed(false)} />
      )}
    </div>
    </>
  );
}
