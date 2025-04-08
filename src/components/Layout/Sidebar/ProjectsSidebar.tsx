import { useState, useEffect, useRef } from 'react';
import Button from '../../Button';
import { Project } from '@/models/models';
import { PlusCircle, Folder, LogOut, User, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { logoutUser } from '@/services/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import Logo from "@/assets/DALL·E 2025-03-10 10.27.57 - Minimalist and modern logo for a project management system. The design should feature an abstract, sleek icon representing workflow, automation, or ta.webp";

interface ProjectsSidebarProps {
  onStartAddProject: () => void;
  projects: Project[];
  onSelectProject: (id: string) => void;
  selectedProjectId: string | null;
}

export default function ProjectsSidebar({
  onStartAddProject,
  projects,
  onSelectProject,
  selectedProjectId,
}: ProjectsSidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push('/login');
    } catch (error) {
      console.error('Error at login:', error);
    }
  };

  return (
    <aside className="w-1/3 px-8 py-16 bg-gradient-to-b from-secondary to-primary text-white md:w-72 rounded-r-xl flex flex-col justify-between min-h-screen">
      <div>
        <h2 className="mb-8 font-bold uppercase md:text-xl tracking-wide flex gap-4">
          <Image src={Logo} alt="Logo" width={30} height={10} className='rounded'/>
          TaskFlow
        </h2>
        <div>
          <button 
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200 flex items-center gap-2" 
            onClick={onStartAddProject}
          >
            <PlusCircle size={20} />
            <span>Add Project</span>
          </button>
        </div>
        <ul className="mt-8 space-y-2">
          {projects.map((project) => {
            const isSelected = project.id === selectedProjectId;
            return (
              <li key={project.id}>
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-2
                    ${isSelected 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                  onClick={() => project.id && onSelectProject(project.id)}
                >
                  <Folder size={16} />
                  <span>{project.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-white/10 pt-4" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.email}
              </p>
              <p className="text-xs text-white/70 truncate">
                {user?.uid?.slice(0, 8)}...
              </p>
            </div>
            <div className="text-white/70">
              {isDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl">
              <div className="py-1">
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 transition-colors duration-200"
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 transition-colors duration-200"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
