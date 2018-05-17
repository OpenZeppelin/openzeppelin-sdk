const state = {
  silent: false
}

export default function log() {
  if (!state.silent && process.env.NODE_ENV !== 'test') {
    console.log(...arguments);
  }
}

export function silent(value) {
  state.silent = value;
}