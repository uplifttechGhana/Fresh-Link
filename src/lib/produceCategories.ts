/** Always available when adding/editing produce — API also returns these */
export const DEFAULT_PRODUCE_CATEGORIES = ['Fruits', 'Vegetables'] as const;

export function mergeProduceCategories(apiCategories: string[]): string[] {
  return [
    ...new Set([
      ...DEFAULT_PRODUCE_CATEGORIES,
      ...apiCategories.filter(Boolean),
    ]),
  ];
}
