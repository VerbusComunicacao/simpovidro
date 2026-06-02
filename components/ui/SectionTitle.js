export default function SectionTitle({ children, className = "", ...props }) {
  return (
    <h3
      className={`text-4xl md:text-5xl font-black text-slate-900 font-title ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}
