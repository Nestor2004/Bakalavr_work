import { useRef, useState } from 'react';
import { Project, Resource } from '@/models/models';
import Input from './Input';
import Modal from './Modal';
import Resources from './Resourches';
import { useAuth } from '@/contexts/AuthContext';

interface NewProjectProps {
  onAdd: (project: Omit<Project, 'id'>) => void;
  onCancel: () => void;
}

export default function NewProject({ onAdd, onCancel }: NewProjectProps) {
  const modal = useRef<{ open: () => void } | null>(null);
  const title = useRef<HTMLInputElement>(null);
  const description = useRef<HTMLTextAreaElement>(null);
  const dueDate = useRef<HTMLInputElement>(null);
  const budget = useRef<HTMLInputElement>(null);
  const currency = useRef<HTMLSelectElement>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const { user } = useAuth();

  const handleSave = async () => {
    const enteredTitle = title.current?.value;
    const enteredDescription = description.current?.value;
    const enteredDueDate = dueDate.current?.value;
    const enteredBudget = budget.current?.value;
    const selectedCurrency = currency.current?.value;

    if (
      !enteredTitle ||
      !enteredDescription ||
      !enteredDueDate ||
      !enteredBudget ||
      !selectedCurrency
    ) {
      modal.current?.open();
      return;
    }

    if (!user) {
      modal.current?.open();
      return;
    }

    const newProject = {
      title: enteredTitle,
      description: enteredDescription,
      dueDate: enteredDueDate,
      budget: Number(enteredBudget),
      currency: selectedCurrency,
      resources: resources,
      tasks: [],
      creatorId: user.uid,
      creatorEmail: user.email ?? "",
      sharedWith: [],
      createdAt: new Date().toISOString()
    };

    onAdd(newProject);
  };

  return (
    <>
      <Modal ref={modal} buttonCaption="Ok">
        <h2 className="text-xl font-bold text-primary my-4">Invalid Input</h2>
        <p className="text-text-secondary mb-4">
          Please make sure you provide a valid value for every input field.
        </p>
      </Modal>
      <div className="w-full max-w-2xl mx-auto mt-8">
        <div className="card">
          <h2 className="text-2xl font-bold text-primary mb-6">Create New Project</h2>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <Input 
                type="text" 
                ref={title} 
                label="Project Title" 
                placeholder="Enter project title"
                className="input-field"
              />
              
              <Input 
                ref={description} 
                label="Project Description" 
                textarea 
                placeholder="Describe your project..."
                className="input-field min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Input 
                  type="number" 
                  ref={budget} 
                  label="Budget" 
                  placeholder="Enter budget amount"
                  className="input-field"
                />
                
                <Input 
                  type="date" 
                  ref={dueDate} 
                  label="Due Date" 
                  className="input-field"
                />
              </div>
              
              <div className="space-y-4">
                <Input
                  ref={currency}
                  label="Currency"
                  select
                  className="input-field"
                  options={[
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'UAH', label: 'UAH' },
                    { value: 'GBP', label: 'GBP' },
                  ]}
                />
              </div>
            </div>
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Project Resources</h3>
              <Resources onUpdate={setResources} />
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-8">
            <button 
              className="button-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="button-primary"
              onClick={handleSave}
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
