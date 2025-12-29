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
      <div className="mb-2">
        <label className="font-medium text-gray-900">{label}</label>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-24 text-right">{minLabel}</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <button
              key={num}
              onClick={() => onChange(num)}
              className={`
                w-10 h-10 rounded-full border-2 flex items-center justify-center
                transition-all font-medium
                ${value === num
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "border-gray-300 text-gray-600 hover:border-blue-400 hover:bg-blue-50"}
              `}
            >
              {num}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 w-24">{maxLabel}</span>
      </div>
    </div>
  );
}

