export default function StatusBadge({ status, priority }) {
  const statusStyles = {
    open:        'bg-red-100    text-red-700    border-red-200',
    in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    resolved:    'bg-green-100  text-green-700  border-green-200',
  };
  const priorityStyles = {
    P1: 'bg-red-600    text-white',
    P2: 'bg-orange-500 text-white',
    P3: 'bg-blue-500   text-white',
  };

  return (
    <div className="flex gap-1 items-center flex-wrap">
      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                        ${statusStyles[status] || statusStyles.open}`}>
        {status?.replace('_', ' ').toUpperCase() || 'OPEN'}
      </span>
      {priority && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                          ${priorityStyles[priority] || priorityStyles.P3}`}>
          {priority}
        </span>
      )}
    </div>
  );
}
