import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient' | 'glass';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  variant = 'default',
  hover = false,
  ...props 
}) => {
  const baseClasses = 'rounded-xl transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm hover:shadow-md',
    elevated: 'bg-white shadow-lg hover:shadow-xl border-0',
    bordered: 'bg-white border-2 border-gray-300 shadow-none hover:shadow-sm',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-md hover:shadow-lg',
    glass: 'glass-effect shadow-lg hover:shadow-xl'
  };
  
  const hoverClasses = hover ? 'hover-lift cursor-pointer' : '';
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className} animate-fade-in`}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className = '',
  gradient = false
}) => {
  const gradientClasses = gradient ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : '';
  
  return (
    <div className={`px-6 py-5 border-b border-gray-100 ${gradientClasses} ${className} rounded-t-xl`}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardContent: React.FC<CardContentProps> = ({ 
  children, 
  className = '',
  padding = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'px-6 py-4',
    lg: 'px-8 py-6'
  };
  
  return (
    <div className={`${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({ 
  children, 
  className = '',
  gradient = false
}) => {
  const gradientClasses = gradient ? 'bg-gradient-to-r from-gray-50 to-blue-50' : 'bg-gray-50';
  
  return (
    <div className={`px-6 py-4 border-t border-gray-100 ${gradientClasses} ${className} rounded-b-xl`}>
      {children}
    </div>
  );
};
