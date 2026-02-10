import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyle = "px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md";
  
  const variants = {
    // New Red #e32b2d with a hover state
    primary: "bg-[#e32b2d] hover:bg-[#c42527] text-white border border-transparent shadow-[0_0_15px_rgba(227,43,45,0.2)]",
    secondary: "bg-[#403e3f] hover:bg-[#4d4b4c] text-slate-200 border border-[#504e4f]",
    danger: "bg-red-900/50 hover:bg-red-900/70 text-red-200 border border-red-800"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};