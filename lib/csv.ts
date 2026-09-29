import Papa, { ParseConfig, UnparseConfig, ParseResult } from "papaparse";

/**
 * Parses a CSV string or File into typed objects or rows.
 */
export function parseCSV<T = Record<string, unknown>>(
  input: string | File,
  config?: ParseConfig<T>
): Promise<ParseResult<T>> {
  return new Promise((resolve, reject) => {
    Papa.parse(input as unknown as string, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      ...config,
      complete: (results: ParseResult<T>) => {
        resolve(results);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

/**
 * Converts an array of objects or rows into a CSV string.
 */
export function unparseCSV<T>(data: T[] | Papa.UnparseObject<T>, config?: UnparseConfig): string {
  return Papa.unparse(data, config);
}

export { Papa };
export default Papa;
