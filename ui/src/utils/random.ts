export function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomMinutes(min = 1, max = 6) {
  return Math.floor(Math.random() * max) + min;
}

export function randomDelay(min: number, extra: number) {
  return Math.floor(Math.random() * extra) + min;
}
