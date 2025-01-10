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

  const getPriorityColor = (priority: TaskPriority) => {
    switch(priority) {
      case 'Low':
        return 'bg-green-100';
      case 'Medium':
        return 'bg-yellow-100';
      case 'High':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="task-table-container">
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`${getSectionColor(sectionType)}`}>
              <tr>
                <th scope="col" className="task-cell">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th scope="col" className="task-cell text-left font-medium text-gray-500">
                  Title
                </th>
                <th scope="col" className="task-cell text-left font-medium text-gray-500">
                  Priority
                </th>
                <th scope="col" className="task-cell text-left font-medium text-gray-500">
                  Due Date
                </th>
                <th scope="col" className="task-cell text-left font-medium text-gray-500">
                  Category
                </th>
                <th scope="col" className="task-cell text-right font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id} className="task-row">
                  <td className="task-cell">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={(e) => onTaskSelect(task.id, e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="task-cell">
                    <div className="text-truncate max-w-xs">{task.title}</div>
                  </td>
                  <td className="task-cell">
                    <span className={`status-badge ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="task-cell text-gray-500">
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </td>
                  <td className="task-cell">
                    <span className="status-badge bg-gray-100 text-gray-800">
                      {task.category}
                    </span>
                  </td>
                  <td className="task-cell text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(task)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(task.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
  const [searchQuery, setSearchQuery] = useState('');
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
    userId: user?.uid || '', // Make sure this is set correctly
    attachment: null as File | null
  });

  useEffect(() => {
    if (user) {
      console.log('Current user UID:', user.uid);
      setNewTask(prev => ({
        ...prev,
        userId: user.uid,
        createdBy: user.uid
      }));
    }
  }, [user]);

  const {
    tasks,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    cleanup
  } = useTaskStore();

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
    <div className="max-w-full overflow-x-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 p-4">
        <div className="flex items-center space-x-4 flex-wrap gap-2">
          <button
            onClick={() => setShowAddTaskForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
          >
            Add Task
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-sm sm:text-base ${
                viewMode === 'list'
                  ? 'bg-gray-200 text-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-lg text-sm sm:text-base ${
                viewMode === 'board'
                  ? 'bg-gray-200 text-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Board View
            </button>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
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
        <div className="space-y-6 p-2 sm:p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
          {selectedTasks.size > 0 && (
            <div className="mb-4 p-3 bg-white rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between gap-2 border border-gray-200">
              <span className="text-gray-700 font-medium text-sm sm:text-base">
                {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm sm:text-base"
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
