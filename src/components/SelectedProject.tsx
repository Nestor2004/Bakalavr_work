import { Project } from '@/models/models';
import TasksBoard from './TaskBoard';
import Button from './Button';
import { updateTaskStatusInFirebase } from '@/services/firebaseService';

interface SelectedProjectProps {
  project: Project;
  onDelete: () => void;
}

export default function SelectedProject({ project, onDelete }: SelectedProjectProps) {
  if (!project) {
    return <div>Loading project...</div>;
  }

  const formattedDate = project.dueDate 
    ? new Date(project.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No date set';
  
  return (
    <div className="w-full">
      <header className="pb-4 mb-4 border-b-2 border-stone-300">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-stone-600 mb-2">{project.title}</h1>
          <Button className="text-white hover:text-stone-950 bg-black" onClick={onDelete}>
            Delete
          </Button>
        </div>
        <p className="mb-4 text-stone-400">{formattedDate}</p>
        <p className="text-stone-600 whitespace-pre-wrap">{project.description}</p>
        <p className="text-stone-600 whitespace-pre-wrap pt-2">
          Budget: {project.budget} {project.currency}
        </p>
      </header>
      <section className="pb-4 mb-4 border-b-2 border-stone-300">
        <h2 className="text-xl font-bold text-stone-600 mb-2">Resources</h2>
        {project.resources?.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4">
            {project.resources.map((resource, index) => (
              <li key={index} className="p-2 border rounded-md bg-stone-100 border-stone-300">
                <p className="text-stone-600 font-bold">
                  {resource.name}
                </p>
                <p className="text-stone-500">
                  {resource.email}
                </p>
                <p className="text-stone-500">
                  {resource.role} • {resource.rank}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  Has project access
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-stone-500">No resources assigned.</p>
        )}
      </section>
      <h1 className='text-xl font-bold text-stone-600 mb-2'>Tasks Board</h1>
      {project.id && (
        <TasksBoard 
          tasks={project.tasks || []}
          projectId={project.id}
          resources={project.resources || []}
          onStatusChange={(taskId, status) => {
            updateTaskStatusInFirebase(project.id!, taskId, status);
          }}
        />
      )}
    </div>
  );
}
