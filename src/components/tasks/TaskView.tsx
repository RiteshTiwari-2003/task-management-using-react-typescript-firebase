import { useState, useEffect, useCallback, memo } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../../types/task';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { BoardView } from './BoardView';
import { DropResult } from '@hello-pangea/dnd';
import { TaskEditModal } from './TaskEditModal';

// Task table component
const TaskTable = memo(({ 
  tasks, 
  onEdit, 
  onDelete,
  selectedTasks,
  onTaskSelect,
  onSelectAll,
  sectionType
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  selectedTasks: Set<string>;
  onTaskSelect: (taskId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  sectionType: 'Todo' | 'In-Progress' | 'Completed';
}) => {
  const allSelected = tasks.length > 0 && tasks.every(task => selectedTasks.has(task.id));

  const getSectionColor = (type: string) => {
    switch(type) {
      case 'Todo':
        return 'bg-blue-50';
      case 'In-Progress':
        return 'bg-yellow-50';
      case 'Completed':
        return 'bg-green-50';
      default:
        return 'bg-white';
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="min-w-full">
        <thead>
          <tr className={`${getSectionColor(sectionType)} border-b border-gray-200`}>
            <th className="w-10 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="w-2/5 px-4 py-3 text-left font-semibold text-gray-700">Task Name</th>
            <th className="w-1/5 px-4 py-3 text-left font-semibold text-gray-700">Due Date</th>
            <th className="w-1/5 px-4 py-3 text-left font-semibold text-gray-700">Category</th>
            <th className="w-1/5 px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className={getSectionColor(sectionType)}>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedTasks.has(task.id)}
                  onChange={(e) => onTaskSelect(task.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td className="px-4 py-3 text-gray-800">{task.title}</td>
              <td className="px-4 py-3 text-gray-600">{format(new Date(task.dueDate), 'MMM dd, yyyy')}</td>
              <td className="px-4 py-3 text-gray-600">{task.category}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onEdit(task)}
                  className="text-blue-600 hover:text-blue-800 mr-3 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export const TaskView = () => {
  type SectionKey = 'Todo' | 'In-Progress' | 'Completed';
  interface ExpandedSections {
    Todo: boolean;
    'In-Progress': boolean;
    Completed: boolean;
  }

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    Todo: true,
    'In-Progress': true,
    Completed: true
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const user = useAuthStore((state) => state.user);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    category: 'Work' as TaskCategory,
    status: 'Todo' as SectionKey,
    priority: 'Medium' as TaskPriority,
    activities: [],
    createdBy: user?.uid || '',
    userId: user?.uid || '',
    attachment: null as File | null
  });

  const {
    tasks,
    loading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    cleanup
  } = useTaskStore();

  const searchQuery = useTaskStore((state) => state.searchQuery);

  const filteredTasks = tasks.filter((task) => 
    searchQuery
      ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true
  );

  useEffect(() => {
    if (user?.uid) {
      fetchTasks(user.uid);
    }
    return () => cleanup();
  }, [user?.uid, fetchTasks, cleanup]);

  const handleAddTask = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addTask({
        ...newTask,
        userId: user.uid,
        createdBy: user.uid
      });
      setShowAddTaskForm(false);
      setNewTask({
        title: '',
        description: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        category: 'Work' as TaskCategory,
        status: 'Todo' as SectionKey,
        priority: 'Medium' as TaskPriority,
        activities: [],
        createdBy: user.uid,
        userId: user.uid,
        attachment: null
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }, [newTask, user, addTask]);

  const handleDelete = useCallback((taskId: string) => {
    deleteTask(taskId);
  }, [deleteTask]);

  const handleTaskMove = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;
    const task = tasks.find(t => t.id === taskId);

    if (task) {
      updateTask(task.id, {
        ...task,
        status: newStatus
      });
    }
  }, [tasks, updateTask]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleSaveEdit = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTask(taskId, updates);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleCloseEdit = () => {
    setEditingTask(null);
  };

  const toggleSection = useCallback((section: SectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleBulkDelete = async () => {
    const tasksToDelete = Array.from(selectedTasks);
    for (const taskId of tasksToDelete) {
      await handleDelete(taskId);
    }
    setSelectedTasks(new Set());
  };

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  const todoTasks = filteredTasks.filter(task => task.status === 'Todo');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'In-Progress');
  const completedTasks = filteredTasks.filter(task => task.status === 'Completed');

  return (
    <div className="container mx-auto p-4">
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-200">
          <div className="h-full bg-blue-600 animate-loading-bar"></div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded ${
              viewMode === 'list'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`px-4 py-2 rounded ${
              viewMode === 'board'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Board
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <select
              className="border rounded px-2 py-1"
              onChange={(e) => console.log('Category filter:', e.target.value)}
            >
              <option value="">Category</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
            </select>
            <input
              type="date"
              className="border rounded px-2 py-1"
              onChange={(e) => console.log('Due date filter:', e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddTaskForm(!showAddTaskForm)}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Add Task
          </button>
        </div>
      </div>
      
      {showAddTaskForm && (
        <form onSubmit={handleAddTask} className="mt-4 bg-white p-4 rounded-lg shadow mb-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Task Name
            </label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              value={newTask.description}
              onChange={(e) => {
                if (e.target.value.length <= 300) {
                  setNewTask({ ...newTask, description: e.target.value })
                }
              }}
              maxLength={300}
              rows={4}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter task description (max 300 characters)"
            />
            <p className="text-sm text-gray-500 mt-1">
              {newTask.description.length}/300 characters
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Task Status
            </label>
            <select
              value={newTask.status}
              onChange={(e) => setNewTask({ ...newTask, status: e.target.value as SectionKey })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="Todo">Todo</option>
              <option value="In-Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Task Category
            </label>
            <select
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value as TaskCategory })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Attachment
            </label>
            <input
              type="file"
              onChange={(e) => setNewTask({ ...newTask, attachment: e.target.files?.[0] || null })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddTaskForm(false)}
              className="mr-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onSave={handleSaveEdit}
          onClose={handleCloseEdit}
        />
      )}

      {viewMode === 'list' ? (
        <div className="space-y-6 p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
          {selectedTasks.size > 0 && (
            <div className="mb-4 p-3 bg-white rounded-lg shadow-md flex items-center justify-between border border-gray-200">
              <span className="text-gray-700 font-medium">
                {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Selected ({selectedTasks.size})
              </button>
            </div>
          )}
          <div className="space-y-6">
            {/* Todo Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div
                className="p-4 flex justify-between items-center cursor-pointer bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 transition-colors"
                onClick={() => toggleSection('Todo')}
              >
                <h2 className="text-xl font-semibold text-gray-800">Todo</h2>
                {expandedSections.Todo ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                )}
              </div>
              {expandedSections.Todo && (
                <div className="border-t border-gray-200">
                  <TaskTable
                    tasks={todoTasks}
                    onEdit={handleEditTask}
                    onDelete={handleDelete}
                    selectedTasks={selectedTasks}
                    onTaskSelect={handleTaskSelect}
                    onSelectAll={handleSelectAll}
                    sectionType="Todo"
                  />
                </div>
              )}
            </div>

            {/* In Progress Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div
                className="p-4 flex justify-between items-center cursor-pointer bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-150 transition-colors"
                onClick={() => toggleSection('In-Progress')}
              >
                <h2 className="text-xl font-semibold text-gray-800">In Progress</h2>
                {expandedSections['In-Progress'] ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                )}
              </div>
              {expandedSections['In-Progress'] && (
                <div className="border-t border-gray-200">
                  <TaskTable
                    tasks={inProgressTasks}
                    onEdit={handleEditTask}
                    onDelete={handleDelete}
                    selectedTasks={selectedTasks}
                    onTaskSelect={handleTaskSelect}
                    onSelectAll={handleSelectAll}
                    sectionType="In-Progress"
                  />
                </div>
              )}
            </div>

            {/* Completed Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div
                className="p-4 flex justify-between items-center cursor-pointer bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-150 transition-colors"
                onClick={() => toggleSection('Completed')}
              >
                <h2 className="text-xl font-semibold text-gray-800">Completed</h2>
                {expandedSections.Completed ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                )}
              </div>
              {expandedSections.Completed && (
                <div className="border-t border-gray-200">
                  <TaskTable
                    tasks={completedTasks}
                    onEdit={handleEditTask}
                    onDelete={handleDelete}
                    selectedTasks={selectedTasks}
                    onTaskSelect={handleTaskSelect}
                    onSelectAll={handleSelectAll}
                    sectionType="Completed"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <BoardView
          tasks={filteredTasks}
          onTaskMove={handleTaskMove}
          onTaskEdit={(taskId) => {
            const task = filteredTasks.find(t => t.id === taskId);
            if (task) handleEditTask(task);
          }}
          onTaskDelete={handleDelete}
        />
      )}
    </div>
  );
};
