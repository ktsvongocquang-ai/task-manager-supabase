import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Check, Edit2, Trash2 } from 'lucide-react';

interface SwipeableItemProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void; // Done action
  onSwipeRight?: () => void; // Edit/Delete action
  swipeLeftIcon?: React.ReactNode;
  swipeRightIcon?: React.ReactNode;
  swipeLeftLabel?: string;
  swipeRightLabel?: string;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeLeftIcon = <Check size={20} />,
  swipeRightIcon = <><Trash2 size={20} /> <Edit2 size={20} className="ml-2 text-indigo-500"/></>,
  swipeLeftLabel = 'Hoàn thành',
  swipeRightLabel = ''
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
               {swipeRightIcon} {swipeRightLabel}
            </div>
            {/* Right Action (Swipe Left) */}
            <div className={`flex items-center gap-2 text-emerald-500 font-bold opacity-0 transition-opacity ${swipeOffset < -20 ? 'opacity-100' : ''}`}>
                {swipeLeftLabel} {swipeLeftIcon}
            </div>
        </div>

        {/* Foreground Content */}
        <div 
            {...handlers}
            style={{ transform: `translateX(${swipeOffset}px)` }}
            className={`relative bg-white rounded-2xl border border-slate-200 shadow-sm cursor-pointer ${isSwiping ? 'transition-none' : 'transition-transform duration-300'} hover:border-indigo-300 hover:shadow-md h-full flex flex-col`}
        >
            {children}
        </div>
    </div>
  );
};
