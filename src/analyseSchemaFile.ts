import Joi, { AnySchema } from 'joi';
import path from 'path';

import { ConvertedType, GenerateTypeFile, InternalSchema, Settings } from './types';
import { Describe } from './joiDescribeTypes';
import { ensureInterfaceorTypeName, getInterfaceOrTypeName } from './joiUtils';
import { getAllCustomTypes, parseSchema, typeContentToTs } from './parse';

export function convertSchemaInternal(
  settings: Settings,
  joi: AnySchema,
  exportedName?: string,
  rootSchema?: boolean
): InternalSchema | undefined {
  const details = joi.describe() as Describe;

  const interfaceOrTypeName = getInterfaceOrTypeName(settings, details) || exportedName;

  if (!interfaceOrTypeName) {
    if (settings.useLabelAsInterfaceName) {
      throw new Error(`At least one "object" does not have .label(''). Details: ${JSON.stringify(details)}`);
    } else {
      throw new Error(`At least one "object" does not have .meta({className:''}). Details: ${JSON.stringify(details)}`);
    }
  }

  if (settings.debug && interfaceOrTypeName.toLowerCase().endsWith('schema')) {
    if (settings.useLabelAsInterfaceName) {
      console.debug(
        `It is recommended you update the Joi Schema '${interfaceOrTypeName}' similar to: ${interfaceOrTypeName} = Joi.object().label('${interfaceOrTypeName.replace(
          'Schema',
          ''
        )}')`
      );
    } else {
      console.debug(
        `It is recommended you update the Joi Schema '${interfaceOrTypeName}' similar to: ${interfaceOrTypeName} = Joi.object().meta({className:'${interfaceOrTypeName.replace(
          'Schema',
          ''
        )}'})`
      );
    }
  }

  ensureInterfaceorTypeName(settings, details, interfaceOrTypeName);

  const parsedSchema = parseSchema(details, settings, false, undefined, rootSchema);
  if (parsedSchema) {
    const customTypes = getAllCustomTypes(parsedSchema);
    const content = typeContentToTs(settings, parsedSchema, true);
    return {
      interfaceOrTypeName,
      customTypes,
      content
    };
  }

  // The only type that could return this is alternatives
  // see parseAlternatives for why this is ignored
  /* istanbul ignore next */
  return undefined;
}
/**
 * Analyse a schema file
 * @returns Schema analysis results
 */
export async function analyseSchemaFile(
  sourceFilePath: string,
  settings: Settings
): Promise<undefined | GenerateTypeFile> {
  const allConvertedTypes: ConvertedType[] = [];
  const schemaFile = await require(sourceFilePath);

  const exportFilePath = settings.exportFile(path.dirname(sourceFilePath), path.basename(sourceFilePath));
  for (const exportedName in schemaFile) {
    const joiSchema = schemaFile[exportedName];
    if (!Joi.isSchema(joiSchema)) {
      continue;
    }

    const convertedType = convertSchemaInternal(settings, joiSchema, exportedName, true);
    if (convertedType) {
      allConvertedTypes.push({ ...convertedType, exportFilePath, sourceFilePath });
    }
  }

  if (allConvertedTypes.length === 0) {
    if (settings.debug) {
      console.debug(`${sourceFilePath} - Skipped - no Joi Schemas found`);
    }
    return;
  }

  if (settings.debug) {
    console.debug(`${sourceFilePath} - Processing`);
  }

  // Clean up type list
  // Sort Types
  const typesToBeWritten = allConvertedTypes.sort(
    (interface1, interface2) => 0 - (interface1.interfaceOrTypeName > interface2.interfaceOrTypeName ? -1 : 1)
  );

  // Write types
  const typeContent = typesToBeWritten.map(typeToBeWritten => typeToBeWritten.content);

  // Get imports for the current file
  const allExternalTypes: ConvertedType[] = [];
  const allCurrentFileTypeNames = typesToBeWritten.map(typeToBeWritten => typeToBeWritten.interfaceOrTypeName);

  for (const typeToBeWritten of typesToBeWritten) {
    for (const customType of typeToBeWritten.customTypes) {
      if (!allCurrentFileTypeNames.includes(customType) && !allExternalTypes.includes(typeToBeWritten)) {
        allExternalTypes.push(typeToBeWritten);
      }
    }
  }

  const exportFileContent = `${typeContent.join('\n\n').concat('\n')}`;

  return {
    externalTypes: allExternalTypes,
    internalTypes: typesToBeWritten,
    exportFilePath,
    exportFileContent
  };
}
