import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

type FieldStatus = 'default' | 'error' | 'success' | 'disabled';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  status?: FieldStatus;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  optional?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      successMessage,
      status = 'default',
      leftIcon,
      rightIcon,
      optional,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const effectiveStatus = disabled ? 'disabled' : status;
    const showError = effectiveStatus === 'error' && errorMessage;
    const showSuccess = effectiveStatus === 'success' && successMessage;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            {label}
            {optional && (
              <span className="text-xs text-muted-foreground font-normal">
                (optional)
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'flex h-10 w-full rounded-lg border bg-black/40 px-3 py-2 text-sm transition-all duration-200',
              'placeholder:text-muted-foreground/60',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              effectiveStatus === 'default' &&
                'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/20',
              effectiveStatus === 'error' &&
                'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
              effectiveStatus === 'success' &&
                'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20',
              effectiveStatus === 'disabled' &&
                'border-white/5 bg-white/5 text-muted-foreground cursor-not-allowed opacity-60',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
          {showError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
          {showSuccess && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          )}
        </div>
        {helperText && !showError && !showSuccess && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            {helperText}
          </p>
        )}
        {showError && (
          <p className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            {errorMessage}
          </p>
        )}
        {showSuccess && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            {successMessage}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  status?: FieldStatus;
  optional?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      successMessage,
      status = 'default',
      optional,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const effectiveStatus = disabled ? 'disabled' : status;
    const showError = effectiveStatus === 'error' && errorMessage;
    const showSuccess = effectiveStatus === 'success' && successMessage;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            {label}
            {optional && (
              <span className="text-xs text-muted-foreground font-normal">
                (optional)
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex min-h-[100px] w-full rounded-lg border bg-black/40 px-3 py-2 text-sm transition-all duration-200',
            'placeholder:text-muted-foreground/60 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
            effectiveStatus === 'default' &&
              'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/20',
            effectiveStatus === 'error' &&
              'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
            effectiveStatus === 'success' &&
              'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20',
            effectiveStatus === 'disabled' &&
              'border-white/5 bg-white/5 text-muted-foreground cursor-not-allowed opacity-60',
            className
          )}
          {...props}
        />
        {helperText && !showError && !showSuccess && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            {helperText}
          </p>
        )}
        {showError && (
          <p className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            {errorMessage}
          </p>
        )}
        {showSuccess && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            {successMessage}
          </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
