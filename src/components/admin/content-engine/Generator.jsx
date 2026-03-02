"use client";

import { useState } from "react";
import { enhanceTemplate } from "@/lib/api/admin";
import DraftEditor from "./DraftEditor";

const TEMPLATE_TYPES = [
  { id: "versus", label: "Versus" },
  { id: "rankings", label: "Rankings" },
  { id: "hot_take", label: "Hot Take" },
  { id: "trivia", label: "Trivia" },
  { id: "scenario", label: "Scenario" },
  { id: "this_or_that", label: "This or That" },
];

// Placeholder player names until real player API is wired up
const PLAYERS = [
  "Dan Gheesling",
  "Janelle Pierzina",
  "Will Kirby",
  "Danielle Reyes",
  "Derrick Levasseur",
  "Jun Song",
  "Vanessa Rousso",
  "Tyler Crispen",
  "Nicole Franzel",
  "Cody Calafiore",
  "Paul Abrahamian",
  "Rachel Reilly",
  "Kaysar Ridha",
  "Britney Haynes",
  "Memphis Garrett",
  "Keesha Smith",
];

function pick(arr, count = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return count === 1 ? shuffled[0] : shuffled.slice(0, count);
}

function generateFromTemplate(type) {
  switch (type) {
    case "versus": {
      const [a, b] = pick(PLAYERS, 2);
      return `Who wins in a Final 2: ${a} vs ${b}? Drop your pick below!`;
    }
    case "rankings": {
      const four = pick(PLAYERS, 4);
      return `Rank these players from best to worst:\n1. ${four[0]}\n2. ${four[1]}\n3. ${four[2]}\n4. ${four[3]}`;
    }
    case "hot_take": {
      const [a, b] = pick(PLAYERS, 2);
      return `Unpopular opinion: ${a} was actually a better player than ${b}. Change my mind.`;
    }
    case "trivia": {
      const facts = [
        "the most competition wins",
        "a unanimous jury vote",
        "the most alliance members",
        "a perfect game",
        "the longest HoH reign",
      ];
      return `Which season of Big Brother had ${pick(facts)}?`;
    }
    case "scenario": {
      const six = pick(PLAYERS, 6);
      return `You're HoH with these players left: ${six.join(", ")}. Who are you nominating?`;
    }
    case "this_or_that": {
      const [a, b] = pick(PLAYERS, 2);
      return `${a} or ${b}?`;
    }
    default:
      return "";
  }
}

export default function Generator() {
  const [templateType, setTemplateType] = useState("versus");
  const [generatedText, setGeneratedText] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [variations, setVariations] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editorBody, setEditorBody] = useState("");
  const [error, setError] = useState(null);

  const handleGenerate = () => {
    const text = generateFromTemplate(templateType);
    setGeneratedText(text);
    setVariations([]);
    setShowEditor(false);
    setError(null);
  };

  const handleEnhance = async () => {
    if (!generatedText.trim()) return;
    setEnhancing(true);
    setError(null);
    try {
      const data = await enhanceTemplate(generatedText);
      setVariations(data.variations || data.suggestions || []);
    } catch (err) {
      setError(err.message || "Failed to enhance");
    } finally {
      setEnhancing(false);
    }
  };

  const handleEditAndPost = (text) => {
    setEditorBody(text || generatedText);
    setShowEditor(true);
  };

  if (showEditor) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowEditor(false)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &larr; Back to Generator
        </button>
        <DraftEditor
          initialBody={editorBody}
          source="template"
          onPost={() => {
            setShowEditor(false);
            setGeneratedText("");
            setVariations([]);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Template:
        </label>
        <select
          value={templateType}
          onChange={(e) => setTemplateType(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
        >
          {TEMPLATE_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium"
        >
          Generate
        </button>
      </div>

      {/* Generated text */}
      {generatedText && (
        <div className="space-y-4">
          <textarea
            value={generatedText}
            onChange={(e) => setGeneratedText(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Regenerate
            </button>
            <button
              onClick={handleEnhance}
              disabled={enhancing}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium disabled:opacity-50"
            >
              {enhancing ? "Enhancing..." : "Enhance with AI"}
            </button>
            <button
              onClick={() => handleEditAndPost(generatedText)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium"
            >
              Edit & Post
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* AI variations */}
      {variations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Variations (click to use):
          </h3>
          <div className="grid gap-2">
            {variations.map((v, i) => (
              <button
                key={i}
                onClick={() => handleEditAndPost(v)}
                className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600 text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
