"use client";

import { useState } from "react";
import EmbedModal from "./EmbedModal";

const COLORS = [
  "#000000", "#E55C41", "#35546e", "#FFBF0F", "#059669",
  "#EF4444", "#6366F1", "#EC4899", "#94A3B8", "#FFFFFF",
];

export default function EditorToolbar({ editor, onImageUpload }) {
  const [showColors, setShowColors] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

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
    <div className="bg-white border border-gray-200 rounded-lg p-2 mb-4 flex flex-wrap gap-1 items-center sticky top-[48px] z-40">
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
        {"• List"}
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered List"
      >
        {"1. List"}
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        {'" "'}
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
        {"🔗"}
      </ToolButton>

      {/* Image — errata #7: use prop callback instead of custom event */}
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
        {"📷"}
      </ToolButton>

      {/* Embed */}
      <ToolButton onClick={() => setShowEmbed(true)} title="Embed Tweet/Instagram">
        {"📋"}
      </ToolButton>

      {/* Table */}
      <ToolButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert Table"
      >
        Table
      </ToolButton>

      {/* Color */}
      <div className="relative">
        <ToolButton onClick={() => setShowColors(!showColors)} title="Text Color">
          {"🎨"}
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

      {/* Embed modal */}
      {showEmbed && (
        <EmbedModal editor={editor} onClose={() => setShowEmbed(false)} />
      )}
    </div>
  );
}
