"use client";
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setProjects,
  selectProject,
  startAddProject,
  cancelAddProject,
  addProject,
  deleteProject,
} from '@/store/slices/projectSlice';
import Layout from '@/components/Layout/Layout';
import NewProject from '@/components/NewProject';
import NoProjectSelected from '@/components/NoProjectSelected';
import SelectedProject from '@/components/SelectedProject';
import { fetchProjects, createProject, deleteProject as deleteProjectFromFirebase } from '@/services/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Project } from '@/models/models';
import { RootState } from '@/store/store';
export default function Page() {
  const dispatch = useDispatch();
  const { selectedProjectId, projects } = useSelector((state: RootState) => state.projects);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const loadedProjects: Project[] = await fetchProjects();
        const serializedProjects = loadedProjects.map(project => ({
          ...project,
          createdAt: project.createdAt,
          dueDate: project.dueDate,
          title: project.title,
          description: project.description,
          budget: project.budget,
          currency: project.currency,
          resources: project.resources || [],
          tasks: project.tasks || [],
          creatorId: project.creatorId,
          creatorEmail: project.creatorEmail,
          sharedWith: project.sharedWith || [],
          isCreator: project.isCreator
        }));
        dispatch(setProjects(serializedProjects));
      } catch (error: unknown) {
        console.error('Error loading projects:', error);
        const errorMessage = error instanceof Error ? error.message : "";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [dispatch, user]);

  const handleAddProject = async (projectData: Omit<Project, 'id'>) => {
    try {
      setError(null);
      const projectId = await createProject(projectData);
      const newProject: Project = {
        ...projectData,
        id: projectId,
        createdAt: new Date().toISOString(),
        isCreator: true
      };
      dispatch(addProject(newProject));
      dispatch(selectProject(projectId));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error creating project:', error);
    }
  };
  const handleDeleteProject = async () => {
    if (!selectedProjectId) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this project?");
    if (!confirmDelete) return;
    try {
      await deleteProjectFromFirebase(selectedProjectId);
      dispatch(deleteProject());
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "";
      setError(errorMessage);
    }
  };
  let content;
  if (loading) {
    content = <div className='flex justify-center items-center font-bold'>Loading projects...</div>;
  } else if (error) {
    content = <div className="text-red-500">{error}</div>;
  } else if (selectedProjectId === null || selectedProjectId === undefined) {
    content = <NoProjectSelected onStartAddProject={() => dispatch(startAddProject())} />;
  } else if (selectedProjectId === "new") {
    content = (
      <NewProject 
        onAdd={handleAddProject}
        onCancel={() => dispatch(cancelAddProject())}
      />
    );
  } else {
    const selectedProject = projects.find((project) => project.id === selectedProjectId);
    
    if (!selectedProject) {
      content = (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <p className="text-xl font-semibold text-gray-800">Project not found</p>
          </div>
        </div>
      );
    } else {
      content = (
        <SelectedProject
          project={selectedProject}
          onDelete={handleDeleteProject}
        />
      );
    }
  }
  
  return (
    <ProtectedRoute>
      <Layout
        projects={projects}
        onSelectProject={(id) => dispatch(selectProject(id))}
        selectedProjectId={selectedProjectId}
        onStartAddProject={() => dispatch(startAddProject())}
      >
        {content}
      </Layout>
    </ProtectedRoute>
  );
}
