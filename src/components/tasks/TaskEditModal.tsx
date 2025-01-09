import { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../../types/task';
import { format } from 'date-fns';
import { FaTimes } from 'react-icons/fa';

interface TaskEditModalProps {
  task: Task;
  onSave: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onClose: () => void;
}

export const TaskEditModal = ({ task, onSave, onClose }: TaskEditModalProps) => {
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState(task.category);
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState(task.description || '');
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    try {
      const date = new Date(task.dueDate);
      setDueDate(format(date, 'yyyy-MM-dd'));
    } catch (error) {
      console.error('Error parsing date:', error);
      setDueDate('');
    }
  }, [task.dueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(task.id, {
      title,
      category,
      status,
      description,
      dueDate: format(new Date(dueDate), 'dd MMM, yyyy'),
      attachments: attachment ? [attachment.name] : undefined,
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-3xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">View/Edit Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <div className="border rounded-md">
                <div className="border-b p-2 flex gap-2">
                  <button type="button" className="p-1 hover:bg-gray-100 rounded">B</button>
                  <button type="button" className="p-1 hover:bg-gray-100 rounded italic">I</button>
                  <button type="button" className="p-1 hover:bg-gray-100 rounded">S</button>
                  <button type="button" className="p-1 hover:bg-gray-100 rounded">•</button>
                  <button type="button" className="p-1 hover:bg-gray-100 rounded">1.</button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setDescription(e.target.value);
                    }
                  }}
                  maxLength={300}
                  className="w-full px-3 py-2 focus:ring-purple-500 focus:border-purple-500 border-none"
                  rows={4}
                  placeholder="Enter task description"
                />
                <div className="p-2 text-sm text-gray-500 text-right">
                  {description.length}/300 characters
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Category
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('Work')}
                    className={`flex-1 py-2 px-4 rounded ${
                      category === 'Work'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Work
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('Personal')}
                    className={`flex-1 py-2 px-4 rounded ${
                      category === 'Personal'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Personal
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full border rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="Todo">Todo</option>
                  <option value="In-Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachment
              </label>
              <div className="border-2 border-dashed rounded-md p-4">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Drop your files here to Upload
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity
              </label>
              <div className="space-y-2">
                {task.activities?.map((activity, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    {activity.action} - {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
