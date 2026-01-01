import React from 'react';
import { 
  Utensils, Car, ShoppingBag, Film, Zap, Briefcase, Laptop, TrendingUp,
  Home, Gift, Coffee, Smartphone, Wifi, CreditCard, DollarSign, Heart, Tag
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ElementType> = {
  Utensils, Car, ShoppingBag, Film, Zap, Briefcase, Laptop, TrendingUp,
  Home, Gift, Coffee, Smartphone, Wifi, CreditCard, DollarSign, Heart, Tag
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface IconByNameProps {
  name: string;
  className?: string;
}

export const IconByName: React.FC<IconByNameProps> = ({ name, className }) => {
  const IconComponent = ICON_MAP[name] || Tag;
  return <IconComponent className={className} />;
};

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
  return (
    <div className="grid grid-cols-6 gap-2 mt-2">
      {AVAILABLE_ICONS.map((iconName) => (
        <button
          key={iconName}
          type="button"
          onClick={() => onSelect(iconName)}
          className={`p-2 rounded-lg flex items-center justify-center transition ${
            selectedIcon === iconName 
              ? 'bg-indigo-600 text-white shadow-md transform scale-105' 
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <IconByName name={iconName} className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};
