"use client";
import { useState, useEffect } from 'react';
import { use } from 'react';
import { Task, Resource, Project } from '@/models/models';
import { analyzeProject } from '@/services/geneticAlgorithmService';
import { fetchProjectById, updateTaskInFirebase } from '@/services/firebaseService';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AnalysisPage({ params }: { params: Promise<{ projectId: string }> }) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const projectData = await fetchProjectById(resolvedParams.projectId);
        setProject(projectData);
        
        if (!projectData.tasks.length || !projectData.resources.length) {
          throw new Error('Project must have both tasks and resources for analysis');
        }

        setAnalyzing(true);
        const results = await analyzeProject(projectData.tasks, projectData.resources);
        setSolutions(results);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setAnalyzing(false);
      }
    };

    loadData();
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
        const newSchedule = solution.schedule.find((s: any) => s.taskId === task.id);
        if (!newSchedule) return;

        // Update task with new schedule data
        return updateTaskInFirebase(project.id!, task.id, {
          assignedTo: newSchedule.assignedResource,
          startDate: new Date(newSchedule.startDate).toISOString(),
          endDate: new Date(newSchedule.endDate).toISOString(),
          status: "To Do",
          deadline: new Date(newSchedule.endDate).toISOString(), 
          storyPoints: task.storyPoints, 
          text: task.text, 
          description: task.description
        });
      });

      await Promise.all(updates.filter(Boolean));
      router.push(`/`);
    } catch (error: any) {
      setError('Failed to apply solution: ' + error.message);
    } finally {
      setApplying(false);
    }
  };

  // Calculate story points statistics
  const calculateStoryPointsStats = (tasks: Task[]) => {
    if (!tasks.length) {
      return {
        totalPoints: 0,
        avgPointsPerTask: 0,
        avgPointsPerResource: 0,
        maxPointsPerResource: 0,
        minPointsPerResource: 0,
        pointsDistribution: {}
      };
    }

    const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const avgPointsPerTask = totalPoints / tasks.length;
    const resourcePoints: { [key: string]: number } = {};
    
    tasks.forEach(task => {
      if (task.assignedTo) {
        if (!resourcePoints[task.assignedTo]) {
          resourcePoints[task.assignedTo] = 0;
        }
        resourcePoints[task.assignedTo] += task.storyPoints || 0;
      }
    });

    const resourceCount = Object.keys(resourcePoints).length;
    const avgPointsPerResource = resourceCount > 0 
      ? Object.values(resourcePoints).reduce((sum, points) => sum + points, 0) / resourceCount 
      : 0;
    
    const pointValues = Object.values(resourcePoints);
    const maxPointsPerResource = pointValues.length > 0 ? Math.max(...pointValues) : 0;
    const minPointsPerResource = pointValues.length > 0 ? Math.min(...pointValues) : 0;

    return {
      totalPoints,
      avgPointsPerTask,
      avgPointsPerResource,
      maxPointsPerResource,
      minPointsPerResource,
      pointsDistribution: resourcePoints
    };
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Task Analysis</h1>
            {project && (
              <p className="text-gray-600 mt-2">Project: {project.title}</p>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded text-white hover:bg-primary-dark transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Project
          </button>
        </div>

        {analyzing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">Analyzing tasks...</p>
          </div>
        ) : applying ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">Applying selected solution...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-500 p-4 bg-red-50 rounded-lg">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {project && project.tasks.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-semibold mb-4">Story Points Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    const stats = calculateStoryPointsStats(project.tasks);
                    return (
                      <>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Total Story Points</p>
                          <p className="text-2xl font-bold text-primary">
                            {stats.totalPoints || 0}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Average Points per Task</p>
                          <p className="text-2xl font-bold text-primary">
                            {stats.avgPointsPerTask ? stats.avgPointsPerTask.toFixed(1) : '0.0'}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Average Points per Resource</p>
                          <p className="text-2xl font-bold text-primary">
                            {stats.avgPointsPerResource ? stats.avgPointsPerResource.toFixed(1) : '0.0'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {solutions.map((solution, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-6 bg-gray-50 relative ${
                    selectedSolution === index ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-primary">
                      Solution {index + 1}
                    </h3>
                    <button
                      onClick={() => selectedSolution === index ? applySelectedSolution(index) : setSelectedSolution(index)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        selectedSolution === index
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-primary text-white hover:bg-primary-dark'
                      }`}
                    >
                      {selectedSolution === index ? (
                        <>
                          <Check size={16} />
                          Apply Solution
                        </>
                      ) : (
                        'Select'
                      )}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h4 className="text-sm font-medium text-gray-500">Resource Utilization</h4>
                      <p className="text-2xl font-bold text-primary">
                        {solution.metrics.resourceUtilization.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h4 className="text-sm font-medium text-gray-500">Deadline Meeting Rate</h4>
                      <p className="text-2xl font-bold text-primary">
                        {solution.metrics.deadlineMeetingRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h4 className="text-sm font-medium text-gray-500">Workload Balance</h4>
                      <p className="text-2xl font-bold text-primary">
                        {solution.metrics.workloadBalance.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 mb-2">Task Schedule</h4>
                    <div className="max-h-96 overflow-y-auto">
                      {solution.schedule.map((schedule: any) => {
                        const task = project?.tasks.find(t => t.id === schedule.taskId);
                        const resource = project?.resources.find(r => r.id === schedule.assignedResource);

                        return (
                          <div
                            key={`solution-${index}-task-${schedule.taskId}-${new Date(schedule.startDate).getTime()}`}
                            className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-lg shadow mb-2"
                          >
                            <div className="mb-2 md:mb-0">
                              <h4 className="font-medium">{task?.text || 'Unnamed Task'}</h4>
                              <p className="text-sm text-gray-600">
                                {task?.description} ({task?.storyPoints || 0} story points)
                              </p>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                <span className="text-sm">{resource?.name || 'Unassigned'}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : 'N/A'} - 
                                {schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 