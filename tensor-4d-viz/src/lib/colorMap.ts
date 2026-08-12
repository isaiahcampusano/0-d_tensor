const CHANNEL_COLORS = ['#ff5b5b', '#4dff88', '#5b76ff', '#d76dff'] as const

export function channelColor(channel: number): string {
  return CHANNEL_COLORS[channel % CHANNEL_COLORS.length]
}

export function valueColor(value: number, channel: number): string {
  const base = channelColor(channel)
  const normalized = 0.24 + 0.76 / (1 + Math.exp(-value * 1.8))
  const rgb = [1, 3, 5].map((offset) => Number.parseInt(base.slice(offset, offset + 2), 16))
  return `rgb(${rgb.map((component) => Math.round(component * normalized)).join(',')})`
}

export function hierarchyColor([b, h, w, c]: [number, number, number, number]): string {
  const hue = (c * 85 + b * 27 + h * 7 + w * 3) % 360
  return `hsl(${hue} 68% 60%)`
}

export const CHANNEL_NAMES = ['Red', 'Green', 'Blue', 'Alpha'] as const
