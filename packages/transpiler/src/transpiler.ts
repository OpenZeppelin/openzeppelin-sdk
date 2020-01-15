import { Transformation } from './transformation';

export function transpile(source: string, transformations: Transformation[]): string {
  let cursor = 0;

  const sorted = transformations.sort((a, b) => {
    return a.start - b.start;
  });

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].end > sorted[i + 1].start)
      throw new Error(
        `Transformations ${sorted[i].start}:${sorted[i].end}:${sorted[i].text.slice(20)}... and ${
          sorted[i + 1].start
        }:${sorted[i + 1].end}:${sorted[i + 1].text.slice(20)}... overlap over the source file`,
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
