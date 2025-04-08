import { createAsyncThunk } from "@reduxjs/toolkit";
import { addTaskToFirebase } from "@/services/firebaseService";
import { addTask } from "./projectSlice"; 
import { Task } from "@/models/models";
export const addTaskThunk = createAsyncThunk(
  "projects/addTask",
  async ({ projectId, taskData }: { projectId: string; taskData: Omit<Task, "id"> }, { dispatch }) => {
    const newTaskId = await addTaskToFirebase(projectId, taskData);
    
    if (!newTaskId) {
      console.error("❌ Не вдалося отримати ID нового таску з Firebase");
      return;
    }

    const newTask: Task = { id: newTaskId, ...taskData };
    dispatch(addTask({ projectId, taskData: newTask }));
  }
);
