import type { ReactNode } from "react";
export function Field({
  name,
  label,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      {label}
      <input name={name} type={type} required={required} maxLength={254} />
    </label>
  );
}
export function SelectField({
  name,
  label,
  options,
  optional = false,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  optional?: boolean;
}) {
  return (
    <label>
      {label}
      <select name={name} required={!optional}>
        <option value="">
          {optional ? "Sem unidade (âmbito global autorizado)" : "Seleccionar…"}
        </option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function AdminHeading({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">Organização e acessos · Fase 1</p>
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
    </div>
  );
}
