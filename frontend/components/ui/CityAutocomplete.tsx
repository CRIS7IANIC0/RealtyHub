"use client";

import { useEffect, useRef, useState } from "react";
import { searchCities } from "@/lib/colombia-cities";

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

/** Input con sugerencias de ciudades de Colombia (teclado y mouse). */
export default function CityAutocomplete({ id, value, onChange, className, placeholder, required }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const options = open ? searchCities(value) : [];
  const exact = options.length === 1 && options[0] === value;
  const visible = exact ? [] : options;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pick(city: string) {
    onChange(city);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!visible.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % visible.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + visible.length) % visible.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(visible[active] ?? visible[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={visible.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={className}
      />
      {visible.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-[10px] border border-[#ebebeb] bg-white py-1 shadow-lg"
        >
          {visible.map((city, i) => (
            <li
              key={city}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(city);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-4 py-2 text-[14px] text-[#222222] ${i === active ? "bg-[#f7f7f7]" : ""}`}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
