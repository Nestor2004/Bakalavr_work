import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export default function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 text-xs md:text-base rounded-md bg-stone-700 text-stone-400 
                  hover:bg-stone-600 hover:text-stone-100 ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
