/**
 * Provided a time in milliseconds, this function will return a promise that will resolve in that many milliseconds.
 */
export const delayFunc = (ms: number): Promise<unknown> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
