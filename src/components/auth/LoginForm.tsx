'use client';
import { useState } from 'react';
import { loginUser } from '@/services/firebaseService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Logo from "@/assets/DALL·E 2025-03-10 10.27.57 - Minimalist and modern logo for a project management system. The design should feature an abstract, sleek icon representing workflow, automation, or ta.webp";

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      router.push('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    }
  };
 
  return (
    <div className="w-full h-screen flex items-center max-w-md mx-auto ">
      <div className="card w-[500px]">
        <div className='flex justify-center items-center'>
          <h2 className="mb-8 font-bold uppercase md:text-xl tracking-wide flex gap-4">
            <Image src={Logo} alt="Logo" width={30} height={10} className='rounded'/>
            TaskFlow
          </h2>
        </div>
        <h2 className="text-2xl font-bold text-primary mb-6">Sign in</h2>
        {error && <p className="text-error mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          <button type="submit" className="button-primary w-full">
            Login
          </button>
        </form>
        <p className='flex justify-center pt-5'>Create an account? <Link href="/register" className='pl-1 text-slate-500'> Register</Link></p>
      </div>
    </div>
  );
} 