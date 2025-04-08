import { auth, db } from '@/services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  getDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { Project, Task } from '@/models/models';
export const registerUser = async (email: string, password: string, username: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Зберігаємо додаткову інформацію про користувача
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      username: username,
      email: email,
      createdAt: new Date().toISOString()
    });
    
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};
export const createProject = async (projectData: Omit<Project, 'id'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const sharedEmails = projectData.resources.map(resource => resource.email);

    const projectToSave = {
      ...projectData,
      creatorId: user.uid,
      creatorEmail: user.email,
      sharedWith: [...new Set(sharedEmails)],
      createdAt: new Date().toISOString(),
      dueDate: projectData.dueDate
    };

    const projectRef = await addDoc(collection(db, 'projects'), projectToSave);
    return projectRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
};

export const fetchProjects = async (): Promise<Project[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const creatorQuery = query(
      collection(db, 'projects'),
      where('creatorId', '==', user.uid)
    );
    
    const sharedQuery = query(
      collection(db, 'projects'),
      where('sharedWith', 'array-contains', user.email)
    );

    const [creatorSnapshot, sharedSnapshot] = await Promise.all([
      getDocs(creatorQuery),
      getDocs(sharedQuery)
    ]);

    const projects: Project[] = [
      ...creatorSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate?.toDate?.() 
            ? data.dueDate.toDate().toISOString() 
            : data.dueDate,
          budget: data.budget,
          currency: data.currency,
          resources: data.resources || [],
          tasks: data.tasks || [],
          creatorId: data.creatorId,
          creatorEmail: data.creatorEmail,
          sharedWith: data.sharedWith || [],
          createdAt: data.createdAt?.toDate?.() 
            ? data.createdAt.toDate().toISOString() 
            : data.createdAt,
          isCreator: true
        };
      }),
      ...sharedSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate?.toDate?.() 
            ? data.dueDate.toDate().toISOString() 
            : data.dueDate,
          budget: data.budget,
          currency: data.currency,
          resources: data.resources || [],
          tasks: data.tasks || [],
          creatorId: data.creatorId,
          creatorEmail: data.creatorEmail,
          sharedWith: data.sharedWith || [],
          createdAt: data.createdAt?.toDate?.() 
            ? data.createdAt.toDate().toISOString() 
            : data.createdAt,
          isCreator: false
        };
      })
    ];

    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }
};
export const deleteProject = async (projectId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');
    if (projectDoc.data().creatorId !== user.uid) {
      throw new Error('Not authorized to delete this project');
    }
    await deleteDoc(projectRef);
  } catch (error: any) {
    throw new Error(error.message);
  }
};


export const addTaskToFirebase = async (projectId: string, taskData: Omit<Task, 'id'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');
    const project = projectDoc.data();
    if (project.creatorId !== user.uid && !project.sharedWith.includes(user.email)) {
      throw new Error('Not authorized to add tasks to this project');
    }
    const tasksCollection = collection(projectRef, 'tasks');
    const taskRef = await addDoc(tasksCollection, {
      ...taskData,
      createdAt: new Date(),
      createdBy: user.uid
    });
    return taskRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateTaskStatusInFirebase = async (
  projectId: string,
  taskId: string,
  newStatus: string
) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  try {
    const projectRef = doc(db, 'projects', projectId);
    const taskRef = doc(projectRef, 'tasks', taskId);
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');
    const project = projectDoc.data();
    if (project.creatorId !== user.uid && !project.sharedWith.includes(user.email)) {
      throw new Error('Not authorized to update tasks in this project');
    }
    await updateDoc(taskRef, { status: newStatus });
  } catch (error: any) {
    throw new Error(error.message);
  }
};


export const shareProject = async (projectId: string, userEmail: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');
    const project = projectDoc.data();
    if (project.creatorId !== user.uid) {
      throw new Error('Not authorized to share this project');
    }
    if (project.sharedWith.includes(userEmail)) {
      throw new Error('User already has access to this project');
    }
    await updateDoc(projectRef, {
      sharedWith: arrayUnion(userEmail)
    });
    return true;
  } catch (error: any) {
    throw new Error(error.message);
  }
};


export const fetchProjectTasks = async (projectId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error('Project not found');
    const project = projectDoc.data();
    if (project.creatorId !== user.uid && !project.sharedWith.includes(user.email)) {
      throw new Error('Not authorized to view tasks in this project');
    }
    const tasksCollection = collection(projectRef, 'tasks');
    const tasksSnapshot = await getDocs(tasksCollection);
    return tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];
  } catch (error: any) {
    throw new Error(error.message);
  }
};


export const deleteTaskFromFirebase = async (projectId: string, taskId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    const project = projectDoc.data();
    if (project.creatorId !== user.uid && !project.sharedWith.includes(user.email)) {
      throw new Error('Not authorized to delete tasks in this project');
    }
    const taskRef = doc(projectRef, 'tasks', taskId);
    await deleteDoc(taskRef);
    return true;
  } catch (error: any) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
};


export const updateTaskInFirebase = async (
  projectId: string, 
  taskId: string, 
  taskData: Partial<Task>
) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const projectRef = doc(db, 'projects', projectId);
    const taskRef = doc(projectRef, 'tasks', taskId);
    
    await updateDoc(taskRef, {
      ...taskData,
      updatedAt: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error('Failed to update task');
  }
};

export const fetchProjectById = async (projectId: string): Promise<Project> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) throw new Error('Project not found');
    
    const data = projectDoc.data();
    if (data.creatorId !== user.uid && !data.sharedWith.includes(user.email)) {
      throw new Error('Not authorized to view this project');
    }

    // Fetch tasks from subcollection
    const tasksCollection = collection(projectRef, 'tasks');
    const tasksSnapshot = await getDocs(tasksCollection);
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];

    return {
      id: projectDoc.id,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate?.toDate?.() ? data.dueDate.toDate().toISOString() : data.dueDate,
      budget: data.budget,
      currency: data.currency,
      resources: data.resources || [],
      tasks: tasks, // Use tasks from subcollection
      creatorId: data.creatorId,
      creatorEmail: data.creatorEmail,
      sharedWith: data.sharedWith,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
      isCreator: data.creatorId === user.uid
    } as Project;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw new Error('Failed to fetch project');
  }
};