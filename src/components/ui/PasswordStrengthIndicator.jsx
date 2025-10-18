import React from 'react';
import { getPasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/utils/validation';

export const PasswordStrengthIndicator = ({ password, language = 'en' }) => {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const label = getPasswordStrengthLabel(strength, language);
  const color = getPasswordStrengthColor(strength);
  const percentage = (strength / 4) * 100;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-amber-700">
          {language === 'zh' ? '密碼強度：' : 'Password Strength:'}
        </span>
        <span style={{ color }} className="font-medium">
          {label}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};
