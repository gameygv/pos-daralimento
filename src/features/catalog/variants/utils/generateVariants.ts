export interface OptionGroupInput {
  name: string;
  values: string[];
}

export interface GeneratedVariant {
  sku: string;
  option_values: Record<string, string>;
}

/**
 * Generates all variant combinations from option groups via cartesian product.
 * Each variant gets a SKU derived from the product SKU + value abbreviations.
 */
export function generateVariants(
  groups: OptionGroupInput[],
  productSku: string,
): GeneratedVariant[] {
  if (groups.length === 0) return [];

  const filteredGroups = groups.filter((g) => g.values.length > 0);
  if (filteredGroups.length === 0) return [];

  // Cartesian product
  const combinations = cartesianProduct(filteredGroups.map((g) => g.values));

  return combinations.map((combo) => {
    const optionValues: Record<string, string> = {};
    filteredGroups.forEach((group, i) => {
      optionValues[group.name] = combo[i];
    });

    const suffix = combo
      .map((v) => abbreviate(v))
      .join('-');

    return {
      sku: `${productSku}-${suffix}`.toUpperCase(),
      option_values: optionValues,
    };
  });
}

function cartesianProduct(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [[]];

  return arrays.reduce<string[][]>(
    (acc, curr) => {
      const result: string[][] = [];
      for (const a of acc) {
        for (const v of curr) {
          result.push([...a, v]);
        }
      }
      return result;
    },
    [[]],
  );
}

function abbreviate(value: string): string {
  // Take first 3 chars, remove spaces, uppercase
  return value
    .trim()
    .slice(0, 3)
    .replace(/\s/g, '')
    .toUpperCase();
}
