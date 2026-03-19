import TodoList from '@/components/todo/todo-list';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <TodoList />
    </main>
  );
}
