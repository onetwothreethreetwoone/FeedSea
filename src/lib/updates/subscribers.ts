export const subscribers = new Set<string>();

export function addSubscriber(clientId: string): void {
  subscribers.add(clientId);
}

export function removeSubscriber(clientId: string): boolean {
  return subscribers.delete(clientId);
}

export function hasSubscriber(clientId: string): boolean {
  return subscribers.has(clientId);
}