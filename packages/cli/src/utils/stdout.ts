const state: { silent: boolean } = {
  silent: false
};

export default function log(): void {
  if (!state.silent && process.env.NODE_ENV !== 'test') {
    console.log(...arguments);
  }
}

export function silent(value: boolean): void {
  state.silent = value;
}
