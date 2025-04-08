"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Project,Task} from "@/models/models";
import { updateTaskStatusInFirebase,deleteTaskFromFirebase } from "@/services/firebaseService";

interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  selectedProjectId: null,
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
    selectProject: (state, action: PayloadAction<string>) => {
      state.selectedProjectId = action.payload;
    },
    startAddProject: (state) => {
      state.selectedProjectId = "new";
    },
    cancelAddProject: (state) => {
      state.selectedProjectId = null;
    },
    addProject: (state, action: PayloadAction<Omit<Project, "id">>) => {
      const newProject: Project = { ...action.payload };
      state.projects.push(newProject);
      state.selectedProjectId = null;
    },
    deleteProject: (state) => {
      state.projects = state.projects.filter((p) => p.id !== state.selectedProjectId);
      state.selectedProjectId = null;
    },
    addTask: (state, action: PayloadAction<{ projectId: string; taskData: Task }>) => {
      const { projectId, taskData } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (project) {
        project.tasks = [...(project.tasks || []), taskData];
      }
    },
    deleteTask: (state, action: PayloadAction<{ taskId: string; projectId: string }>) => {
      const { taskId, projectId } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
    
      if (project) {
        project.tasks = project.tasks.filter((task) => task.id !== taskId);
    
        deleteTaskFromFirebase(projectId, taskId);
      }
    },    
    updateTaskStatus: (state, action: PayloadAction<{ taskId: string; newStatus: string; projectId?: string }>) => {
      const { taskId, newStatus, projectId } = action.payload;
      if (!projectId) {
        console.error("❌ Project ID is missing");
        return;
      }
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) {
        console.error(`❌ Project with ID ${projectId} not found`);
        return;
      }
      const taskIndex = project.tasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) {
        console.error(`❌ Task with ID ${taskId} not found`);
        return;
      }
      project.tasks[taskIndex] = { ...project.tasks[taskIndex], status: newStatus };
      project.tasks = [...project.tasks];
      updateTaskStatusInFirebase(projectId, taskId, newStatus);
    },
  },
});

export const {
  setProjects,
  selectProject,
  startAddProject,
  cancelAddProject,
  addProject,
  deleteProject,
  addTask,
  deleteTask,
  updateTaskStatus,
} = projectSlice.actions;

export default projectSlice.reducer;
