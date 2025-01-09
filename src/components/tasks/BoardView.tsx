import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task } from '../../types/task';
import { format } from 'date-fns';
import { useTaskStore } from '../../store/taskStore';

interface BoardViewProps {
  tasks: Task[];
  onTaskMove: (result: DropResult) => void;
  onTaskEdit: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

export const BoardView = ({ tasks, onTaskMove, onTaskEdit, onTaskDelete }: BoardViewProps) => {
  const categories = ['Todo', 'In-Progress', 'Completed'];
  const searchQuery = useTaskStore((state) => state.searchQuery);

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter((task) => task.status === status)
      .filter((task) => 
        searchQuery 
          ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
          : true
      );
  };

  return (
    <DragDropContext onDragEnd={onTaskMove}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Droppable key={category} droppableId={category}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`bg-white rounded-lg shadow p-4 ${
                  snapshot.isDraggingOver ? 'bg-gray-50' : ''
                }`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${
                  category === 'Todo' ? 'text-purple-600' :
                  category === 'In-Progress' ? 'text-blue-600' :
                  'text-green-600'
                }`}>
                  {category} ({getTasksByStatus(category).length})
                </h3>
                <div className="space-y-3">
                  {getTasksByStatus(category).map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white rounded-md shadow p-4 ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">
                                {task.title}
                              </h4>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => onTaskEdit(task.id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => onTaskDelete(task.id)}
                                  className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              <p>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</p>
                              <p>Category: {task.category}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};
