type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
};

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className = "",
}: FilterSelectProps) {
  return (
    <div className={`filtro-campo${className ? ` ${className}` : ""}`}>
      <label>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
