import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Timer as TimerIcon,
  StopCircle,
} from "lucide-react";

const TimerWidget = ({ widgetId }) => {
  const [mode, setMode] = useState("timer"); // "timer" or "stopwatch"
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // in seconds
  const [inputHours, setInputHours] = useState("00");
  const [inputMinutes, setInputMinutes] = useState("00");
  const [inputSeconds, setInputSeconds] = useState("00");

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (mode === "timer" && prevTime <= 0) {
            setIsRunning(false);
            return 0;
          }
          return mode === "timer" ? prevTime - 1 : prevTime + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const startTimer = () => {
    if (mode === "timer") {
      const totalSeconds =
        parseInt(inputHours || "0") * 3600 +
        parseInt(inputMinutes || "0") * 60 +
        parseInt(inputSeconds || "0");
      if (totalSeconds > 0) {
        setTime(totalSeconds);
      } else {
        return; // Don't start if no time is set
      }
    } else {
      // Stopwatch mode
      setTime(time); // Keep current time when pausing/resuming
    }
    setIsRunning(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
    if (mode === "timer") {
      setInputHours("00");
      setInputMinutes("00");
      setInputSeconds("00");
    }
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  };

  const formattedTime = formatTime(time);

  const handleInputChange = (value, setter, max) => {
    let processed = value.replace(/\D/g, "").slice(0, 2);
    if (processed === "") {
      setter("00");
    } else {
      // Don't pad with zeros while typing
      if (processed.length === 1 && value.length === 1) {
        setter(processed);
      } else {
        if (parseInt(processed) > max) {
          processed = max.toString();
        }
        setter(processed.padStart(2, "0"));
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-800/50">
      {/* Drag handle header */}
      <div className="drag-handle p-3 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
            </div>
            <h2 className="text-[white] font-medium text-sm">
              {mode === "timer" ? "Timer" : "Stopwatch"}
            </h2>
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
          <button
            onClick={() => {
              resetTimer();
              setMode((m) => (m === "timer" ? "stopwatch" : "timer"));
            }}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-[black] hover:text-slate-300 flex items-center gap-2"
            style={{ WebkitAppRegion: "no-drag" }}
          >
            {mode === "timer" ? (
              <>
                <StopCircle size={14} />
                <span className="text-xs">Switch to Stopwatch</span>
              </>
            ) : (
              <>
                <TimerIcon size={14} />
                <span className="text-xs">Switch to timer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Timer content */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center no-drag">
        {/* Display time */}
        <div className="text-2xl font-mono font-bold text-[white] mb-4">
          {mode === "timer" && !isRunning ? (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={inputHours}
                onChange={(e) =>
                  handleInputChange(e.target.value, setInputHours, 23)
                }
                onClick={(e) => e.target.select()}
                className="w-12 bg-slate-900/30 text-center text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 rounded cursor-text"
                placeholder="00"
              />
              <span>:</span>
              <input
                type="text"
                value={inputMinutes}
                onChange={(e) =>
                  handleInputChange(e.target.value, setInputMinutes, 59)
                }
                onClick={(e) => e.target.select()}
                className="w-12 bg-slate-900/30 text-center text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 rounded cursor-text"
                placeholder="00"
              />
              <span>:</span>
              <input
                type="text"
                value={inputSeconds}
                onChange={(e) =>
                  handleInputChange(e.target.value, setInputSeconds, 59)
                }
                onClick={(e) => e.target.select()}
                className="w-12 bg-slate-900/30 text-center text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 rounded cursor-text"
                placeholder="00"
              />
            </div>
          ) : (
            <div className="font-mono">
              {formattedTime.hours}:{formattedTime.minutes}:
              {formattedTime.seconds}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (isRunning) {
                setIsRunning(false);
              } else {
                startTimer();
              }
            }}
            className={`p-2 rounded-full ${
              isRunning
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
            }`}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={resetTimer}
            className="p-2 rounded-full bg-slate-700/30 text-slate-400 hover:bg-slate-700/50"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerWidget;
