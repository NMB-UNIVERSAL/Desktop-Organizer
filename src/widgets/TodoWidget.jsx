import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, Circle } from "lucide-react";

const TodoWidget = ({ widgetId }) => {
  console.log("TodoWidget component loaded with widgetId:", widgetId);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load todos from electron-store on mount
  useEffect(() => {
    setHasLoaded(false);
    if (!widgetId || !window.electronAPI) return;
    console.log("Loading todos for widget:", widgetId);
    async function loadTodos() {
      try {
        const result = await window.electronAPI.loadData(`todos-${widgetId}`);
        if (result.success && result.data) {
          console.log("Loaded todos:", result.data);
          setTodos(result.data);
        } else {
          setTodos([]);
        }
      } catch (e) {
        console.error("Failed to load todos:", e);
      } finally {
        setHasLoaded(true);
      }
    }
    loadTodos();
  }, [widgetId]);

  // Save todos to electron-store whenever todos change
  useEffect(() => {
    if (!hasLoaded || !widgetId || !window.electronAPI) return;
    console.log("Saving todos for widget:", widgetId);
    async function saveTodos() {
      try {
        const result = await window.electronAPI.saveData(
          `todos-${widgetId}`,
          todos
        );
        if (!result.success) {
          console.error("Failed to save todos:", result.error);
        }
      } catch (e) {
        console.error("Error while saving todos:", e);
      }
    }
    saveTodos();
  }, [todos, widgetId, hasLoaded]);

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTodos([todo, ...todos]);
      setNewTodo("");
    }
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

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
            <h2 className="text-[white] font-medium text-sm">Todo List</h2>
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

      {/* Content area */}
      <div className="no-drag p-4 flex-1 flex flex-col">
        {/* Add todo input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add new task..."
            className="flex-1 px-3 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-lg text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-colors"
          />
          <button
            onClick={addTodo}
            className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm border border-blue-400/30 rounded-lg transition-colors text-blue-300 hover:text-blue-200"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Todo list */}
        <div className="flex-1 space-y-1.5 overflow-y-auto">
          <AnimatePresence>
            {todos.map((todo) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`flex items-center text-[white] gap-3 p-3 bg-slate-800/30 backdrop-blur-sm border border-slate-600/20 rounded-lg group hover:bg-slate-700/30 transition-colors ${
                  todo.completed ? "opacity-60" : ""
                }`}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className="flex-shrink-0 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {todo.completed ? <Check size={18} /> : <Circle size={18} />}
                </button>

                <span
                  className={`flex-1 text-sm text-white ${
                    todo.completed ? "line-through text-slate-300" : ""
                  }`}
                >
                  {todo.text}
                </span>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="flex-shrink-0 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {todos.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm text-[white]">
                No tasks yet. Add one above!
              </p>
            </div>
          )}
        </div>

        {/* Stats footer */}
        {todos.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-700/30">
            <div className="flex justify-between text-xs text-[white]">
              <span>{todos.filter((t) => !t.completed).length} pending</span>
              <span>{todos.filter((t) => t.completed).length} completed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoWidget;
