import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Check, Edit2, Trash2 } from 'lucide-react';

interface SmartCardProps {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusColor?: string;
  avatarInitials?: string;
  progress?: number;
  deadline?: string;
  state?: 'compact' | 'medium' | 'full';
  onClick?: () => void;
  onSwipeLeft?: () => void; // Done action
  onSwipeRight?: () => void; // Edit/Delete action
}

export const SmartCard: React.FC<SmartCardProps> = ({
  title,
  subtitle,
  status,
  statusColor = 'bg-gray-100 text-gray-700',
  avatarInitials,
  progress,
  deadline,
  state = 'medium',
  onClick,
  onSwipeLeft,
  onSwipeRight
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (event) => {
      setIsSwiping(true);
      // Limit swipe distance
      const offset = event.deltaX;
      if (offset > 100) setSwipeOffset(100);
      else if (offset < -100) setSwipeOffset(-100);
      else setSwipeOffset(offset);
    },
    onSwiped: (event) => {
      setIsSwiping(false);
      setSwipeOffset(0);
      
      if (event.deltaX < -60 && onSwipeLeft) {
        onSwipeLeft(); // Swiped left -> Complete
      } else if (event.deltaX > 60 && onSwipeRight) {
        onSwipeRight(); // Swiped right -> Edit/Delete
      }
    },
    trackMouse: true
  });

  return (
    <div className="relative overflow-hidden rounded-2xl mb-3">
        {/* Swipe Action Backgrounds */}
        <div className="absolute inset-0 flex justify-between items-center px-6 rounded-2xl bg-slate-100">
            {/* Left Action (Swipe Right) */}
            <div className={`flex items-center gap-2 text-rose-500 font-bold opacity-0 transition-opacity ${swipeOffset > 20 ? 'opacity-100' : ''}`}>
               <Trash2 size={20} /> <Edit2 size={20} className="ml-2 text-indigo-500"/>
            </div>
            {/* Right Action (Swipe Left) */}
            <div className={`flex items-center gap-2 text-emerald-500 font-bold opacity-0 transition-opacity ${swipeOffset < -20 ? 'opacity-100' : ''}`}>
                Hoàn thành <Check size={20} />
            </div>
        </div>

        {/* Foreground Card */}
        <div 
            {...handlers}
            onClick={onClick}
            style={{ transform: `translateX(${swipeOffset}px)` }}
            className={`relative bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-pointer ${isSwiping ? 'transition-none' : 'transition-transform duration-300'} hover:border-indigo-300 hover:shadow-md h-full flex flex-col`}
        >
            <div className="flex justify-between items-start gap-4 mb-2">
                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-slate-800 ${state === 'compact' ? 'truncate text-sm' : 'text-base leading-tight line-clamp-2'}`}>
                        {title}
                    </h4>
                    {subtitle && (
                        <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>
                    )}
                </div>
                {status && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${statusColor}`}>
                        {status}
                    </span>
                )}
            </div>

            {state !== 'compact' && (
                <div className="mt-auto pt-3 flex flex-col gap-3">
                   {/* Progress Bar */}
                   {progress !== undefined && (
                        <div className="w-full">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                <span>Tiến độ</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 rounded-full" 
                                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                                />
                            </div>
                        </div>
                   )}

                   {/* Footer: Avatar & Deadline */}
                   <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
                        {deadline ? (
                            <span className="text-xs font-semibold text-slate-500">{deadline}</span>
                        ) : <span></span>}
                        
                        {avatarInitials && (
                            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-bold border border-indigo-100">
                                {avatarInitials}
                            </div>
                        )}
                   </div>
                </div>
            )}
        </div>
    </div>
  );
};
