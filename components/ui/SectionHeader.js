export default function SectionHeader({
  title,
  subtitle,
  className = "",
  titleClassName = "",
  subtitleClassName = "",
  ...props
}) {
  return (
    <div
      className={`text-center max-w-3xl mx-auto mb-12 ${className}`}
      {...props}
    >
      <h3
        className={`text-3xl md:text-4xl font-black text-slate-900 font-title ${titleClassName}`}
      >
        {title}
      </h3>
      {subtitle && (
        <div
          className={`text-slate-600 mt-4 font-medium text-base leading-relaxed ${subtitleClassName}`}
        >
          {subtitle}
        </div>
      )}
    </div>
  )
}
