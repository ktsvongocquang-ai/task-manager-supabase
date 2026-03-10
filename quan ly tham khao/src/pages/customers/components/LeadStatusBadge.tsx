import React from 'react';

type Status = 'Mới' | 'Đang thuyết phục' | 'Đã chốt' | 'Thất bại';

interface Props {
  status: Status;
}

export default function LeadStatusBadge({ status }: Props) {
  const colors = {
    'Mới': 'bg-cyan-100 text-cyan-800',
    'Đang thuyết phục': 'bg-purple-100 text-purple-800',
    'Đã chốt': 'bg-green-100 text-green-800',
    'Thất bại': 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}
