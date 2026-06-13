export type ColorScheme = 'warm' | 'cool' | 'viridis';

interface RGB {
  r: number;
  g: number;
  b: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(color1: RGB, color2: RGB, t: number): RGB {
  return {
    r: Math.round(lerp(color1.r, color2.r, t)),
    g: Math.round(lerp(color1.g, color2.g, t)),
    b: Math.round(lerp(color1.b, color2.b, t)),
  };
}

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

const colorSchemes: Record<ColorScheme, string[]> = {
  warm: ['#4361ee', '#4cc9f0', '#f72585'],
  cool: ['#0f4c81', '#45b7d1', '#96ceb4'],
  viridis: ['#440154', '#21918c', '#fde725'],
};

export function getColor(value: number, min: number, max: number, scheme: ColorScheme = 'warm'): string {
  const colors = colorSchemes[scheme];
  
  if (value <= min) {
    return colors[0];
  }
  if (value >= max) {
    return colors[colors.length - 1];
  }

  const normalized = (value - min) / (max - min);
  const numSegments = colors.length - 1;
  const segment = Math.min(Math.floor(normalized * numSegments), numSegments - 1);
  const segmentT = (normalized * numSegments) - segment;

  const color1 = hexToRgb(colors[segment]);
  const color2 = hexToRgb(colors[segment + 1]);
  const interpolated = lerpColor(color1, color2, segmentT);

  return `rgb(${interpolated.r}, ${interpolated.g}, ${interpolated.b})`;
}

export function getMatrixBounds(data: number[][]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  for (const row of data) {
    for (const value of row) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  return { min, max };
}

export function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  }
  return num.toFixed(decimals);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return (value * 100).toFixed(decimals) + '%';
}

export function formatMSE(value: number, decimals: number = 6): string {
  return value.toExponential(decimals);
}
