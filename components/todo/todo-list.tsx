'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, CheckCircle2, Loader2, LogOut, Check, GripVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Todo {
  id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

interface SortableItemProps {
  todo: Todo;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
}

function SortableTodoItem({ todo, onToggle, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 p-4 bg-white border rounded-2xl transition-all hover:shadow-md ${
        todo.is_completed ? 'border-gray-100 opacity-60' : 'border-gray-200'
      } ${isDragging ? 'shadow-xl scale-[1.02] border-black/10' : ''}`}
    >
      {!todo.is_completed && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      )}
      
      <button
        onClick={() => onToggle(todo.id, todo.is_completed)}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
          todo.is_completed 
            ? 'bg-emerald-500 border-emerald-500 text-white' 
            : 'border-gray-300 hover:border-black'
        }`}
      >
        {todo.is_completed && <Check className="w-4 h-4" />}
      </button>
      
      <span className={`flex-grow text-lg transition-all ${
        todo.is_completed ? 'line-through text-gray-400' : 'text-gray-700'
      }`}>
        {todo.title}
      </span>

      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTodos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('todos')
        .insert([{ title: newTodo, user_id: user.id }]);

      if (error) throw error;
      setNewTodo('');
      fetchTodos();
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setAdding(false);
    }
  };

  const toggleTodo = async (id: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: !isCompleted })
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      // Note: In a real app, you'd update the position in the database here.
      // Since we don't have a position column, this is local-only reordering.
    }
  };

  const activeTodos = todos.filter(t => !t.is_completed);
  const completedTodos = todos.filter(t => t.is_completed);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Lazy Tasks</h1>
          <p className="text-gray-500 mt-1">Stay focused and organized</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={addTodo} className="relative mb-12 group">
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          className="w-full pl-6 pr-16 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-lg"
        />
        <button
          type="submit"
          disabled={adding || !newTodo.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {adding ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
        </button>
      </form>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p>Loading your tasks...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Active Tasks */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 ml-1">
              To Do — {activeTodos.length}
            </h2>
            {activeTodos.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200"
              >
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">All caught up! Time to be lazy.</p>
              </motion.div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeTodos.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {activeTodos.map((todo) => (
                      <SortableTodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>

          {/* Completed Tasks */}
          {completedTodos.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 ml-1">
                Done & Dusted — {completedTodos.length}
              </h2>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {completedTodos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group flex items-center gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl opacity-60 hover:opacity-100 transition-all"
                    >
                      <button
                        onClick={() => toggleTodo(todo.id, todo.is_completed)}
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-500 text-white flex items-center justify-center"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      
                      <span className="flex-grow text-lg line-through text-gray-400">
                        {todo.title}
                      </span>

                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
