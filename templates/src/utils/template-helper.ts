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
import { Change, InsertChange } from '@schematics/angular/utility/change';
import * as fs from 'fs';

// Função que cria uma regra de template, movendo os arquivos de
// `files/path` (gaw-templates) para `src/app/path` (projeto destino)
function createTemplateRule(path: TemplatePath): Rule {
  return (_: Tree, _context: SchematicContext) => {
    const transformedSource = apply(url(`./files/${path}`), [
      move(`src/app/${path}`),
    ]);
    return mergeWith(transformedSource);
  };
}

// Função que gera regras para todos os tipos de templates definidos no enum TemplatePath
export function generateAllTemplateRules(): Rule[] {
  return Object.values(TemplatePath).map((path) => createTemplateRule(path));
}

// Função para adicionar importações e declarações ao app.module.ts no projeto de destino
export function addImportsAndDeclarationsToAppModule(modulePath: string): Rule {
  const targetAppModulePath = 'src/app/app.module.ts';

  return (tree: Tree, _context: SchematicContext) => {
    // Certifica-se que o arquivo app.module.ts existe no projeto de destino
    if (!tree.exists(targetAppModulePath)) {
      throw new SchematicsException(
        `Não foi possível adicionar as importações. O arquivo app.module não existe em ${targetAppModulePath}`
      );
    }

    // Carrega o conteúdo do arquivo app.module.ts do projeto de destino
    const targetAppModuleSource = loadSourceFile(targetAppModulePath, tree);

    // Obtém os imports do app.module.ts definido no schematic (template)
    const importsInTemplate = getImportsFromAppModuleInTemplate(modulePath);

    // Gera as mudanças necessárias para acrescentar os imports e declarações ao app.module.ts do projeto de destino
    const importChanges = generateImportChanges(
      targetAppModuleSource,
      targetAppModulePath,
      importsInTemplate
    );

    // Aplica as mudanças no app.module.ts do arquivo de destino
    const recorder = tree.beginUpdate(targetAppModulePath);
    importChanges.forEach((change) => {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    });
    tree.commitUpdate(recorder);
    return tree;
  };
}

function getImportsFromAppModuleInTemplate(modulePath: string): IImport[] {
  if (fs.existsSync(modulePath)) {
    const templateAppModuleSource = loadSourceFile(modulePath);
    const imports: IImport[] = [];

    templateAppModuleSource.statements.forEach((node) => {
      if (ts.isImportDeclaration(node)) {
        const importClause = node.importClause;
        const moduleSpecifier = node.moduleSpecifier
          .getText()
          .replace(/['"]/g, '');

        if (importClause) {
          if (importClause.name) {
            // Default import
            imports.push({
              classifiedName: importClause.name.text,
              importPath: moduleSpecifier,
            });
          } else if (
            importClause.namedBindings &&
            ts.isNamedImports(importClause.namedBindings)
          ) {
            // Named imports
            importClause.namedBindings.elements.forEach((element) => {
              imports.push({
                classifiedName: element.name.text,
                importPath: moduleSpecifier,
              });
            });
          }
        }
      }
    });

    return imports;
  } else {
    throw new SchematicsException(
      `Não foi possível ler o arquivo de modulo em ${modulePath}.`
    );
  }
}

function loadSourceFile(path: string, tree?: Tree): ts.SourceFile {
  let fileContent: Buffer | null = null;

  if (tree) {
    fileContent = tree.read(path);
    if (!fileContent) {
      throw new SchematicsException(
        `Não foi possível ler o conteúdo de ${path}.`
      );
    }
  } else {
    fileContent = fs.readFileSync(path);
    if (!fileContent) {
      throw new SchematicsException(
        `Não foi possível ler o conteúdo de ${path} do sistema de arquivos.`
      );
    }
  }

  return ts.createSourceFile(
    path,
    fileContent.toString('utf-8'),
    ts.ScriptTarget.Latest,
    true
  );
}

function generateImportChanges(
  source: ts.SourceFile,
  modulePath: string,
  imports: IImport[]
): Change[] {
  return imports.flatMap((importItem) =>
    addDeclarationToModule(
      source,
      modulePath,
      importItem.classifiedName,
      importItem.importPath
    )
  );
}
