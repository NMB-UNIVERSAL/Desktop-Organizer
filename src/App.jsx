import React, { useState, useEffect } from "react";
import TodoWidget from "./widgets/TodoWidget";
import CalendarWidget from "./widgets/CalendarWidget";
import NotesWidget from "./widgets/NotesWidget";
import TimerWidget from "./widgets/TimerWidget";
import { Plus, Calendar, CheckSquare, StickyNote, Timer } from "lucide-react";

const App = () => {
  const [widgetInfo, setWidgetInfo] = useState({ type: null, id: null });
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);

  useEffect(() => {
    console.log("App component mounted");
    console.log("Current URL:", window.location.href);

    // Get widget info from Electron or URL params
    if (window.electronAPI) {
      console.log("Using Electron API");
      window.electronAPI.getWidgetInfo().then((info) => {
        console.log("Widget info from Electron:", info);
        setWidgetInfo(info);
      });
    } else {
      console.log("Using URL params fallback");
      const urlParams = new URLSearchParams(window.location.search);
      const info = {
        type: urlParams.get("type"),
        id: urlParams.get("id"),
      };
      console.log("Widget info from URL:", info);
      setWidgetInfo(info);
    }
  }, []);

  const createWidget = async (type) => {
    console.log("Creating widget of type:", type);
    console.log("window.electronAPI available?", !!window.electronAPI);
    console.log(
      "window.electronAPI methods:",
      window.electronAPI ? Object.keys(window.electronAPI) : "none"
    );

    if (window.electronAPI) {
      console.log("Electron API is available");
      try {
        const widgetOptions = {
          width:
            type === "todo"
              ? 350
              : type === "calendar"
              ? 600
              : type === "timer"
              ? 550
              : type === "notes"
              ? 320
              : 300,
          height:
            type === "todo"
              ? 500
              : type === "calendar"
              ? 700
              : type === "timer"
              ? 400
              : type === "notes"
              ? 400
              : 400,
        };
        console.log(
          "Calling electronAPI.createWidget with:",
          type,
          widgetOptions
        );
        console.log(
          "electronAPI.createWidget is type:",
          typeof window.electronAPI.createWidget
        );

        const result = await window.electronAPI.createWidget(
          type,
          widgetOptions
        );
        console.log("Widget created with ID:", result);
        setShowWidgetMenu(false); // Close dropdown after creating widget
      } catch (error) {
        console.error("Failed to create widget:", error);
        console.error("Error details:", error.message);
      }
    } else {
      console.error("Electron API is not available");
      alert(
        "Electron API is not available. Make sure you are running in Electron."
      );
    }
  };

  const widgetTypes = [
    { type: "todo", label: "Todo List", icon: CheckSquare, color: "blue" },
    { type: "calendar", label: "Calendar", icon: Calendar, color: "purple" },
  ];

  // If this is a specific widget type, render it
  if (widgetInfo.type === "todo") {
    console.log("Rendering todo widget with ID:", widgetInfo.id);
    if (!widgetInfo.id) {
      console.error("No widget ID provided!");
    }
    return (
      <div className="widget-container h-full">
        <TodoWidget widgetId={widgetInfo.id} />
      </div>
    );
  }

  if (widgetInfo.type === "calendar") {
    console.log("Rendering calendar widget with ID:", widgetInfo.id);
    return (
      <div className="widget-container h-full">
        <CalendarWidget widgetId={widgetInfo.id} />
      </div>
    );
  }

  if (widgetInfo.type === "notes") {
    console.log("Rendering notes widget with ID:", widgetInfo.id);
    return (
      <div className="widget-container h-full">
        <NotesWidget widgetId={widgetInfo.id} />
      </div>
    );
  }

  if (widgetInfo.type === "timer") {
    console.log("Rendering timer widget with ID:", widgetInfo.id);
    return (
      <div className="widget-container h-full">
        <TimerWidget widgetId={widgetInfo.id} />
      </div>
    );
  }

  // Default: render just the widget manager (header only)
  return (
    <div className="widget-container">
      <div className="drag-handle p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Title */}
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
            </div>
            <h1 className="text-[white] font-medium text-sm">
              Desktop Tracker
            </h1>
          </div>

          {/* Right side - Close and Widget Menu */}
          <div
            className="flex items-center gap-2 no-drag"
            style={{ WebkitAppRegion: "no-drag" }}
          >
            <button
              onClick={() =>
                window.electronAPI && window.electronAPI.closeApp()
              }
              className="px-2 py-1 text-sm rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white border border-slate-500/30"
              title="Close App"
              aria-label="Close App"
            >
              ×
            </button>
            <div className="relative">
              {/* Menu Trigger Button */}
              <button
                onClick={() => setShowWidgetMenu(!showWidgetMenu)}
                className="flex items-center px-3 py-2 space-x-2
                           bg-slate-700/50 hover:bg-slate-600/50
                           rounded-lg transition-all duration-200
                           text-white border border-slate-500/30"
              >
                <Plus
                  size={16}
                  className={`transform transition-transform duration-200 ${
                    showWidgetMenu ? "rotate-45" : ""
                  }`}
                />
                <span className="text-sm font-medium">Add Widget</span>
              </button>

              {/* Dropdown Menu */}
              {showWidgetMenu && (
                <div
                  className="absolute right-0 min-w-[100px] 
                               bg-slate-800 border border-slate-600 
                               rounded-lg shadow-2xl z-50 overflow-hidden"
                >
                  {/* Todo Widget Button */}
                  <div className="p-1">
                    <button
                      onClick={() => {
                        createWidget("todo");
                        setShowWidgetMenu(false);
                      }}
                      className="flex-1 block w-full text-left rounded-lg
                                 hover:bg-blue-500/20 active:bg-blue-600/20
                                 transition-colors duration-150"
                    >
                      <div className="flex items-center p-2">
                        <div className="bg-slate-700/50 text-blue-400 p-2 rounded-lg">
                          <CheckSquare size={18} />
                        </div>
                        <span className="ml-3 font-medium text-white">
                          Todo List
                        </span>
                      </div>
                    </button>

                    {/* Calendar Widget Button */}
                    <button
                      onClick={() => {
                        createWidget("calendar");
                        setShowWidgetMenu(false);
                      }}
                      className="block w-full text-left rounded-lg
                                 hover:bg-purple-500/20 active:bg-purple-600/20
                                 transition-colors duration-150 mt-1"
                    >
                      <div className="flex items-center p-2">
                        <div className="bg-slate-700/50 text-purple-400 p-2 rounded-lg">
                          <Calendar size={18} />
                        </div>
                        <span className="ml-3 font-medium text-white">
                          Calendar
                        </span>
                      </div>
                    </button>

                    {/* Notes Widget Button */}
                    <button
                      onClick={() => {
                        createWidget("notes");
                        setShowWidgetMenu(false);
                      }}
                      className="block w-full text-left rounded-lg
                                 hover:bg-emerald-500/20 active:bg-emerald-600/20
                                 transition-colors duration-150 mt-1"
                    >
                      <div className="flex items-center p-2">
                        <div className="bg-slate-700/50 text-emerald-400 p-2 rounded-lg">
                          <StickyNote size={18} />
                        </div>
                        <span className="ml-3 font-medium text-white">
                          Quick Notes
                        </span>
                      </div>
                    </button>

                    {/* Timer Widget Button */}
                    <button
                      onClick={() => {
                        createWidget("timer");
                        setShowWidgetMenu(false);
                      }}
                      className="block w-full text-left rounded-lg
                                 hover:bg-orange-500/20 active:bg-orange-600/20
                                 transition-colors duration-150 mt-1"
                    >
                      <div className="flex items-center p-2">
                        <div className="bg-slate-700/50 text-orange-400 p-2 rounded-lg">
                          <Timer size={18} />
                        </div>
                        <span className="ml-3 font-medium text-white">
                          Timer
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;
