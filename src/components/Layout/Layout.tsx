import ProjectsSidebar from './Sidebar/ProjectsSidebar';
import { Project } from '@/models/models';

interface LayoutProps {
  children: React.ReactNode;
  projects: Project[];
  onSelectProject: (id: string) => void;
  selectedProjectId: string | null;
  onStartAddProject: () => void;
}

export default function Layout({
  children,
  projects,
  onSelectProject,
  selectedProjectId,
  onStartAddProject,
}: LayoutProps) {
  return (
    <div className="flex h-screen">
      <ProjectsSidebar
        projects={projects}
        onSelectProject={onSelectProject}
        selectedProjectId={selectedProjectId}
        onStartAddProject={onStartAddProject}
      />
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
