import { useState } from 'react';
import { X, Calendar, Trash2, Edit2, Save, Hash } from "lucide-react";

import { Task, Resource } from "@/models/models";

interface TaskInformationProps {
  task: Task;
  setIsOpen: (isOpen: boolean) => void;
  resources: Resource[];
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, taskData: Partial<Task>) => void;
}

export default function TaskInformation({ task, setIsOpen, resources, onDelete, onUpdate }: TaskInformationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      setIsOpen(false);
    }
  };

  const handleSave = () => {
    onUpdate(task.id, editedTask);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  // Форматування дати для input type="date"
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
  };

  // Змінюємо відображення призначеного ресурсу
  const assignedResource = resources.find(r => r.id === task.assignedTo);

  // Remove duplicates from resources array based on id
  const uniqueResources = Array.from(new Map(resources.map(r => [r.id, r])).values());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={handleClose}>
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl transform transition-all duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          {isEditing ? (
            <input
              type="text"
              value={editedTask.text}
              onChange={(e) => setEditedTask({ ...editedTask, text: e.target.value })}
              className="text-2xl font-semibold w-full border-b border-gray-300 focus:outline-none focus:border-blue-500"
            />
          ) : (
            <h3 className="text-2xl font-semibold text-text-primary">{task.text}</h3>
          )}
          <div className="flex items-center gap-4">
            {isEditing ? (
              <>
                <button onClick={handleSave} className="text-green-500 hover:text-green-700 transition-colors duration-200">
                  <Save size={20} />
                </button>
                <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                  <X size={20} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-700 transition-colors duration-200">
                  <Edit2 size={20} />
                </button>
                <button onClick={handleDelete} className="text-red-500 hover:text-red-700 transition-colors duration-200">
                  <Trash2 size={20} />
                </button>
                <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                  <X size={24} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editedTask.description}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Deadline</label>
                  <input
                    type="date"
                    value={formatDateForInput(editedTask.deadline)}
                    onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Story Points</label>
                  <input
                    type="number"
                    min="1"
                    max="13"
                    value={editedTask.storyPoints}
                    onChange={(e) => setEditedTask({ ...editedTask, storyPoints: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Assigned To</label>
                <select
                  value={editedTask.assignedTo}
                  onChange={(e) => setEditedTask({ ...editedTask, assignedTo: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a resource</option>
                  {uniqueResources.map((resource) => (
                    <option key={`resource-${resource.id}`} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <DetailRow label="Assigned To" value={
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center text-white text-sm">
                      {assignedResource ? assignedResource.name[0] : 'U'}
                    </div>
                    <span>{assignedResource ? assignedResource.name : 'Unassigned'}</span>
                  </div>
                } />
                <DetailRow label="Story Points" value={
                  <div className="flex items-center gap-1">
                    <Hash size={16} className="text-text-secondary" />
                    <span>{task.storyPoints} points</span>
                  </div>
                } />
                <DetailRow label="Deadline" value={<DateInfo task={task} />} />
                <DetailRow label="Status" value={<StatusBadge status={task.status as StatusType} />} />
              </div>
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-text-primary">Description</h4>
                <p className="text-text-secondary leading-relaxed">{task.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm font-medium text-text-secondary">{label}</span>
    <div className="text-text-primary">{value}</div>
  </div>
);

const DateInfo = ({ task }: { task: Task }) => (
  <div className="flex items-center gap-1">
    <Calendar size={16} className="text-text-secondary" />
    <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}</span>
  </div>
);

type StatusType = "To Do" | "In Progress" | "Done" | "Blocked" | "Ready to test";

const StatusBadge = ({ status }: { status: StatusType }) => {
  const statusColors: Record<StatusType, string> = {
    "To Do": "bg-gray-100 text-gray-800",
    "In Progress": "bg-blue-100 text-blue-800",
    "Done": "bg-green-100 text-green-800",
    "Blocked": "bg-red-100 text-red-800",
    "Ready to test": "bg-purple-100 text-purple-800",
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[status]}`}>
      {status}
    </span>
  );
};
