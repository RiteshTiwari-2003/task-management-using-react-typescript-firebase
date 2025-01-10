import { create } from 'zustand';
import { Task, TaskFilter, TaskCategory } from '../types/task';
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '../services/firebase';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filter: TaskFilter;
  viewMode: 'list' | 'board';
  searchQuery: string;
  unsubscribe: (() => void) | null;
  setViewMode: (mode: 'list' | 'board') => void;
  setFilter: (filter: TaskFilter) => void;
  setSearchQuery: (query: string) => void;
  fetchTasks: (userId: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newCategory: TaskCategory) => Promise<void>;
  cleanup: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  filter: 'all',
  viewMode: 'list',
  searchQuery: '',
  unsubscribe: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  fetchTasks: async (userId: string) => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();

    set({ loading: true, error: null });
    console.log('Fetching tasks for user ID:', userId);

    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100) // Limit initial load to 100 tasks
      );

      // Set up real-time listener
      const unsubscribeSnapshot = onSnapshot(q, 
        (snapshot) => {
          const tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Task[];
          set({ tasks, loading: false });
        },
        (error) => {
          console.error('Error fetching tasks:', error);
          set({ 
            error: `Failed to fetch tasks: ${error instanceof Error ? error.message : String(error)}`,
            loading: false 
          });
        }
      );

      set({ unsubscribe: unsubscribeSnapshot });
    } catch (error) {
      console.error('Error setting up task listener:', error);
      set({ 
        error: `Failed to set up task listener: ${error instanceof Error ? error.message : String(error)}`,
        loading: false 
      });
    }
  },

  addTask: async (taskData) => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const tasksRef = collection(db, 'tasks');
      
      const newTask = {
        ...taskData,
        createdAt: now,
        updatedAt: now,
        activities: []
      };

      await addDoc(tasksRef, newTask);
      // No need to update state as the snapshot listener will handle it
      set({ loading: false });
    } catch (error) {
      console.error('Error adding task:', error);
      set({ 
        error: `Failed to add task: ${error instanceof Error ? error.message : String(error)}`,
        loading: false 
      });
    }
  },

  updateTask: async (taskId, updates) => {
    set({ loading: true, error: null });
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const updatedTask = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(taskRef, updatedTask);
      // No need to update state as the snapshot listener will handle it
      set({ loading: false });
    } catch (error) {
      console.error('Error updating task:', error);
      set({ 
        error: `Failed to update task: ${error instanceof Error ? error.message : String(error)}`,
        loading: false 
      });
    }
  },

  deleteTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      // No need to update state as the snapshot listener will handle it
      set({ loading: false });
    } catch (error) {
      console.error('Error deleting task:', error);
      set({ 
        error: `Failed to delete task: ${error instanceof Error ? error.message : String(error)}`,
        loading: false 
      });
    }
  },

  moveTask: async (taskId, newCategory) => {
    const { updateTask } = get();
    await updateTask(taskId, { category: newCategory });
  },

  cleanup: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  }
}));
