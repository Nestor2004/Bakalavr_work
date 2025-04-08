import { useState } from "react";
import { Resource } from "@/models/models";
import { auth } from "@/services/firebase";

interface ResourcesProps {
  onUpdate: (resources: Resource[]) => void;
}

export default function Resources({ onUpdate }: ResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [rank, setRank] = useState('');

  const handleAddResource = () => {
    if (!name.trim() || !email.trim() || !role.trim() || !rank.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (email === auth.currentUser?.email) {
      alert("You can't add yourself as a resource - you already have access to the project");
      return;
    }

    if (resources.some(resource => resource.email === email)) {
      alert('This email is already added to resources');
      return;
    }

    const newResource: Resource = {
      id: Math.random().toString(),
      name: name.trim(),
      email: email.trim(),
      role: role.trim(),
      rank: rank.trim()
    };

    const updatedResources = [...resources, newResource];
    setResources(updatedResources);
    onUpdate(updatedResources);

    setName('');
    setEmail('');
    setRole('');
    setRank('');
  };

  const handleRemoveResource = (id: string) => {
    const updatedResources = resources.filter(resource => resource.id !== id);
    setResources(updatedResources);
    onUpdate(updatedResources);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="input-field"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input-field"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input-field"
        >
          <option value="">Select Role</option>
          <option value="Developer">Developer</option>
          <option value="Designer">Designer</option>
          <option value="Manager">Manager</option>
          <option value="QA">QA</option>
        </select>
        <select
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          className="input-field"
        >
          <option value="">Select Rank</option>
          <option value="Junior">Junior</option>
          <option value="Middle">Middle</option>
          <option value="Senior">Senior</option>
          <option value="Lead">Lead</option>
        </select>
      </div>
      <button
        onClick={handleAddResource}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Resource
      </button>

      {resources.length > 0 && (
        <ul className="mt-4 space-y-2">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div>
                <div className="font-medium">{resource.name}</div>
                <div className="text-sm text-gray-600">
                  {resource.email} • {resource.role} • {resource.rank}
                </div>
              </div>
              <button
                onClick={() => handleRemoveResource(resource.id)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
