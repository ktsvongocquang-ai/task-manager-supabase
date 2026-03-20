import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Calendar as CalendarIcon, 
  CheckCircle2, Circle, Lock, Trash2, RefreshCw,
  Sun, Moon, Coffee, Star, LayoutGrid, 
  BarChart2, X, FileText, Pin, CheckSquare, Square, Archive, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';

type TaskStatus = 'todo' | 'in-progress' | 'done' | 'archived';
type Priority = 'high' | 'medium' | 'low' | 'none';

interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string;
  description?: string;
  priority: Priority;
  category: string;
}

interface NoteItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface Note {
  id: string;
  title: string;
  items: NoteItem[];
  color: string;
  isPinned: boolean;
}

const NOTE_COLORS = [
  'bg-white',
  'bg-red-50',
  'bg-orange-50',
  'bg-amber-50',
  'bg-green-50',
  'bg-teal-50',
  'bg-blue-50',
  'bg-indigo-50',
  'bg-purple-50',
  'bg-pink-50',
];

const SUGGESTED_ICONS = ['📌', '💼', '✈️', '🛒', '🍔', '🐶', '🎨', '🎵', '🧘‍♀️', '🚗'];
const SUGGESTED_COLORS = [
  'bg-gray-100 text-gray-700',
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
];

const INITIAL_CATEGORIES: Record<string, CategoryItem> = {
  health: { id: 'health', label: 'Sức khoẻ', icon: '🏃‍♂️', color: 'bg-rose-100 text-rose-700' },
  family: { id: 'family', label: 'Gia đình', icon: '👨‍👩‍👧', color: 'bg-orange-100 text-orange-700' },
  finance: { id: 'finance', label: 'Tài chính', icon: '💰', color: 'bg-emerald-100 text-emerald-700' },
  learning: { id: 'learning', label: 'Học tập', icon: '📚', color: 'bg-blue-100 text-blue-700' },
  personal: { id: 'personal', label: 'Cá nhân', icon: '🎯', color: 'bg-purple-100 text-purple-700' },
};



// Removed initial data constants

const NoteCard = ({ 
  note, 
  updateNoteTitle, 
  saveNoteTitle, 
  togglePinNote, 
  deleteNote, 
  toggleNoteItem, 
  updateNoteItem, 
  addNoteItem 
}: {
  note: Note;
  updateNoteTitle: (id: string, title: string) => void;
  saveNoteTitle: (id: string, title: string) => void;
  togglePinNote: (id: string) => void;
  deleteNote: (id: string) => void;
  toggleNoteItem: (noteId: string, itemId: string) => void;
  updateNoteItem: (noteId: string, itemId: string, text: string) => void;
  addNoteItem: (noteId: string) => void;
}) => {
  const activeItems = note.items.filter(i => !i.isCompleted);
  const completedItems = note.items.filter(i => i.isCompleted);
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <div className={`rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col ${note.color}`}>
      <div className="p-4 flex items-start justify-between group">
        <input 
          type="text" 
          value={note.title}
          onChange={(e) => updateNoteTitle(note.id, e.target.value)}
          onBlur={(e) => saveNoteTitle(note.id, e.target.value)}
          className="font-bold text-gray-800 bg-transparent border-none focus:ring-0 p-0 text-lg w-full"
          placeholder="Tiêu đề..."
        />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => togglePinNote(note.id)} className={`p-1.5 rounded-md hover:bg-black/5 ${note.isPinned ? 'text-blue-600' : 'text-gray-400'}`}>
            <Pin className="w-4 h-4" />
          </button>
          <button onClick={() => deleteNote(note.id)} className="p-1.5 rounded-md hover:bg-black/5 text-gray-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 flex-1">
        <div className="space-y-2">
          {activeItems.map(item => (
            <div key={item.id} className="flex items-start gap-2 group/item">
              <button onClick={() => toggleNoteItem(note.id, item.id)} className="mt-1 text-gray-400 hover:text-gray-600">
                <Square className="w-4 h-4" />
              </button>
              <textarea 
                value={item.text}
                onChange={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                  updateNoteItem(note.id, item.id, e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addNoteItem(note.id);
                  }
                }}
                rows={1}
                placeholder="Mục danh sách..."
                className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-gray-700 text-sm resize-none overflow-hidden leading-snug outline-none py-1"
                style={{ height: 'auto', minHeight: '24px' }}
                onFocus={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <button onClick={() => addNoteItem(note.id)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <Plus className="w-4 h-4" /> Thêm mục
            </button>
          </div>
        </div>

        {completedItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-black/5">
            <button 
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 mb-2"
            >
              <span className={`transform transition-transform ${showCompleted ? 'rotate-90' : ''}`}>›</span>
              Đã hoàn tất {completedItems.length} mục
            </button>
            {showCompleted && (
              <div className="space-y-2">
                {completedItems.map(item => (
                  <div key={item.id} className="flex items-start gap-2 opacity-60">
                    <button onClick={() => toggleNoteItem(note.id, item.id)} className="mt-1 text-gray-600 shrink-0">
                      <CheckSquare className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-sm text-gray-700 line-through break-words whitespace-pre-wrap pt-0.5">{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function MyTasks() {
  const { profile } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Record<string, CategoryItem>>({});
  const [viewMode, setViewMode] = useState<'focus' | 'kanban' | 'calendar' | 'dashboard' | 'notes'>('focus');
  const [searchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.id) return;
    
    try {
      // 1. Fetch Categories
      const { data: catData } = await supabase.from('personal_categories').select('*').eq('user_id', profile.id);
      const catMap: Record<string, CategoryItem> = {};
      
      if (!catData || catData.length === 0) {
        // Insert default categories
        const defaultsToInsert = Object.keys(INITIAL_CATEGORIES).map(k => ({
          user_id: profile.id,
          label: INITIAL_CATEGORIES[k].label,
          icon: INITIAL_CATEGORIES[k].icon,
          color: INITIAL_CATEGORIES[k].color,
        }));
        const { data: insertedCats } = await supabase.from('personal_categories').insert(defaultsToInsert).select();
        insertedCats?.forEach(c => catMap[c.id] = { id: c.id, label: c.label, icon: c.icon, color: c.color });
      } else {
        catData.forEach(c => catMap[c.id] = { id: c.id, label: c.label, icon: c.icon, color: c.color });
      }
      setCategories(catMap);

      // 2. Fetch Tasks
      const { data: taskData } = await supabase.from('personal_tasks').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
      if (taskData) {
        setTasks(taskData.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status as TaskStatus,
          dueDate: t.due_date,
          priority: t.priority as Priority,
          category: t.category_id,
        })));
      }

      // 3. Fetch Notes & Items
      const { data: noteData } = await supabase.from('personal_notes')
        .select('*, personal_note_items(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
        
      if (noteData) {
        setNotes(noteData.map(n => ({
          id: n.id,
          title: n.title || 'Ghi chú',
          color: n.color,
          isPinned: n.is_pinned,
          items: (n.personal_note_items || []).map((i: any) => ({
            id: i.id,
            text: i.text,
            isCompleted: i.is_completed,
            created_at: i.created_at
          })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        })));
      }
    } catch (err) {
      console.error('Error fetching personal data:', err);
    }
  };
  
  useEffect(() => {
    if (Object.keys(categories).length > 0 && newTaskCategory === 'personal') {
      const personalCat = Object.values(categories).find(c => c.label === 'Cá nhân') || Object.values(categories)[0];
      if (personalCat) setNewTaskCategory(personalCat.id);
    }
  }, [categories]);

  // Quick Add State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<string>('personal');
  const [newTaskDate, setNewTaskDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Inline Add states
  const [kanbanAddingCategory, setKanbanAddingCategory] = useState<string | null>(null);
  const [kanbanNewTaskTitle, setKanbanNewTaskTitle] = useState('');
  const [kanbanNewTaskDesc, setKanbanNewTaskDesc] = useState('');
  const [kanbanNewTaskDate, setKanbanNewTaskDate] = useState<string | null>(null);
  const [expandedDoneCols, setExpandedDoneCols] = useState<Record<string, boolean>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [calendarAddingDate, setCalendarAddingDate] = useState<string | null>(null);
  const [calendarNewTaskTitle, setCalendarNewTaskTitle] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());

  // Add Category State
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showDashboardAddCat, setShowDashboardAddCat] = useState(false);
  const [dashboardCatName, setDashboardCatName] = useState('');
  const [dashboardCatIcon, setDashboardCatIcon] = useState(SUGGESTED_ICONS[0]);
  const [dashboardCatColor, setDashboardCatColor] = useState(SUGGESTED_COLORS[0]);

  // Derived state
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === todayStr);
  const completedToday = todayTasks.filter(t => t.status === 'done').length;
  const progressPercent = todayTasks.length === 0 ? 0 : Math.round((completedToday / todayTasks.length) * 100);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Chào buổi sáng', icon: Sun, color: 'text-amber-500' };
    if (hour < 18) return { text: 'Chào buổi chiều', icon: Coffee, color: 'text-orange-500' };
    return { text: 'Chào buổi tối', icon: Moon, color: 'text-indigo-500' };
  }, []);

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !profile?.id) return;
    
    try {
      const { data, error } = await supabase.from('personal_tasks').insert([{
        user_id: profile.id,
        title: newTaskTitle.trim(),
        status: 'todo',
        due_date: newTaskDate || null,
        category_id: newTaskCategory,
        priority: 'none'
      }]).select().single();

      if (error) throw error;
      if (data) {
        setTasks([{
          id: data.id,
          title: data.title,
          status: data.status as TaskStatus,
          dueDate: data.due_date,
          priority: data.priority as Priority,
          category: data.category_id,
        }, ...tasks]);
      }
      setNewTaskTitle('');
    } catch (err) {
      console.error('Error adding task', err);
    }
  };

  const createQuickTask = async (
    title: string, 
    status: TaskStatus = 'todo', 
    dueDate: string | null = null, 
    categoryOverride: string | null = null,
    description: string | null = null
  ) => {
    if (!title.trim() || !profile?.id) return;
    try {
      const payload: any = {
        user_id: profile.id,
        title: title.trim(),
        status,
        due_date: dueDate,
        category_id: categoryOverride || newTaskCategory,
        priority: 'none'
      };
      if (description) payload.description = description;

      const { data, error } = await supabase.from('personal_tasks').insert([payload]).select().single();

      if (error) throw error;
      if (data) {
        setTasks(prev => [{
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status as TaskStatus,
          dueDate: data.due_date,
          priority: data.priority as Priority,
          category: data.category_id,
        }, ...prev]);
      }
    } catch (err) {
      console.error('Error quick creating task', err);
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    
    // optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const { error } = await supabase.from('personal_tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
    } catch (err) {
      console.error('Error updating task status', err);
      // revert
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: task.status } : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // optimistic
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    try {
      await supabase.from('personal_tasks').delete().eq('id', taskId);
    } catch (err) {
      console.error('Error deleting task', err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !profile?.id) return;
    try {
      const { data, error } = await supabase.from('personal_categories').insert([{
        user_id: profile.id,
        label: newCategoryName.trim(),
        icon: '📌',
        color: 'bg-gray-100 text-gray-700'
      }]).select().single();

      if (error) throw error;
      if (data) {
        setCategories(prev => ({
          ...prev,
          [data.id]: {
            id: data.id,
            label: data.label,
            icon: data.icon,
            color: data.color
          }
        }));
        setNewTaskCategory(data.id);
      }
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err) {
      console.error('Error adding category', err);
    }
  };

  const handleDashboardAddCat = async () => {
    if (!dashboardCatName.trim() || !profile?.id) return;
    try {
      const { data, error } = await supabase.from('personal_categories').insert([{
        user_id: profile.id,
        label: dashboardCatName.trim(),
        icon: dashboardCatIcon,
        color: dashboardCatColor
      }]).select().single();

      if (error) throw error;
      if (data) {
        setCategories(prev => ({
          ...prev,
          [data.id]: {
            id: data.id,
            label: data.label,
            icon: data.icon,
            color: data.color
          }
        }));
      }
      setDashboardCatName('');
      setDashboardCatIcon(SUGGESTED_ICONS[0]);
      setDashboardCatColor(SUGGESTED_COLORS[0]);
      setShowDashboardAddCat(false);
    } catch (err) {
      console.error('Error adding category from dashboard', err);
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, status: 'archived' } : task));
    await supabase.from('personal_tasks').update({ status: 'archived' }).eq('id', taskId);
  };

  const handleUnarchiveTask = async (taskId: string) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, status: 'done' } : task));
    await supabase.from('personal_tasks').update({ status: 'done' }).eq('id', taskId);
  };

  // --- NOTES LOGIC ---
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteColor, setNewNoteColor] = useState(NOTE_COLORS[0]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase.from('personal_notes').insert([{
        user_id: profile.id,
        title: newNoteTitle.trim() || 'Ghi chú mới',
        color: newNoteColor,
        is_pinned: false
      }]).select().single();

      if (error) throw error;
      if (data) {
        // Also add the first empty item
        const { data: itemData, error: itemError } = await supabase.from('personal_note_items').insert([{
          note_id: data.id,
          text: '',
          is_completed: false
        }]).select().single();
        
        if (itemError) throw itemError;

        const newNote: Note = {
          id: data.id,
          title: data.title,
          items: itemData ? [{ id: itemData.id, text: itemData.text, isCompleted: itemData.is_completed }] : [],
          color: data.color,
          isPinned: data.is_pinned
        };
        setNotes([newNote, ...notes]);
      }
      setNewNoteTitle('');
      setNewNoteColor(NOTE_COLORS[0]);
    } catch (err) {
      console.error('Error adding note', err);
    }
  };

  const updateNoteItem = async (noteId: string, itemId: string, text: string) => {
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          items: note.items.map(item => item.id === itemId ? { ...item, text } : item)
        };
      }
      return note;
    }));
    await supabase.from('personal_note_items').update({ text }).eq('id', itemId);
  };

  const toggleNoteItem = async (noteId: string, itemId: string) => {
    const note = notes.find(n => n.id === noteId);
    const item = note?.items.find(i => i.id === itemId);
    if (!item) return;

    const newCompleted = !item.isCompleted;

    setNotes(notes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          items: n.items.map(i => i.id === itemId ? { ...i, isCompleted: newCompleted } : i)
        };
      }
      return n;
    }));
    await supabase.from('personal_note_items').update({ is_completed: newCompleted }).eq('id', itemId);
  };

  const addNoteItem = async (noteId: string) => {
    try {
      const { data, error } = await supabase.from('personal_note_items').insert([{
        note_id: noteId,
        text: '',
        is_completed: false
      }]).select().single();

      if (error) throw error;
      if (data) {
        setNotes(notes.map(note => {
          if (note.id === noteId) {
            return {
              ...note,
              items: [...note.items, { id: data.id, text: data.text, isCompleted: data.is_completed }]
            };
          }
          return note;
        }));
      }
    } catch (err) {
      console.error('Error adding note item', err);
    }
  };

  const deleteNote = async (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
    await supabase.from('personal_notes').delete().eq('id', noteId);
  };

  const togglePinNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const newPinned = !note.isPinned;
    setNotes(notes.map(n => n.id === noteId ? { ...n, isPinned: newPinned } : n));
    await supabase.from('personal_notes').update({ is_pinned: newPinned }).eq('id', noteId);
  };

  const updateNoteTitle = (noteId: string, title: string) => {
    setNotes(notes.map(n => n.id === noteId ? { ...n, title } : n));
  };

  const saveNoteTitle = async (noteId: string, title: string) => {
    await supabase.from('personal_notes').update({ title }).eq('id', noteId);
  };

  // --- KANBAN DRAG & DROP ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Fallback Fix for Ghost Image: ensure only the card is used as the ghost image
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    }
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const updateTaskField = async (taskId: string, field: keyof Task, value: any, dbField: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));
    try {
      const { error } = await supabase.from('personal_tasks').update({ [dbField]: value }).eq('id', taskId);
      if (error) throw error;
    } catch (err) {
      console.error(`Error updating task ${field}`, err);
    }
  };

  const renderTaskCard = (task: Task, isKanban = false) => {
    const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'done';
    const cat = categories[task.category] || categories['personal'];

    return (
      <div 
        key={task.id}
        draggable={isKanban}
        onDragStart={(e) => {
          if (isKanban) handleDragStart(e, task.id);
        }}
        className={`group bg-white rounded-2xl border transition-all duration-200 ${
          task.status === 'done' ? 'border-gray-100 bg-gray-50/50 opacity-75' : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
        } ${isKanban ? 'p-4 cursor-grab active:cursor-grabbing' : 'p-4 sm:p-5 flex items-center gap-4'}`}
      >
        <button 
          onClick={() => toggleTaskStatus(task.id)}
          className={`flex-shrink-0 transition-transform active:scale-90 ${isKanban ? 'mt-0.5 float-left mr-3' : ''}`}
        >
          {task.status === 'done' ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-50" />
          ) : (
            <Circle className="w-6 h-6 text-gray-300 hover:text-emerald-500 transition-colors" />
          )}
        </button>

        <div className={`flex-1 ${isKanban ? 'clear-right' : ''}`}>
          <h4 
            onClick={() => setEditingTask(task)}
            className={`font-medium transition-all hover:text-emerald-600 cursor-pointer ${
            task.status === 'done' || task.status === 'archived' ? 'text-gray-400 line-through' : 'text-gray-800'
          } ${isKanban ? 'text-sm mb-2' : 'text-base mb-1'}`}>
            {task.title}
          </h4>
          
          {task.description && (
             <p className="text-xs text-gray-500 line-clamp-2 mb-2 break-words" onClick={() => setEditingTask(task)}>
                {task.description}
             </p>
          )}
          
          <div className="flex flex-wrap items-center gap-2 relative z-10">
            {/* Category Dropdown */}
            <div className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${cat?.color || 'bg-gray-100 text-gray-700'} hover:opacity-80 transition-opacity cursor-pointer shadow-sm`}>
              <span>{cat?.icon}</span>
              <select 
                value={task.category}
                onChange={(e) => updateTaskField(task.id, 'category', e.target.value, 'category_id')}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {Object.values(categories).map((c: CategoryItem) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
              <span className="truncate max-w-[80px] sm:max-w-[120px] block">{cat?.label}</span>
            </div>

            {/* Date Picker */}
            <div className={`relative inline-flex items-center gap-1 text-[11px] font-medium ${
                isOverdue ? 'text-red-600 bg-red-50' : task.dueDate ? 'text-emerald-700 bg-emerald-50' : 'text-gray-400 bg-gray-100'
              } px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity cursor-pointer shadow-sm`}>
              <CalendarIcon className="w-3 h-3 flex-shrink-0" />
              <input 
                type="date"
                value={task.dueDate || ''}
                onChange={(e) => updateTaskField(task.id, 'dueDate', e.target.value || null, 'due_date')}
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    if (e.currentTarget.showPicker) {
                      e.currentTarget.showPicker();
                    }
                  } catch (err) {}
                }}
                className="absolute text-transparent bg-transparent inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="whitespace-nowrap">{task.dueDate ? (task.dueDate === todayStr ? 'Hôm nay' : new Date(task.dueDate).toLocaleDateString('vi-VN')) : 'Ngày'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col gap-2 mt-3 sm:mt-0">
          {task.status === 'done' && (
            <button 
              onClick={() => handleArchiveTask(task.id)}
              className={`text-gray-400 sm:text-gray-300 hover:text-blue-500 transition-colors ${
                isKanban ? 'sm:absolute sm:top-4 sm:right-10 opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 sm:p-0' : 'opacity-100 sm:opacity-0 group-hover:opacity-100 p-2'
              }`}
              title="Lưu trữ"
            >
              <Archive className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          )}
          {task.status === 'archived' && (
            <button 
              onClick={() => handleUnarchiveTask(task.id)}
              className={`text-gray-400 sm:text-gray-300 hover:text-blue-500 transition-colors ${
                isKanban ? 'sm:absolute sm:top-4 sm:right-10 opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 sm:p-0' : 'opacity-100 sm:opacity-0 group-hover:opacity-100 p-2'
              }`}
              title="Khôi phục"
            >
              <RefreshCw className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          )}
          <button 
            onClick={() => handleDeleteTask(task.id)}
            className={`text-gray-400 sm:text-gray-300 hover:text-red-500 transition-colors ${
              isKanban ? 'sm:absolute sm:top-4 sm:right-4 opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 sm:p-0' : 'opacity-100 sm:opacity-0 group-hover:opacity-100 p-2'
            }`}
            title="Xoá"
          >
            <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderNotesView = () => {
    const pinnedNotes = notes.filter(n => n.isPinned);
    const unpinnedNotes = notes.filter(n => !n.isPinned);

    return (
      <div className="space-y-8 pb-12">
        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Plus className="w-5 h-5 text-gray-400" />
            <input 
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Tạo ghi chú..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-base font-medium"
            />
            <div className="flex items-center gap-1">
              {NOTE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewNoteColor(color)}
                  className={`w-5 h-5 rounded-full border border-gray-200 ${color} ${newNoteColor === color ? 'ring-2 ring-offset-1 ring-emerald-500' : ''}`}
                />
              ))}
            </div>
            <button type="submit" className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
              Tạo
            </button>
          </div>
        </form>

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Được ghim</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {pinnedNotes.map(note => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  updateNoteTitle={updateNoteTitle}
                  saveNoteTitle={saveNoteTitle}
                  togglePinNote={togglePinNote}
                  deleteNote={deleteNote}
                  toggleNoteItem={toggleNoteItem}
                  updateNoteItem={updateNoteItem}
                  addNoteItem={addNoteItem}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Notes */}
        {unpinnedNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Khác</h3>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {unpinnedNotes.map(note => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  updateNoteTitle={updateNoteTitle}
                  saveNoteTitle={saveNoteTitle}
                  togglePinNote={togglePinNote}
                  deleteNote={deleteNote}
                  toggleNoteItem={toggleNoteItem}
                  updateNoteItem={updateNoteItem}
                  addNoteItem={addNoteItem}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCalendarView = () => {
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    let calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
    while (calendarDays.length < 42) {
        calendarDays.push(new Date(calendarDays[calendarDays.length - 1].getTime() + 24 * 60 * 60 * 1000))
    }

    const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    const renderDesktopGrid = () => (
      <div className="hidden md:flex flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-col min-h-[600px] mt-4">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50 shrink-0">
              {WEEKDAYS.map(day => (
                  <div key={day} className="py-3 text-center text-xs font-bold text-gray-500">{day}</div>
              ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-6 flex-1 h-0">
              {calendarDays.map((day, idx) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr)
                  const isCurMonth = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, new Date())

                  return (
                      <div
                          key={day.toString()}
                          onClick={() => { setCalendarAddingDate(dateStr); setSelectedCalendarDate(day); }}
                          className={`border-b border-r border-gray-100 p-2 transition-colors flex flex-col gap-1 overflow-hidden cursor-pointer
                              ${!isCurMonth ? 'bg-gray-50/50' : 'bg-white hover:bg-gray-50'} 
                              ${idx % 7 === 6 ? 'border-r-0' : ''}
                              ${idx >= 35 ? 'border-b-0' : ''}
                          `}
                      >
                          <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-500 text-white' : !isCurMonth ? 'text-gray-400' : 'text-gray-700'}`}>
                                  {format(day, 'd')}
                              </span>
                          </div>

                          <div className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                              {calendarAddingDate === dateStr && (
                                <input 
                                  autoFocus type="text"
                                  className="w-full text-[10px] border border-emerald-300 rounded px-1.5 py-1 mb-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800"
                                  placeholder="Việc mới..."
                                  value={calendarNewTaskTitle}
                                  onChange={e => setCalendarNewTaskTitle(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const title = calendarNewTaskTitle.trim();
                                      setCalendarAddingDate(null);
                                      setCalendarNewTaskTitle('');
                                      if (title) createQuickTask(title, 'todo', dateStr);
                                    } else if (e.key === 'Escape') {
                                      setCalendarAddingDate(null);
                                      setCalendarNewTaskTitle('');
                                    }
                                  }}
                                  onBlur={() => {
                                    const title = calendarNewTaskTitle.trim();
                                    setCalendarAddingDate(null);
                                    setCalendarNewTaskTitle('');
                                    if (title) createQuickTask(title, 'todo', dateStr);
                                  }}
                                />
                              )}
                              {dayTasks.map(task => (
                                  <div
                                      key={task.id}
                                      onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id); }}
                                      className={`text-[10px] px-2 py-1.5 rounded truncate border shadow-sm transition-all
                                          ${task.status === 'done' 
                                            ? 'bg-gray-100/80 text-gray-400 line-through border-gray-100' 
                                            : `${categories[task.category]?.color?.replace('bg-', 'bg-').replace('text-', 'text-') || 'bg-white text-gray-700'} border-emerald-100 hover:shadow`}
                                      `}
                                      title={task.title}
                                  >
                                      {task.title}
                                  </div>
                              ))}
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>
    );

    const renderMobileGrid = () => (
      <div className="md:hidden flex flex-col space-y-4 w-full mt-4">
          <div className="bg-white p-3 pt-4 rounded-2xl border border-gray-200 shadow-sm shrink-0">
              <div className="grid grid-cols-7 mb-3">
                  {WEEKDAYS.map(day => (
                      <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{day}</div>
                  ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                  {calendarDays.map((day) => {
                      const isSelected = isSameDay(day, selectedCalendarDate)
                      const isToday = isSameDay(day, new Date())
                      const isCurMonth = isSameMonth(day, currentMonth)
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr)
                      const hasTasks = dayTasks.length > 0;

                      return (
                          <button
                              key={day.toString()}
                              onClick={() => { setSelectedCalendarDate(day); setCalendarAddingDate(null); }}
                              className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-xl transition-all
                                  ${isSelected ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 scale-105 z-10 font-bold' : 
                                    !isCurMonth ? 'text-gray-300 opacity-50' : 
                                    isToday ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'}
                              `}
                          >
                              <span className="text-[14px] leading-none mb-0.5">{format(day, 'd')}</span>
                              {hasTasks && (
                                  <div className="flex gap-0.5 absolute bottom-1 w-full justify-center">
                                      {dayTasks.slice(0, 3).map((t, i) => {
                                          const dotColor = isSelected ? 'bg-emerald-200' : t.status === 'done' ? 'bg-gray-300' : t.priority === 'high' ? 'bg-red-400' : 'bg-emerald-400';
                                          return <div key={i} className={`w-1 h-1 rounded-full ${dotColor}`} />
                                      })}
                                      {dayTasks.length > 3 && (
                                          <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-emerald-200' : 'bg-gray-300'}`} />
                                      )}
                                  </div>
                              )}
                          </button>
                      )
                  })}
              </div>
          </div>

          <div className="flex-1 space-y-3 pb-8">
              <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-emerald-500" />
                      {format(selectedCalendarDate, 'dd/MM/yyyy')}
                  </h3>
                  <button 
                      onClick={() => setCalendarAddingDate(format(selectedCalendarDate, 'yyyy-MM-dd'))}
                      className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-lg transition-colors"
                  >
                      <Plus className="w-4 h-4" />
                  </button>
              </div>

              {calendarAddingDate === format(selectedCalendarDate, 'yyyy-MM-dd') && (
                  <div className="bg-white p-3 rounded-xl border border-emerald-300 shadow-sm mb-3">
                      <input 
                        autoFocus type="text" 
                        placeholder="Tên công việc mới..." 
                        className="w-full text-sm border-none bg-transparent focus:ring-0 p-0 text-gray-800"
                        value={calendarNewTaskTitle}
                        onChange={e => setCalendarNewTaskTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const title = calendarNewTaskTitle.trim();
                            setCalendarAddingDate(null);
                            setCalendarNewTaskTitle('');
                            if (title) createQuickTask(title, 'todo', format(selectedCalendarDate, 'yyyy-MM-dd'));
                          } else if (e.key === 'Escape') {
                            setCalendarAddingDate(null);
                            setCalendarNewTaskTitle('');
                          }
                        }}
                        onBlur={() => {
                            const title = calendarNewTaskTitle.trim();
                            setCalendarAddingDate(null);
                            setCalendarNewTaskTitle('');
                            if (title) createQuickTask(title, 'todo', format(selectedCalendarDate, 'yyyy-MM-dd'));
                        }}
                      />
                  </div>
              )}

              {(() => {
                  const dateStr = format(selectedCalendarDate, 'yyyy-MM-dd')
                  const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr)
                  
                  if (dayTasks.length === 0 && !calendarAddingDate) {
                      return (
                          <div className="py-12 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-gray-200">
                              <Coffee className="w-8 h-8 text-gray-300 mb-2" />
                              <p className="text-sm font-medium text-gray-500">Trống việc ngày này!</p>
                          </div>
                      )
                  }
                  return dayTasks.map(task => renderTaskCard(task, false));
              })()}
          </div>
      </div>
    );

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                <ChevronRight size={20} />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-gray-800 ml-2 sm:ml-4 capitalize">
                Tháng {format(currentMonth, 'M, yyyy', { locale: vi })}
            </h2>
          </div>
          <button 
              onClick={() => { setCurrentMonth(new Date()); setSelectedCalendarDate(new Date()); }}
              className="px-4 py-2 text-sm font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors border border-gray-200"
          >
              Hôm nay
          </button>
        </div>
        
        {renderDesktopGrid()}
        {renderMobileGrid()}
      </div>
    );
  };

  const renderDashboardView = () => {
    const now = new Date();
    const currentMonthStr = todayStr.substring(0, 7);
    
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    const completedTasks = tasks.filter(t => t.status === 'done');
    const completedToday = completedTasks.filter(t => t.dueDate === todayStr).length;
    const completedThisWeek = completedTasks.filter(t => t.dueDate && t.dueDate >= startOfWeekStr && t.dueDate <= todayStr).length;
    const completedThisMonth = completedTasks.filter(t => t.dueDate?.startsWith(currentMonthStr)).length;

    const categoryStats = Object.values(categories).map((cat: CategoryItem) => {
      const catTasks = tasks.filter(t => t.category === cat.id);
      const completed = catTasks.filter(t => t.status === 'done').length;
      return { ...cat, total: catTasks.length, completed };
    });

    return (
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Hoàn thành hôm nay</h3>
            <div className="text-3xl font-bold text-gray-900">{completedToday}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Hoàn thành tuần này</h3>
            <div className="text-3xl font-bold text-gray-900">{completedThisWeek}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Hoàn thành tháng này</h3>
            <div className="text-3xl font-bold text-gray-900">{completedThisMonth}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Tiến độ theo danh mục</h3>
            {!showDashboardAddCat && (
              <button 
                onClick={() => setShowDashboardAddCat(true)}
                className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm danh mục
              </button>
            )}
          </div>

          {showDashboardAddCat && (
            <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-xl shadow-sm ${dashboardCatColor}`}>
                  {dashboardCatIcon}
                </div>
                <input 
                  autoFocus
                  type="text" 
                  value={dashboardCatName}
                  onChange={e => setDashboardCatName(e.target.value)}
                  placeholder="Nhập tên danh mục mới..."
                  className="flex-1 bg-white border border-gray-200 text-sm text-gray-900 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); handleDashboardAddCat(); }
                    if (e.key === 'Escape') setShowDashboardAddCat(false);
                  }}
                />
                <div className="flex items-center gap-2">
                  <button onClick={handleDashboardAddCat} disabled={!dashboardCatName.trim()} className="flex-1 sm:flex-none text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">Lưu</button>
                  <button onClick={() => setShowDashboardAddCat(false)} className="flex-1 sm:flex-none text-gray-600 bg-gray-200 hover:bg-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">Huỷ</button>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-lg border border-gray-200">
                  {SUGGESTED_ICONS.map(icon => (
                    <button key={icon} onClick={() => setDashboardCatIcon(icon)} className={`w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors ${dashboardCatIcon === icon ? 'bg-gray-100 scale-110 shadow-sm' : ''}`}>
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                  {SUGGESTED_COLORS.map(color => (
                    <button key={color} onClick={() => setDashboardCatColor(color)} className={`w-6 h-6 rounded-full border-2 transition-transform ${dashboardCatColor === color ? 'border-gray-400 scale-110 shadow-sm' : 'border-transparent'} ${color.split(' ')[0]}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {categoryStats.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Chưa có dữ liệu công việc.</p>
            ) : (
              categoryStats.map(stat => (
                <div key={stat.id}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium flex items-center gap-2 text-gray-700">
                      <span>{stat.icon}</span> {stat.label}
                    </span>
                    <span className="text-gray-500 font-medium">{stat.completed} / {stat.total}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${stat.color.split(' ')[0]} transition-all duration-1000`} 
                      style={{ width: `${stat.total === 0 ? 0 : (stat.completed / stat.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      {/* Hero Section - The "Hook" */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-6 sm:py-8 flex-shrink-0 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-70 pointer-events-none"></div>
        
        <div className="relative w-full max-w-[2000px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <greeting.icon className={`w-5 h-5 ${greeting.color}`} />
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{greeting.text}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Hôm nay của bạn thế nào?
            </h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Không gian riêng tư. Dữ liệu được bảo mật.
            </p>
          </div>

          {/* Gamification Progress */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray={`${progressPercent}, 100`} className="transition-all duration-1000 ease-out" />
              </svg>
              <span className="absolute text-sm font-bold text-gray-700">{progressPercent}%</span>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">Tiến độ hôm nay</div>
              <div className="text-xs text-gray-500">{completedToday} / {todayTasks.length} công việc hoàn thành</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Quick Add */}
      <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-gray-200/50 rounded-xl w-full sm:w-auto">
            <button 
              onClick={() => setViewMode('focus')}
              className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-5 rounded-lg transition-all ${viewMode === 'focus' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Star className="w-5 h-5 sm:w-4 sm:h-4" /> 
              <span className="text-[10px] sm:text-sm font-semibold leading-none sm:leading-normal">
                <span className="sm:hidden">Focus</span>
                <span className="hidden sm:inline">Focus Hôm nay</span>
              </span>
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid className="w-5 h-5 sm:w-4 sm:h-4" /> 
              <span className="text-[10px] sm:text-sm font-semibold leading-none sm:leading-normal">
                <span className="sm:hidden">Kanban</span>
                <span className="hidden sm:inline">Bảng Kanban</span>
              </span>
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarIcon className="w-5 h-5 sm:w-4 sm:h-4" /> 
              <span className="text-[10px] sm:text-sm font-semibold leading-none sm:leading-normal">Lịch</span>
            </button>
            <button 
              onClick={() => setViewMode('dashboard')}
              className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-5 rounded-lg transition-all ${viewMode === 'dashboard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <BarChart2 className="w-5 h-5 sm:w-4 sm:h-4" /> 
              <span className="text-[10px] sm:text-sm font-semibold leading-none sm:leading-normal">
                <span className="sm:hidden">Chart</span>
                <span className="hidden sm:inline">Thống kê</span>
              </span>
            </button>
            <button 
              onClick={() => setViewMode('notes')}
              className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-5 rounded-lg transition-all ${viewMode === 'notes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FileText className="w-5 h-5 sm:w-4 sm:h-4" /> 
              <span className="text-[10px] sm:text-sm font-semibold leading-none sm:leading-normal">
                <span className="sm:hidden">Note</span>
                <span className="hidden sm:inline">Ghi chú</span>
              </span>
            </button>
          </div>
        </div>

        {/* Smart Quick Add */}
        {viewMode === 'focus' && (
          <form onSubmit={handleAddTask} className="bg-white p-2 sm:p-3 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-3 transition-all focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent mb-8">
            <div className="flex-1 flex items-center gap-3 w-full px-2">
              <Plus className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Thêm việc mới (VD: Mua hoa tặng vợ...)"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full py-2 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-base"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-3">
              {showAddCategory ? (
                <div className="flex items-center gap-1 flex-1 sm:flex-none">
                  <input 
                    autoFocus
                    type="text" 
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Tên danh mục..."
                    className="w-28 sm:w-32 bg-gray-50 border border-gray-200 text-sm text-gray-600 rounded-lg py-1.5 px-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
                      if (e.key === 'Escape') setShowAddCategory(false);
                    }}
                  />
                  <button type="button" onClick={handleAddCategory} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"><CheckCircle2 className="w-4 h-4"/></button>
                  <button type="button" onClick={() => setShowAddCategory(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <div className="flex items-center gap-1 flex-1 sm:flex-none">
                  <select 
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full bg-gray-50 border-none text-sm text-gray-600 rounded-lg py-2 px-3 focus:ring-0 cursor-pointer"
                  >
                    {Object.values(categories).map((cat: CategoryItem) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setShowAddCategory(true)}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Thêm danh mục"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input 
                type="date"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                className="flex-1 sm:flex-none bg-gray-50 border border-gray-200 text-sm text-gray-600 rounded-lg py-2 px-3 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
              <button 
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="flex-shrink-0 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-200"
              >
                Thêm
              </button>
            </div>
          </form>
        )}

        {/* Content Area */}
        {viewMode === 'notes' ? (
          renderNotesView()
        ) : viewMode === 'dashboard' ? (
          renderDashboardView()
        ) : viewMode === 'calendar' ? (
          renderCalendarView()
        ) : viewMode === 'focus' ? (
          <div className="space-y-8 pb-12">
            {/* Today's Focus */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-100" /> Tiêu điểm hôm nay
              </h2>
              {todayTasks.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Coffee className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900 font-medium">Hôm nay bạn rảnh rỗi!</h3>
                  <p className="text-gray-500 text-sm mt-1">Hãy dành thời gian nghỉ ngơi hoặc thêm việc mới nhé.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayTasks.map(task => renderTaskCard(task, false))}
                </div>
              )}
            </div>

            {/* Upcoming / Other */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-500" /> Sắp tới & Khác
              </h2>
              <div className="space-y-3">
                {filteredTasks.filter(t => t.dueDate !== todayStr).map(task => renderTaskCard(task, false))}
                {filteredTasks.filter(t => t.dueDate !== todayStr).length === 0 && (
                  <p className="text-sm text-gray-500 italic">Không có công việc nào khác.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Category-Based Board View (Kanban) */
          <div className="flex xl:grid xl:grid-cols-5 gap-4 sm:gap-6 pb-8 min-h-[500px] overflow-x-auto xl:overflow-visible no-scrollbar snap-x xl:snap-none items-start">
            {Object.values(categories).map((cat: CategoryItem) => {
              const catTasks = filteredTasks.filter(t => t.category === cat.id);
              const activeTasks = catTasks.filter(t => t.status !== 'done' && t.status !== 'archived');
              const doneTasks = catTasks.filter(t => t.status === 'done');
              const isDoneExpanded = expandedDoneCols[cat.id] || false;
              
              const handleKanbanInputConfirm = () => {
                const currentTitle = kanbanNewTaskTitle.trim();
                const currentDesc = kanbanNewTaskDesc.trim();
                const currentDate = kanbanNewTaskDate;
                
                if (currentTitle) {
                  createQuickTask(currentTitle, 'todo', currentDate, cat.id, currentDesc || null);
                }
                
                setKanbanAddingCategory(null);
                setKanbanNewTaskTitle('');
                setKanbanNewTaskDesc('');
                setKanbanNewTaskDate(null);
              };

              const handleDropCategory = async (e: React.DragEvent, categoryId: string) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('taskId');
                if (taskId) {
                  updateTaskField(taskId, 'category', categoryId, 'category_id');
                }
              };

              const headerBgColor = cat.color?.replace('text-', 'bg-').replace('600', '100') || 'bg-gray-100';
              const headerTextColor = cat.color || 'text-gray-800';

              return (
                <div 
                  key={cat.id}
                  className={`w-[85vw] sm:w-[340px] xl:w-auto flex-shrink-0 flex flex-col rounded-3xl snap-center xl:snap-none border border-gray-200 bg-gray-50/30 shadow-sm`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropCategory(e, cat.id)}
                >
                  {/* Column Header */}
                  <div className={`p-4 sm:p-5 flex items-center justify-between rounded-t-3xl border-b border-gray-200/50 ${headerBgColor} bg-opacity-50`}>
                    <div className="flex items-center gap-3">
                       <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg bg-white shadow-sm border border-gray-100 ${headerTextColor}`}>
                         {cat.icon}
                       </span>
                       <h3 className={`font-extrabold text-[15px] uppercase tracking-wide ${headerTextColor}`}>{cat.label}</h3>
                    </div>
                  </div>

                  {/* Column Body */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar h-auto max-h-[70vh]">
                     
                     {/* Add task button inline */}
                     {!kanbanAddingCategory || kanbanAddingCategory !== cat.id ? (
                        <button 
                          onClick={() => setKanbanAddingCategory(cat.id)}
                          className="w-full py-3 flex items-center gap-2 text-[15px] font-semibold text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all border border-dashed border-gray-300 hover:border-emerald-300"
                        >
                          <Plus className="w-5 h-5 ml-2" /> Thêm việc cần làm
                        </button>
                     ) : (
                        <div className="bg-white p-3 rounded-xl border border-emerald-400 shadow-sm mb-3 focus-within:ring-2 focus-within:ring-emerald-100 transition-shadow">
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="Tên công việc..." 
                            className="w-full text-base border-none bg-transparent focus:ring-0 p-0 text-gray-900 font-bold mb-2 placeholder-gray-400"
                            value={kanbanNewTaskTitle}
                            onChange={e => setKanbanNewTaskTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleKanbanInputConfirm();
                              } else if (e.key === 'Escape') {
                                setKanbanAddingCategory(null);
                                setKanbanNewTaskTitle('');
                                setKanbanNewTaskDesc('');
                                setKanbanNewTaskDate(null);
                              }
                            }}
                          />
                          <textarea
                            placeholder="Chi tiết..."
                            rows={1}
                            className="w-full text-sm border-none bg-transparent focus:ring-0 p-0 text-gray-600 resize-none overflow-hidden placeholder-gray-400 mb-3"
                            value={kanbanNewTaskDesc}
                            onChange={(e) => {
                               e.target.style.height = 'auto';
                               e.target.style.height = `${e.target.scrollHeight}px`;
                               setKanbanNewTaskDesc(e.target.value);
                            }}
                            onFocus={(e) => {
                               e.target.style.height = 'auto';
                               e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                          />
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => setKanbanNewTaskDate(todayStr)}
                               className={`px-3 py-1 rounded-full border text-xs font-semibold hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors ${kanbanNewTaskDate === todayStr ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-transparent border-gray-200 text-gray-600'}`}
                             >
                               Hôm nay
                             </button>
                             <button 
                               onClick={() => {
                                 const tmr = new Date();
                                 tmr.setDate(tmr.getDate() + 1);
                                 setKanbanNewTaskDate(tmr.toISOString().split('T')[0]);
                               }}
                               className={`px-3 py-1 rounded-full border text-xs font-semibold hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors ${kanbanNewTaskDate && kanbanNewTaskDate !== todayStr ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-transparent border-gray-200 text-gray-600'}`}
                             >
                               Ngày mai
                             </button>
                             <div className="relative">
                               <input 
                                 type="date"
                                 className="absolute opacity-0 inset-0 cursor-pointer w-full h-full"
                                 onChange={(e) => setKanbanNewTaskDate(e.target.value)}
                               />
                               <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                                 <CalendarIcon className="w-3.5 h-3.5" />
                               </button>
                             </div>
                             <div className="flex-1"></div>
                             <button
                               onClick={() => {
                                 setKanbanAddingCategory(null);
                                 setKanbanNewTaskTitle('');
                                 setKanbanNewTaskDesc('');
                                 setKanbanNewTaskDate(null);
                               }}
                               className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                             >
                               <X className="w-4 h-4" />
                             </button>
                             <button
                               onClick={handleKanbanInputConfirm}
                               disabled={!kanbanNewTaskTitle.trim()}
                               className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                             >
                               Thêm
                             </button>
                          </div>
                        </div>
                     )}

                     {/* Active Tasks */}
                     {activeTasks.map(task => renderTaskCard(task, true))}
                     
                     {/* Done Tasks Accordion */}
                     {doneTasks.length > 0 && (
                        <div className="mt-6 pt-3 border-t border-gray-200/60">
                           <button 
                             onClick={() => setExpandedDoneCols(prev => ({...prev, [cat.id]: !prev[cat.id]}))}
                             className="w-full flex items-center gap-2 py-2 px-1 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors rounded-lg group"
                           >
                              <ChevronRight className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform ${isDoneExpanded ? 'rotate-90' : ''}`} />
                              Đã hoàn thành ({doneTasks.length})
                           </button>
                           {isDoneExpanded && (
                             <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2">
                                {doneTasks.map(task => renderTaskCard(task, true))}
                             </div>
                           )}
                        </div>
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editing Task Modal Overlay */}
      {editingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => toggleTaskStatus(editingTask.id)}
                   className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${editingTask.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent hover:border-emerald-400'}`}
                 >
                   <CheckCircle2 className="w-4 h-4" />
                 </button>
                 <select
                   value={editingTask.category}
                   onChange={(e) => updateTaskField(editingTask!.id, 'category', e.target.value, 'category_id')}
                   className="text-xs font-bold text-gray-500 uppercase bg-gray-100/50 hover:bg-gray-100 px-2 py-1 rounded-lg border-none focus:ring-0 cursor-pointer"
                 >
                   {Object.values(categories).map((c: CategoryItem) => (
                     <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                   ))}
                 </select>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={() => { handleDeleteTask(editingTask.id); setEditingTask(null); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                   <Trash2 className="w-5 h-5" />
                 </button>
                 <button onClick={() => setEditingTask(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                   <X className="w-5 h-5" />
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div>
                <input
                  type="text"
                  value={editingTask.title || ''}
                  onChange={(e) => updateTaskField(editingTask!.id, 'title', e.target.value, 'title')}
                  placeholder="Tên công việc..."
                  className="w-full text-2xl font-bold border-none bg-transparent focus:ring-0 p-0 text-gray-900 placeholder-gray-300"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
                 <div className="flex-1 space-y-5">
                    
                    <div>
                       <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-2">
                         <FileText className="w-4 h-4" /> Chi tiết
                       </label>
                       <textarea
                         value={editingTask.description || ''}
                         onChange={(e) => {
                             e.target.style.height = 'auto';
                             e.target.style.height = `${e.target.scrollHeight}px`;
                             updateTaskField(editingTask!.id, 'description', e.target.value, 'description');
                         }}
                         placeholder="Thêm mô tả chi tiết cho công việc này..."
                         className="w-full text-sm border border-gray-200 rounded-xl p-4 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none min-h-[120px] text-gray-800"
                       />
                    </div>
                    
                 </div>
                 
                 <div className="w-full sm:w-64 space-y-5">
                    <div>
                       <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-2">
                         <CalendarIcon className="w-4 h-4" /> Hạn chót
                       </label>
                       <input
                         type="date"
                         value={editingTask.dueDate || ''}
                         onChange={(e) => updateTaskField(editingTask!.id, 'dueDate', e.target.value || null, 'due_date')}
                         className="w-full text-sm border border-gray-200 rounded-xl p-2.5 bg-gray-50/50 hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-800"
                       />
                    </div>
                 </div>
              </div>

            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
               <button onClick={() => setEditingTask(null)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm">Xong</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
