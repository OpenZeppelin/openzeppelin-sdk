import { Transformation } from './transformation';

export function transpile(source: string, transformations: Transformation[]) {
  let cursor = 0;

  const sorted = transformations.sort((a, b) => {
    return a.start - b.start;
  });

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].end > sorted[i + 1].start)
      throw new Error(
        `Transformations ${sorted[i].start}:${sorted[i].end}:${sorted[i].text} and ${sorted[i + 1].start}:${
          sorted[i + 1].end
        }:${sorted[i + 1].text} overlap over the source file`,
      );
  }

  let transpiledCode = sorted.reduce((output, trans) => {
    const { start, end, text } = trans;
    output += source.slice(cursor, start);
    output += text;
    cursor = end;
    return output;
  }, '');

  transpiledCode += source.slice(cursor);
  return transpiledCode;
}
