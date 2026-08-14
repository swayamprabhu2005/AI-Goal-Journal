export default function Card({ children, className = '', as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={`rounded-card border border-card-border bg-card-grad p-5 shadow-soft transition-all duration-150 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
