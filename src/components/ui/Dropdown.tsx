"use client";

import { useCallback, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";

type DropdownProps =
  | {
      mode: "multi";
      label: string;
      options: string[];
      selected: string[];
      onChange: (v: string[]) => void;
      formatLabel?: (v: string) => string;
    }
  | {
      mode: "single";
      label: string;
      options: string[];
      selected: string | null;
      onChange: (v: string | null) => void;
      formatLabel?: (v: string) => string;
    };

export default function Dropdown(props: DropdownProps) {
  const { mode, label, options, formatLabel = (v: string) => v } = props;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  const badge =
    mode === "multi" && props.selected.length > 0 ? (
      <span className="px-1.5 py-0.5 rounded bg-azure-500/20 text-azure-400 text-[10px] font-medium">
        {props.selected.length}
      </span>
    ) : mode === "single" && props.selected ? (
      <span className="px-1.5 py-0.5 rounded bg-azure-500/20 text-azure-400 text-[10px] font-medium truncate max-w-[80px]">
        {formatLabel(props.selected)}
      </span>
    ) : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-700 border border-surface-600 text-xs text-gray-300 hover:border-azure-500/50 transition-colors"
      >
        <span>{label}</span>
        {badge}
        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && options.length > 0 && (
        <div className="absolute z-50 mt-1 min-w-[180px] bg-surface-800 border border-surface-600 rounded-lg shadow-xl py-1">
          {mode === "multi" ? (
            options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-700 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={props.selected.includes(opt)}
                  onChange={() =>
                    props.onChange(
                      props.selected.includes(opt)
                        ? props.selected.filter((s) => s !== opt)
                        : [...props.selected, opt]
                    )
                  }
                  className="rounded border-surface-600 bg-surface-700 text-azure-500 focus:ring-azure-500/30"
                />
                <span className="truncate">{formatLabel(opt)}</span>
              </label>
            ))
          ) : (
            <>
              <button
                onClick={() => { props.onChange(null); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-700 ${!props.selected ? "text-azure-400" : "text-gray-400"}`}
              >
                All
              </button>
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { props.onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-700 ${props.selected === opt ? "text-azure-400" : "text-gray-300"}`}
                >
                  {formatLabel(opt)}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
