"use client";

interface RatingScaleProps {
  label: string;
  description?: string;
  value: number | null;
  onChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
}

export default function RatingScale({
  label,
  description,
  value,
  onChange,
  minLabel = "Strongly Disagree",
  maxLabel = "Strongly Agree",
}: RatingScaleProps) {
  return (
    <div className="mb-6">
      <div className="mb-3">
        <label className="font-semibold text-white text-lg">{label}</label>
        {description && (
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 w-20 text-right">{minLabel}</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <button
              key={num}
              onClick={() => onChange(num)}
              className={`
                w-11 h-11 rounded-full border-2 flex items-center justify-center
                transition-all font-bold text-lg
                ${value === num
                  ? "bg-blue-500 border-blue-500 text-white scale-110 shadow-lg shadow-blue-500/30"
                  : "border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-400 hover:scale-105"}
              `}
            >
              {num}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 w-20">{maxLabel}</span>
      </div>
    </div>
  );
}
