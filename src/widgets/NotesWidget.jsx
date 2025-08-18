import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";

const NotesWidget = ({ widgetId }) => {
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState(""); // For save indicator
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load notes from unified storage on mount
  useEffect(() => {
    setHasLoaded(false);
    if (!widgetId || !window.electronAPI) return;
    async function loadNotes() {
      try {
        const result = await window.electronAPI.loadData(`notes-${widgetId}`);
        if (result.success && typeof result.data === "string") {
          setNotes(result.data);
        } else {
          setNotes("");
        }
      } catch (e) {
        // ignore load errors, start empty
      } finally {
        setHasLoaded(true);
      }
    }
    loadNotes();
  }, [widgetId]);

  // Save notes with debounce
  useEffect(() => {
    if (!hasLoaded || !widgetId || !window.electronAPI) return;
    const timeoutId = setTimeout(async () => {
      try {
        const result = await window.electronAPI.saveData(
          `notes-${widgetId}`,
          notes
        );
        if (result.success) {
          setSaveStatus("Saved");
        } else {
          setSaveStatus("Error saving");
        }
      } catch (e) {
        setSaveStatus("Error saving");
      } finally {
        setTimeout(() => setSaveStatus(""), 1500);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [notes, widgetId, hasLoaded]);

  return (
    <div className="h-full flex flex-col">
      {/* Drag handle header */}
      <div className="drag-handle p-3 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
            </div>
            <h2 className="text-[white] font-medium text-sm">Quick Notes</h2>
          </div>
          <button
            onClick={() =>
              window.electronAPI && window.electronAPI.closeWidget(widgetId)
            }
            className="no-drag p-1.5 rounded hover:bg-slate-700/50 text-slate-300"
            style={{ WebkitAppRegion: "no-drag" }}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
          {saveStatus && (
            <div className="flex items-center text-xs text-emerald-400 space-x-1">
              <Save size={12} />
              <span>{saveStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes content */}
      <div className="flex-1 p-4 no-drag">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Type your notes here..."
          className="w-full h-full bg-transparent text-[white] placeholder-slate-400 
                     resize-none focus:outline-none text-sm leading-relaxed"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default NotesWidget;
