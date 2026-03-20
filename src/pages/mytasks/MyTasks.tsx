import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Calendar as CalendarIcon, 
  CheckCircle2, Circle, Lock, Trash2, RefreshCw,
  Sun, Moon, Coffee, Star, Flag, LayoutGrid, 
  BarChart2, X, FileText, Pin, CheckSquare, Square, Archive
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

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

const PRIORITIES: Record<Priority, { label: string, icon: any, color: string }> = {
  high: { label: 'Cao', icon: Flag, color: 'text-red-500' },
  medium: { label: 'Trung bình', icon: Flag, color: 'text-yellow-500' },
  low: { label: 'Thấp', icon: Flag, color: 'text-blue-500' },
  none: { label: 'Không', icon: Flag, color: 'text-gray-300' },
};

// Removed initial data constants

export default function MyTasks() {
  const { profile } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Record<string, CategoryItem>>({});
  const [viewMode, setViewMode] = useState<'focus' | 'kanban' | 'calendar' | 'dashboard' | 'notes'>('focus');
  const [searchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showArchived, setShowArchived] = useState(false);

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
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('none');
  
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
        due_date: viewMode === 'focus' ? todayStr : null,
        category_id: newTaskCategory,
        priority: newTaskPriority
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
      setNewTaskPriority('none');
    } catch (err) {
      console.error('Error adding task', err);
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
  const handleDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData('taskId', taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    setTasks(tasks.map(task => task.id === taskId ? { ...task, status } : task));
    await supabase.from('personal_tasks').update({ status }).eq('id', taskId);
  };

  const renderTaskCard = (task: Task, isKanban = false) => {
    const PriorityIcon = PRIORITIES[task.priority].icon;
    const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'done';
    const cat = categories[task.category] || categories['personal'];

    return (
      <div 
        key={task.id}
        draggable={isKanban}
        onDragStart={(e) => isKanban && handleDragStart(e, task.id)}
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
          <h4 className={`font-medium transition-all ${
            task.status === 'done' || task.status === 'archived' ? 'text-gray-400 line-through' : 'text-gray-800'
          } ${isKanban ? 'text-sm mb-3' : 'text-base mb-1.5'}`}>
            {task.title}
          </h4>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${cat.color}`}>
              <span>{cat.icon}</span>
              {cat.label}
            </span>
            
            {task.priority !== 'none' && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${PRIORITIES[task.priority].color}`}>
                <PriorityIcon className="w-3 h-3" />
                {PRIORITIES[task.priority].label}
              </span>
            )}

            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                isOverdue ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md' : 'text-gray-500'
              }`}>
                <CalendarIcon className="w-3 h-3" />
                {task.dueDate === todayStr ? 'Hôm nay' : new Date(task.dueDate).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {task.status === 'done' && (
            <button 
              onClick={() => handleArchiveTask(task.id)}
              className={`text-gray-300 hover:text-blue-500 transition-colors ${
                isKanban ? 'absolute top-4 right-10 opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100 p-2'
              }`}
              title="Lưu trữ"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
          {task.status === 'archived' && (
            <button 
              onClick={() => handleUnarchiveTask(task.id)}
              className={`text-gray-300 hover:text-blue-500 transition-colors ${
                isKanban ? 'absolute top-4 right-10 opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100 p-2'
              }`}
              title="Khôi phục"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => handleDeleteTask(task.id)}
            className={`text-gray-300 hover:text-red-500 transition-colors ${
              isKanban ? 'absolute top-4 right-4 opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100 p-2'
            }`}
            title="Xoá"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderNotesView = () => {
    const pinnedNotes = notes.filter(n => n.isPinned);
    const unpinnedNotes = notes.filter(n => !n.isPinned);

    const NoteCard = ({ note }: { note: Note }) => {
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
                  <input 
                    type="text"
                    value={item.text}
                    onChange={(e) => updateNoteItem(note.id, item.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addNoteItem(note.id);
                      }
                    }}
                    placeholder="Mục danh sách..."
                    className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-gray-700 text-sm"
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
                        <button onClick={() => toggleNoteItem(note.id, item.id)} className="mt-1 text-gray-600">
                          <CheckSquare className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-sm text-gray-700 line-through">{item.text}</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
            </div>
          </div>
        )}

        {/* Other Notes */}
        {unpinnedNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Khác</h3>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {unpinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCalendarView = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const startingDay = firstDay === 0 ? 6 : firstDay - 1; // Make Monday = 0
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-gray-50/50 border-r border-b border-gray-100 p-2"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr);
      const isToday = dateStr === todayStr;
      
      days.push(
        <div key={i} className={`min-h-[120px] bg-white border-r border-b border-gray-200 p-2 transition-colors hover:bg-gray-50 ${isToday ? 'bg-emerald-50/30' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' : 'text-gray-700'}`}>
              {i}
            </span>
          </div>
          <div className="space-y-1.5">
            {dayTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => toggleTaskStatus(task.id)}
                className={`text-xs p-1.5 rounded-md truncate cursor-pointer transition-all ${
                  task.status === 'done' 
                    ? 'bg-gray-100 text-gray-400 line-through' 
                    : `${categories[task.category]?.color || 'bg-gray-100 text-gray-700'} bg-opacity-50 hover:opacity-80`
                }`}
                title={task.title}
              >
                {task.status === 'done' ? '✓ ' : ''}{task.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 capitalize">
            Tháng {month + 1}, {year}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              &lt;
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Hôm nay
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
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
        
        <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
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
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-gray-200/50 rounded-xl w-full sm:w-auto">
            <button 
              onClick={() => setViewMode('focus')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'focus' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Star className="w-4 h-4" /> Focus Hôm nay
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Bảng Kanban
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarIcon className="w-4 h-4" /> Lịch
            </button>
            <button 
              onClick={() => setViewMode('dashboard')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'dashboard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <BarChart2 className="w-4 h-4" /> Thống kê
            </button>
            <button 
              onClick={() => setViewMode('notes')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'notes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FileText className="w-4 h-4" /> Ghi chú
            </button>
          </div>
        </div>

        {/* Smart Quick Add */}
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
            <select 
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
              className="flex-1 sm:flex-none bg-gray-50 border-none text-sm text-gray-600 rounded-lg py-2 px-3 focus:ring-0 cursor-pointer"
            >
              <option value="none">Độ ưu tiên</option>
              <option value="high">🔴 Cao</option>
              <option value="medium">🟡 Trung bình</option>
              <option value="low">🔵 Thấp</option>
            </select>
            <button 
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="flex-shrink-0 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-200"
            >
              Thêm
            </button>
          </div>
        </form>

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
          /* Kanban View */
          <div className="flex gap-6 overflow-x-auto pb-8 min-h-[500px]">
            {[
              { id: 'todo', title: 'Cần làm', color: 'bg-slate-100/50 border-slate-200' },
              { id: 'in-progress', title: 'Đang làm', color: 'bg-blue-50/50 border-blue-100' },
              { id: 'done', title: 'Hoàn thành', color: 'bg-emerald-50/50 border-emerald-100' }
            ].map(column => {
              const columnTasks = filteredTasks.filter(t => t.status === column.id);
              return (
                <div 
                  key={column.id}
                  className={`w-80 flex-shrink-0 flex flex-col rounded-2xl border ${column.color}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id as TaskStatus)}
                >
                  <div className="p-4 flex items-center justify-between">
                    <h3 className="font-bold text-gray-700">{column.title}</h3>
                    <div className="flex items-center gap-2">
                      {column.id === 'done' && (
                        <button 
                          onClick={() => setShowArchived(!showArchived)}
                          className={`p-1 rounded-md transition-colors ${showArchived ? 'bg-emerald-200 text-emerald-800' : 'text-gray-400 hover:bg-black/5'}`}
                          title={showArchived ? "Ẩn lưu trữ" : "Hiện lưu trữ"}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <span className="px-2.5 py-0.5 bg-white text-gray-600 text-xs font-bold rounded-full shadow-sm">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {columnTasks.map(task => renderTaskCard(task, true))}
                    
                    {/* Show Archived Tasks in Done column if toggled */}
                    {column.id === 'done' && showArchived && (
                      <>
                        <div className="pt-4 pb-2 border-t border-emerald-200/50 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800/60 uppercase tracking-wider">Đã lưu trữ</span>
                          <span className="text-xs text-emerald-800/60">{filteredTasks.filter(t => t.status === 'archived').length}</span>
                        </div>
                        {filteredTasks.filter(t => t.status === 'archived').map(task => renderTaskCard(task, true))}
                      </>
                    )}

                    {columnTasks.length === 0 && (
                      <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-300/50 rounded-xl text-sm text-gray-400">
                        Kéo thả vào đây
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
