import { formatNumber } from './utils.ts';
import { defaultLogger } from './logger.ts';

export function setupCounter(element: HTMLButtonElement) {
  let counter = 0
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `count is ${formatNumber(counter)}`
    defaultLogger.log(`Counter updated to ${counter}`);
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}
