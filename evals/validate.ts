import process from 'node:process';

import { loadEvalCases, loadEvalSuiteConfig, assertEvalInputsExist } from './shared';

async function main() {
  const evalCases = await loadEvalCases();
  const suiteConfig = await loadEvalSuiteConfig();

  await assertEvalInputsExist(evalCases);

  console.log(`Validated ${evalCases.length} eval cases.`);

  if (suiteConfig.suiteAssertions?.length) {
    console.log(`Loaded ${suiteConfig.suiteAssertions.length} suite assertion(s).`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
