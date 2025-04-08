"use client";
import { useState, useEffect } from 'react';
import { use } from 'react';
import { Task, Project} from '@/models/models';
import { analyzeProject } from '@/services/geneticAlgorithmService';
import { fetchProjectById, fetchProjectTasks, updateTaskInFirebase } from '@/services/firebaseService';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface TaskSchedule {
  taskId: string;
  assignedResource: string;
  startDate: Date;
  endDate: Date;
  priority: number;
}

interface Solution {
  schedule: TaskSchedule[];
  metrics: {
    resourceUtilization: number;
    deadlineMeetingRate: number;
    workloadBalance: number;
  };
  fitness: number;
}

export default function AnalysisPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [analyzing, setAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setAnalyzing(true);
        setError(null);
        
        // Fetch project data including resources
        const projectData = await fetchProjectById(resolvedParams.projectId);
        setProject(projectData);
        
        // Fetch project tasks
        const projectTasks = await fetchProjectTasks(resolvedParams.projectId);
        setTasks(projectTasks as Task[]);
        
        // Analyze tasks
        if (projectTasks.length > 0 && projectData.resources.length > 0) {
          const analysisResults = await analyzeProject(projectTasks as Task[], projectData.resources);
          setSolutions(analysisResults);
        } else {
          setError('No tasks or resources available for analysis');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setError(errorMessage);
      } finally {
        setAnalyzing(false);
      }
    };

    loadProjectData();
  }, [resolvedParams.projectId]);

  const applySelectedSolution = async (solutionIndex: number) => {
    if (!project) return;
    
    try {
      setApplying(true);
      setError(null);
      
      const solution = solutions[solutionIndex];
      
      // Update each task with new schedule
      const updates = project.tasks.map(async (task) => {
        // Find the corresponding schedule for this task
        const newSchedule = solution.schedule.find((s: TaskSchedule) => s.taskId === task.id);
        if (!newSchedule) return;

        // Update task with new schedule data
        return updateTaskInFirebase(project.id!, task.id, {
          assignedTo: newSchedule.assignedResource,
          startDate: new Date(newSchedule.startDate).toISOString(),
          endDate: new Date(newSchedule.endDate).toISOString(),
          status: "To Do", // Reset status for the new schedule
          deadline: new Date(newSchedule.endDate).toISOString(), // Update deadline to match the new schedule
          storyPoints: task.storyPoints, // Preserve story points
          text: task.text, // Preserve task name
          description: task.description // Preserve description
        });
      });

      await Promise.all(updates.filter(Boolean));
      router.push(`/projects/${project.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError('Failed to apply solution: ' + errorMessage);
    } finally {
      setApplying(false);
    }
  };

  // Calculate story points statistics
  const calculateStoryPointsStats = () => {
    if (!tasks.length) return { total: 0, average: 0, averagePerResource: 0 };
    
    const total = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const average = total / tasks.length;
    
    // Calculate average per resource
    const resourcePoints: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};
    
    tasks.forEach(task => {
      if (task.assignedTo) {
        resourcePoints[task.assignedTo] = (resourcePoints[task.assignedTo] || 0) + (task.storyPoints || 0);
        resourceCounts[task.assignedTo] = (resourceCounts[task.assignedTo] || 0) + 1;
      }
    });
    
    let totalResourcePoints = 0;
    let totalResourceCount = 0;
    
    Object.keys(resourcePoints).forEach(resourceId => {
      totalResourcePoints += resourcePoints[resourceId];
      totalResourceCount += resourceCounts[resourceId];
    });
    
    const averagePerResource = totalResourceCount > 0 ? totalResourcePoints / totalResourceCount : 0;
    
    return { total, average, averagePerResource };
  };

  const stats = calculateStoryPointsStats();

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold">Task Analysis</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {analyzing ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : solutions.length > 0 ? (
          <div>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Project Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700">Total Story Points</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700">Average Points per Task</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.average.toFixed(1)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700">Average Points per Resource</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.averagePerResource.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Optimization Solutions</h2>
              <p className="text-gray-600 mb-4">
                Below are the top 3 optimized schedules for your project tasks. Select one to apply to your project.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {solutions.map((solution, index) => (
                  <div 
                    key={`solution-${index}`}
                    className={`bg-white rounded-lg shadow-lg overflow-hidden ${selectedSolution === index ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="bg-blue-600 text-white p-4">
                      <h3 className="text-lg font-semibold">Solution {index + 1}</h3>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-blue-200">Resource Usage</p>
                          <p className="font-bold">{solution.metrics.resourceUtilization.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-blue-200">Deadline Meeting</p>
                          <p className="font-bold">{solution.metrics.deadlineMeetingRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-blue-200">Workload Balance</p>
                          <p className="font-bold">{solution.metrics.workloadBalance.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="max-h-96 overflow-y-auto mb-4">
                        <h4 className="font-medium mb-2">Task Schedule</h4>
                        {solution.schedule.map((schedule: TaskSchedule) => {
                          const task = project?.tasks.find(t => t.id === schedule.taskId);
                          const resource = project?.resources.find(r => r.id === schedule.assignedResource);

                          return (
                            <div
                              key={`solution-${index}-task-${schedule.taskId}-${new Date(schedule.startDate).getTime()}`}
                              className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-lg shadow mb-2"
                            >
                              <div>
                                <h5 className="font-medium">{task?.text || 'Unknown Task'}</h5>
                                <p className="text-sm text-gray-500">
                                  Assigned to: {resource?.name || 'Unassigned'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Story Points: {task?.storyPoints || 0}
                                </p>
                              </div>
                              <div className="text-right mt-2 md:mt-0">
                                <p className="text-sm">
                                  {new Date(schedule.startDate).toLocaleDateString()} - {new Date(schedule.endDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={() => setSelectedSolution(index)}
                          className={`px-4 py-2 rounded ${
                            selectedSolution === index
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                        >
                          {selectedSolution === index ? 'Selected' : 'Select'}
                        </button>
                        
                        {selectedSolution === index && (
                          <button
                            onClick={() => applySelectedSolution(index)}
                            disabled={applying}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {applying ? 'Applying...' : 'Apply Solution'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            No solutions available. Make sure you have tasks and resources in your project.
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 