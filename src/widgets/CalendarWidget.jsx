import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";

const Calendar = ({ widgetId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load events from unified storage (fallback to localStorage in web)
  useEffect(() => {
    setHasLoaded(false);
    async function loadEvents() {
      try {
        if (window.electronAPI && widgetId) {
          const result = await window.electronAPI.loadData(
            `calendar-${widgetId}`
          );
          if (result.success && result.data) {
            setEvents(result.data);
          } else {
            setEvents({});
          }
        } else {
          const saved = localStorage.getItem(
            `calendar-${widgetId || "default"}`
          );
          if (saved) {
            setEvents(JSON.parse(saved));
          } else {
            setEvents({});
          }
        }
      } catch (e) {
        // Silently ignore and start with empty state
        setEvents({});
      } finally {
        setHasLoaded(true);
      }
    }
    loadEvents();
  }, [widgetId]);

  // Persist events to unified storage (fallback to localStorage in web)
  useEffect(() => {
    if (!hasLoaded) return;
    async function saveEvents() {
      try {
        if (window.electronAPI && widgetId) {
          await window.electronAPI.saveData(`calendar-${widgetId}`, events);
        } else {
          localStorage.setItem(
            `calendar-${widgetId || "default"}`,
            JSON.stringify(events)
          );
        }
      } catch (e) {
        // Ignore save errors in UI
      }
    }
    saveEvents();
  }, [events, widgetId, hasLoaded]);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const startingDay = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const changeMonth = (offset) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
    );
  };

  const addEvent = () => {
    if (!selectedDate || !newEventTitle.trim()) return;

    const dateKey = selectedDate.toISOString().split("T")[0];
    const newEvent = {
      id: Date.now(),
      title: newEventTitle.trim(),
      date: dateKey,
    };

    setEvents((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newEvent],
    }));

    setNewEventTitle("");
    setShowEventModal(false);
  };

  const deleteEvent = (dateKey, eventId) => {
    setEvents((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey].filter((event) => event.id !== eventId),
    }));
  };

  const getEventsForDate = (date) => {
    const dateKey = date.toISOString().split("T")[0];
    return events[dateKey] || [];
  };

  return (
    <div
      className="bg-slate-800/50 text-[white] rounded-lg p-3 h-full flex flex-col"
      style={{ minWidth: "360px", minHeight: "540px" }}
    >
      {/* Drag handle header */}
      <div className="drag-handle p-3 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
            </div>
            <h2 className="text-[white] font-medium text-sm">Calendar</h2>
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
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => changeMonth(-1)}
          className="p-1 rounded-full hover:bg-slate-700"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="p-1 rounded-full hover:bg-slate-700"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Days of the week */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-[white] mb-2">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {Array.from({ length: startingDay }).map((_, i) => (
          <div key={`empty-${i}`} className="border border-transparent"></div>
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
          );
          const isToday = new Date().toDateString() === date.toDateString();
          const isSelected =
            selectedDate?.toDateString() === date.toDateString();
          const dateEvents = getEventsForDate(date);
          const hasEvents = dateEvents.length > 0;

          return (
            <div
              key={day}
              onClick={() => setSelectedDate(date)}
              className={`p-1.5 rounded-lg flex flex-col items-center justify-start text-[12px] cursor-pointer hover:bg-slate-700/50 min-h-[3.5rem]
                ${
                  isToday
                    ? "bg-blue-500/20 text-blue-200 ring-2 ring-emerald-400/70"
                    : ""
                }
                ${isSelected ? "ring-2 ring-blue-400" : ""}
                ${hasEvents ? "bg-purple-500/15" : ""}`}
            >
              <span className="mb-1">{day}</span>
              {isToday && (
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
              )}
              {hasEvents && (
                <div className="w-full">
                  {dateEvents
                    .map((event, i) => (
                      <div
                        key={event.id}
                        className="text-[10px] px-1 py-0.5 mb-0.5 rounded bg-purple-500/30 truncate"
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))
                    .slice(0, 2)}
                  {dateEvents.length > 2 && (
                    <div className="text-xs text-purple-300 text-center">
                      +{dateEvents.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Side Panel for Adding/Viewing Events */}
      {selectedDate && (
        <div className="fixed left-full top-1/2 -translate-y-1/2 ml-3 h-[90%] w-72 bg-slate-800/95 rounded-lg border border-slate-700/50 shadow-xl no-drag overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-700/50">
              <div>
                <h3 className="text-lg font-semibold">Events</h3>
                <p className="text-sm text-slate-400">
                  {selectedDate.toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Event List */}
              <div className="space-y-2">
                {getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30"
                  >
                    <span className="text-sm">{event.title}</span>
                    <button
                      onClick={() => deleteEvent(event.date, event.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {getEventsForDate(selectedDate).length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-sm">
                    No events for this date
                  </div>
                )}
              </div>
            </div>

            {/* Add Event Form */}
            <div className="p-3 border-t border-slate-700/50">
              <div className="space-y-2">
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addEvent()}
                  className="w-full px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-600/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  placeholder="Add new event..."
                />
                <button
                  onClick={addEvent}
                  disabled={!newEventTitle.trim()}
                  className="w-full px-3 py-2 text-sm bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
