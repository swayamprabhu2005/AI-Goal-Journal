export default function Card({ children, className = '', as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={`rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover-lift ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
