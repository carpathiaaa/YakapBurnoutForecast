import React from 'react';
import { View, Text } from 'react-native';

interface SvgIconProps {
  name: string;
  size?: number;
  color?: string;
  width?: number;
  height?: number;
}

const iconSymbols: Record<string, string> = {
  sun: '☀️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  overcast: '🌥️',
  stormy: '⛈️',
  critical: '🌀',
  'trend-up': '📈',
  'trend-down': '📉',
  'trend-stable': '➡️',
  alert: '🚨',
  star: '★',
  'star-filled': '★',
  'star-empty': '☆',
  sleep: '🌙'
};

export const SvgIcon: React.FC<SvgIconProps> = ({ 
  name, 
  size = 24, 
  color,
  width,
  height 
}) => {
  const symbol = iconSymbols[name];
  
  if (!symbol) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const iconWidth = width || size;
  const iconHeight = height || size;

  return (
    <View style={{ width: iconWidth, height: iconHeight, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ 
        fontSize: size * 0.8, 
        color: color || '#000',
        textAlign: 'center',
        lineHeight: size
      }}>
        {symbol}
      </Text>
    </View>
  );
};
