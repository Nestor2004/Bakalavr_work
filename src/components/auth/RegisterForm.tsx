"use client";
import { useState } from 'react';
import { registerUser } from '@/services/firebaseService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Logo from "@/assets/DALL·E 2025-03-10 10.27.57 - Minimalist and modern logo for a project management system. The design should feature an abstract, sleek icon representing workflow, automation, or ta.webp";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(
        formData.email,
        formData.password,
        formData.username
      );
      router.push('/');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="w-full h-screen flex items-center max-w-md mx-auto">
      <div className="card w-[500px]">
        <div className="flex flex-col items-center mb-6">
          <h2 className="mb-8 font-bold uppercase md:text-xl tracking-wide flex gap-4">
            <Image src={Logo} alt="Logo" width={30} height={10} className='rounded'/>
            TaskFlow
          </h2>
        </div>
        <h2 className="text-2xl font-bold text-primary mb-6">Sign up</h2>
        {error && <p className="text-error mb-4">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="input-field w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="input-field w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="input-field w-full"
              required
            />
          </div>

          <button type="submit" className="button-primary w-full">
            Register
          </button>
        </form>
        <p className='flex justify-center pt-5'>Already registred? <Link href="/login" className='pl-1 text-slate-500'> Login</Link></p>
      </div>
    </div>
  );
} 