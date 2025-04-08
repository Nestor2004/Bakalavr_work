import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string;
  textarea?: boolean;
  select?: boolean;
  options?: { value: string; label: string }[];
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, InputProps>(
  function Input({ label, textarea, select, options = [], ...props }, ref) {
    const classes =
      'w-full p-1 border-b-2 rounded-sm border-stone-300 bg-stone-200 text-stone-600 focus:outline-none focus:border-stone-600';

    return (
      <p className="flex flex-col gap-1 my-4">
        <label className="text-sm font-bold uppercase text-stone-500">{label}</label>
        {textarea ? (
          <textarea ref={ref as React.Ref<HTMLTextAreaElement>} className={classes} {...props} />
        ) : select ? (
          <select ref={ref as React.Ref<HTMLSelectElement>} className={classes} {...props}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input ref={ref as React.Ref<HTMLInputElement>} className={classes} {...props} />
        )}
      </p>
    );
  }
);

export default Input;
