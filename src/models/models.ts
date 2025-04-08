export interface Resource {
  id: string;
  name: string;
  email: string;
  role: string;
  rank: string;
}

export interface Project {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  budget: number;
  currency: string;
  resources: Resource[];
  tasks: Task[];
  creatorId: string;
  creatorEmail: string;
  sharedWith: string[];
  createdAt: string;
  isCreator?: boolean;
}

export interface Task {
  id: string;
  text: string;
  status: string;
  assignedTo: string;
  deadline: string;
  storyPoints: number;
  description: string;
  startDate?: string;
  endDate?: string;
}
