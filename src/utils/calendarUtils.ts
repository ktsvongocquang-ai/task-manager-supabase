import { Task } from '../types';

export const openGoogleCalendar = (task: Task) => {
    const title = encodeURIComponent(task.name || '');
    const details = encodeURIComponent(
        [task.task_code, task.description || ''].filter(Boolean).join('\n')
    );
    const startDate = (task.start_date || task.due_date || '').substring(0, 10).replace(/-/g, '');
    const endDate = task.due_date
        ? (() => { 
            const d = new Date(task.due_date); 
            d.setDate(d.getDate() + 1); 
            return d.toISOString().substring(0, 10).replace(/-/g, ''); 
          })()
        : startDate;
    
    let url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&details=${details}`;
    if (startDate) {
        url += `&dates=${startDate}/${endDate}`;
    }
    window.open(url, '_blank');
};
