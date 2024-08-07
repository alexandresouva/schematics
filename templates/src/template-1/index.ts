import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { generateAllTemplateRules } from '../utils/template-helper';

export function template1(_options: SchemaOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    console.log(_options);

    const rule = chain(generateAllTemplateRules());
    return rule(tree, _context);
  };
}

// function runNgNewSchematic({ name }: SchemaOptions) {
//   return externalSchematic('@schematics/angular', 'ng-new', {
//     name,
//     version: '13.3.2',
//     directory: name,
//     routing: false,
//     style: 'scss',
//     inlineStyle: false,
//     inlineTemplate: false,
//   });
// }

// function createDefaultFolders({ name }: SchemaOptions) {
//   return (tree: Tree, _context: SchematicContext) => {
//     tree.create(`${name}/src/app/components/.gitkeep`, '');
//     tree.create(`${name}/src/app/directives/.gitkeep`, '');
//     tree.create(`${name}/src/app/mocks/.gitkeep`, '');
//     tree.create(`${name}/src/app/models/.gitkeep`, '');
//     tree.create(`${name}/src/app/pages/.gitkeep`, '');
//     tree.create(`${name}/src/app/pipes/.gitkeep`, '');
//     tree.create(`${name}/src/app/services/.gitkeep`, '');
//   };
// }
