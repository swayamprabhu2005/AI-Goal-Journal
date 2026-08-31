export default function Card({ children, className = '', as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={`rounded-card border border-border bg-surface p-5 shadow-card transition-all duration-150 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
