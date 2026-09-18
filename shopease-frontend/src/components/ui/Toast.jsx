export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`rounded-lg px-4 py-3 shadow-lg flex items-center justify-between text-white w-72 transition-all duration-300 ${t.type === 'error' ? 'bg-rose-600' : t.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
          <span className="text-sm font-medium">{t.message}</span>
          <button type="button" onClick={() => onRemove(t.id)} className="ml-4 opacity-70 hover:opacity-100">
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}
