const state: { silent: boolean } = {
  silent: false
};

export default function log(...args: any[]): void {
  if (!state.silent && process.env.NODE_ENV !== 'test') {
    console.log(...args);
  }
}

export function silent(value: boolean): void {
  state.silent = value;
}
