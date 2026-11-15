import { useState } from 'react';
import { Github, ArrowRight, Loader2 } from 'lucide-react';

export default function RepositoryInput({
    value,
    onChange,
    onAnalyze,
    onSubmit,
    placeholder = 'https://github.com/owner/repository',
    disabled = false,
    isLoading = false,
    className = '',
}) {
    const [internalValue, setInternalValue] = useState('');

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const handleChange = (e) => {
        if (isControlled) {
            onChange?.(e);
        } else {
            setInternalValue(e.target.value);
            onChange?.(e);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (disabled || isLoading) return;

        const trimmed = currentValue.trim();
        if (onAnalyze) {
            onAnalyze(trimmed);
        } else if (onSubmit) {
            onSubmit(trimmed);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={`relative flex items-center justify-between w-full max-w-lg rounded-2xl bg-[#0c101c]/90 border border-white/10 p-2 sm:p-2.5 pl-2 sm:pl-5 shadow-2xl backdrop-blur-md transition-all duration-200 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 hover:border-white/15 ${className}`}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                <Github className="size-5 shrink-0 text-slate-400" />
                <input
                    type="text"
                    value={currentValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled || isLoading}
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full bg-transparent font-mono text-sm text-slate-200 placeholder:text-slate-500 placeholder:font-mono focus:outline-none disabled:opacity-50"
                />
            </div>

            <button
                type="submit"
                disabled={disabled || isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8274ff] hover:bg-[#7262f8] active:scale-[0.98] px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Analyzing...</span>
                    </>
                ) : (
                    <>
                        <span>Analyze repository</span>
                        <ArrowRight className="size-4" />
                    </>
                )}
            </button>
        </form>
    );
}
