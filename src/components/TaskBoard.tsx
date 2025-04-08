import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Task, Resource } from "@/models/models";
import TaskForm from "@/components/TaskForm";
import TaskInformation from "./TaskInformation";
import { Clock, DollarSign, Hash } from "lucide-react";
import { 
  updateTaskStatusInFirebase, 
  addTaskToFirebase,
  fetchProjectTasks,
  deleteTaskFromFirebase,
  updateTaskInFirebase
} from "@/services/firebaseService";
import { useRouter } from 'next/navigation';

const statuses = ["To Do", "In Progress", "Ready to test", "Done"];

export default function TasksBoard({
  projectId,
  resources,
}: {
  projectId: string;
  resources: Resource[];
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const projectTasks = await fetchProjectTasks(projectId);
        setTasks(projectTasks);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadTasks();
    }
  }, [projectId]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !projectId) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    try {
      await updateTaskStatusInFirebase(projectId, draggableId, destination.droppableId);
      
      // Оновлюємо локальний стан
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === draggableId 
            ? { ...task, status: destination.droppableId }
            : task
        )
      );
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleAddTask = async (taskData: Omit<Task, 'id'>) => {
    if (!projectId) return;

    try {
      const taskId = await addTaskToFirebase(projectId, taskData);
      setTasks(prevTasks => [...prevTasks, { ...taskData, id: taskId }]);
      setIsModalOpen(false);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskFromFirebase(projectId, taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpdateTask = async (taskId: string, taskData: Partial<Task>) => {
    try {
      await updateTaskInFirebase(projectId, taskId, taskData);
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, ...taskData } : task
        )
      );
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex gap-4 mt-4">
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Add Task
        </button>
        
        <button 
          onClick={() => router.push(`/analysis/${projectId}`)}
          className="px-4 py-2 bg-primary text-white rounded flex items-center gap-2"
        >
          <span>Analyze Tasks</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="text-red-500 mt-4">
          {error}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-6 mt-4">
          {statuses.map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-surface rounded-xl p-4 min-h-[500px]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-text-primary">{status}</h2>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-full">
                      {tasks.filter(t => t.status === status).length}
                    </span>
                  </div>

                  {tasks
                    .filter((task) => task.status === status)
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mb-2 cursor-pointer"
                            onClick={() => setSelectedTask(task)}
                          >
                            <h3 className="font-semibold mb-2 text-text-primary">
                              {task.text}
                            </h3>
                            <div className="flex justify-between text-sm text-text-secondary">
                              <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>
                                  {new Date(task.deadline).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Hash size={14} />
                                <span>{task.storyPoints} points</span>
                              </div>
                            </div>
                            {resources.find(r => r.id === task.assignedTo) && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center text-white text-sm">
                                  {resources.find(r => r.id === task.assignedTo)?.name[0]}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      
      {isModalOpen && (
        <TaskForm 
          handleAddTask={handleAddTask} 
          resources={resources} 
          setIsOpen={setIsModalOpen}
        />
      )}
      
      {selectedTask && (
        <TaskInformation
          task={selectedTask}
          setIsOpen={() => setSelectedTask(null)}
          resources={resources}
          onDelete={handleDeleteTask}
          onUpdate={handleUpdateTask}
        />
      )}

    </div>
  );
}
