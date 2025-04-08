"use client";
import { useState } from 'react';
import { shareProject } from '@/services/firebaseService';
import { Share } from 'lucide-react';

interface ShareAccessProps {
  projectId: string;
}

export default function ShareAccess({ projectId }: ShareAccessProps) {
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await shareProject(projectId, email);
      setMessage('Access granted successfully');
      setEmail('');
      setTimeout(() => setIsOpen(false), 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        <Share size={20} />
        <span>Share Project</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-4 z-50">
          <h3 className="text-lg font-semibold mb-4">Share Project</h3>
          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            {message && (
              <p className={`text-sm ${
                message.includes('success') ? 'text-green-500' : 'text-red-500'
              }`}>
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Sharing...' : 'Share Access'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}