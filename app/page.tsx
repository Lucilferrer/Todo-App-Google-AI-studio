import AuthForm from '@/components/auth/auth-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white rounded-2xl mb-4 shadow-lg">
          <span className="text-2xl font-bold">T</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Minimalist Todo</h1>
        <p className="text-gray-500 mt-2">Simple, clean, and effective task management.</p>
      </div>
      <AuthForm />
    </main>
  );
}
