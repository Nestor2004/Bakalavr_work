import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Task, Resource } from "@/models/models";
import TaskForm from "@/components/TaskForm";
import TaskInformation from "./TaskInformation";
import { 
  updateTaskStatusInFirebase, 
  addTaskToFirebase,
  fetchProjectTasks,
  deleteTaskFromFirebase,
  updateTaskInFirebase
} from "@/services/firebaseService";
import { useRouter } from 'next/navigation';

type TaskStatus = 'todo' | 'inProgress' | 'readyToTest' | 'done';

interface TaskBoardProps {
  projectId: string;
  tasks: Task[];
  resources: Resource[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export default function TaskBoard({ projectId, tasks: initialTasks, resources, onStatusChange }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const projectTasks = await fetchProjectTasks(projectId);
        setTasks(projectTasks as Task[]);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadTasks();
    }
  }, [projectId]);

  useEffect(() => {
    if (Array.isArray(initialTasks)) {
      setTasks(initialTasks);
    }
  }, [initialTasks]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const {  destination } = result;
    const newStatus = destination.droppableId as TaskStatus;

    const updatedTasks = tasks.map(task => {
      if (task.id === result.draggableId) {
        return { ...task, status: newStatus };
      }
      return task;
    });

    setTasks(updatedTasks);
    await updateTaskStatusInFirebase(projectId, result.draggableId, newStatus);
    onStatusChange(result.draggableId, newStatus);
  };

  const handleAddTask = async (taskData: Omit<Task, 'id'>) => {
    if (!projectId) return;

    try {
      const taskId = await addTaskToFirebase(projectId, taskData);
      setTasks(prevTasks => [...prevTasks, { ...taskData, id: taskId }]);
      setIsModalOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskFromFirebase(projectId, taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const getResourceName = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.name : 'Unassigned';
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

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-6 mt-4">
          {(['todo', 'inProgress', 'readyToTest', 'done'] as const).map((status) => (
            <div key={status} className="flex-1">
              <h3 className="text-lg font-semibold mb-2 capitalize">{status}</h3>
              <Droppable droppableId={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-100 p-4 rounded-lg min-h-[200px]"
                  >
                    {getTasksByStatus(status).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-3 mb-2 rounded shadow cursor-move"
                            onClick={() => {
                              setSelectedTask(task);
                              setIsModalOpen(true);
                            }}
                          >
                            <h4 className="font-medium">{task.text}</h4>
                            <p className="text-sm text-gray-600">
                              Assigned to: {getResourceName(task.assignedTo)}
                            </p>
                            {task.storyPoints && (
                              <p className="text-sm text-gray-600">
                                Story Points: {task.storyPoints}
                              </p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
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
