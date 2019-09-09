export function notEmpty(input) {
  if (input && input.length > 0) return true;
  return 'Please enter a non-empty value';
}
