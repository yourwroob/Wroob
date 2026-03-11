import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import INDIAN_LOCATIONS from "@/data/indianCities";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const LocationAutocomplete = ({
  value,
  onChange,
  placeholder = "Search for a location",
  className,
}: LocationAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = query.length >= 2
    ? INDIAN_LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelect = (loc: string) => {
    setQuery(loc);
    onChange(loc);
    setOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (filtered.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-56 overflow-y-auto">
          {filtered.map((loc) => (
            <button
              key={loc}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
              onClick={() => handleSelect(loc)}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>{loc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
