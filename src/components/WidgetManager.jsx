import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, X, CheckSquare, Calendar, Clock, Sticky, Grid3X3 } from 'lucide-react';

const WidgetManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const widgetTypes = [
    { id: 'todo', name: 'Todo List', icon: CheckSquare, description: 'Manage your tasks' },
    { id: 'calendar', name: 'Calendar', icon: Calendar, description: 'View your schedule' },
    { id: 'timer', name: 'Timer', icon: Clock, description: 'Track time' },
    { id: 'notes', name: 'Notes', icon: Sticky, description: 'Quick notes' },
  ];

  const createWidget = async (type) => {
    if (window.electronAPI) {
      try {
        const widgetOptions = {
          width: type === 'todo' ? 350 : 300,
          height: type === 'todo' ? 500 : 400,
        };
        await window.electronAPI.createWidget(type, widgetOptions);
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to create widget:', error);
      }
    }
  };

  return (
    <div className="relative">
      {/* Main manager button */}
      <motion.div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 
                     flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 
                     transition-all duration-200 shadow-lg hover:shadow-xl group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={20} />
          </motion.div>
        </motion.button>

        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              className="absolute right-14 top-1/2 transform -translate-y-1/2 
                         bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 
                         px-3 py-2 rounded-lg text-sm text-slate-200 whitespace-nowrap
                         shadow-lg"
            >
              Add Widget
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 
                              border-4 border-transparent border-l-slate-900/95"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Widget selection menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute right-0 top-14 w-64 bg-slate-900/95 backdrop-blur-xl 
                       border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Add Widget</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Widget options */}
            <div className="p-2">
              {widgetTypes.map((widget) => (
                <motion.button
                  key={widget.id}
                  onClick={() => createWidget(widget.id)}
                  className="w-full p-3 rounded-lg text-left hover:bg-slate-800/50 
                             transition-colors group flex items-center space-x-3"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-slate-800/50 
                                  group-hover:bg-slate-700/50 transition-colors">
                    <widget.icon size={16} className="text-slate-400 group-hover:text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-200 font-medium text-sm">{widget.name}</div>
                    <div className="text-slate-400 text-xs truncate">{widget.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700/50 bg-slate-950/50">
              <button
                className="w-full p-2 rounded-lg text-slate-400 hover:text-slate-200 
                           hover:bg-slate-800/50 transition-colors text-sm flex items-center 
                           justify-center space-x-2"
              >
                <Settings size={14} />
                <span>Widget Settings</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WidgetManager;
