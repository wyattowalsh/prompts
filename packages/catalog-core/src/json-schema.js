import { readFile } from "node:fs/promises";
import { join } from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

function escapeJsonPointerSegment(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function uniqueBy(property, data, _parentSchema, dataContext) {
  const seen = new Map();
  for (let index = 0; index < data.length; index += 1) {
    const item = data[index];
    if (item === null || typeof item !== "object" || !Object.hasOwn(item, property)) continue;
    const value = item[property];
    if (seen.has(value)) {
      uniqueBy.errors = [
        {
          keyword: "uniqueBy",
          instancePath: `${dataContext?.instancePath ?? ""}/${index}/${escapeJsonPointerSegment(property)}`,
          schemaPath: "#/uniqueBy",
          params: { duplicateIndex: seen.get(value), property, value },
          message: `must have a unique ${property}`
        }
      ];
      return false;
    }
    seen.set(value, index);
  }
  uniqueBy.errors = null;
  return true;
}

uniqueBy.errors = null;

/**
 * Compile the checked-in Draft 2020-12 schemas with the catalog's registered
 * `uniqueBy` custom keyword. Cross-record ownership, subset, and reference checks are kept in
 * validateCatalogPackage because JSON Schema evaluates one record at a time.
 *
 * @param {string} schemaDirectory
 */
export async function createCatalogJsonSchemaValidators(schemaDirectory) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addKeyword({
    keyword: "uniqueBy",
    type: "array",
    schemaType: "string",
    errors: true,
    validate: uniqueBy
  });

  const [indexSchema, itemSchema] = await Promise.all(
    ["index.schema.json", "item.schema.json"].map(async (name) =>
      JSON.parse(await readFile(join(schemaDirectory, name), "utf8"))
    )
  );

  return {
    ajv,
    index: ajv.compile(indexSchema),
    item: ajv.compile(itemSchema)
  };
}
