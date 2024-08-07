import {
  Tree,
  SchematicContext,
  apply,
  url,
  move,
  mergeWith,
  Rule,
} from '@angular-devkit/schematics';
import { TemplatePath } from './enums';

function createTemplateRule(path: TemplatePath): Rule {
  return (_: Tree, _context: SchematicContext) => {
    const transformedSource = apply(url(`./files/${path}`), [
      move(`src/app/${path}`),
    ]);
    return mergeWith(transformedSource);
  };
}

export function generateAllTemplateRules(): Rule[] {
  return Object.values(TemplatePath).map((path) => createTemplateRule(path));
}
