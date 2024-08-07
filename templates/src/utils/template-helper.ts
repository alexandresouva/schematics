import {
  Tree,
  SchematicContext,
  apply,
  url,
  move,
  mergeWith,
  Rule,
  SchematicsException,
} from '@angular-devkit/schematics';
import { TemplatePath } from './enums';
import ts = require('typescript');
import { addDeclarationToModule } from '@angular/cdk/schematics';
import { InsertChange } from '@schematics/angular/utility/change';

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

export function addImportsAndDeclarationsToModule(): Rule {
  return (tree: Tree, _: SchematicContext) => {
    const modulePath = 'src/app/app.module.ts';

    if (!tree.exists(modulePath)) {
      throw new SchematicsException(
        `O arquivo de modulo ${modulePath} nao existe.`
      );
    }

    const moduleFile = tree.read(modulePath);
    if (!moduleFile) {
      throw new SchematicsException(
        `Não foi possível ler o arquivo de modulo ${modulePath}.`
      );
    }

    const source = ts.createSourceFile(
      modulePath,
      moduleFile.toString(),
      ts.ScriptTarget.Latest,
      true
    );

    const importPath = './components/header/header.component';
    const classifiedName = 'HeaderComponent';

    // Adiciona os imports
    const changes = addDeclarationToModule(
      source,
      modulePath,
      classifiedName,
      importPath
    );

    // Aplica as mudanças
    const recorder = tree.beginUpdate(modulePath);
    changes.forEach((change) => {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    });
    tree.commitUpdate(recorder);

    return tree;
  };
}
