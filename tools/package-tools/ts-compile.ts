import {resolve as resolvePath} from 'path';
import {spawn} from 'child_process';
import * as chalk from 'chalk';

/**
 * Spawns a child process that compiles TypeScript using the specified compiler binary.
 * @param binary Binary name that will be used for TS compilation.
 * @param flags Command-line flags to be passed to binary.
 * @returns Promise that resolves/rejects when the child process exits.
 */
export function tsCompile(binary: 'tsc' | 'ngc', flags: string[]) {
  return new Promise<void>((resolve, reject) => {
    const binaryPath = resolvePath(`./node_modules/typescript/bin/${binary}`);
    // Use `node` for spawning the TypeScript compiler. On Windows, the shell is
    // not necessarily able to detect that the `tsc` files relies on Node.
    const childProcess = spawn('node', [binaryPath, ...flags], {shell: true});

    // Pipe stdout and stderr from the child process.
    childProcess.stdout.on('data', (data: string|Buffer) => console.log(`${data}`));
    childProcess.stderr.on('data', (data: string|Buffer) => console.error(chalk.red(`${data}`)));
    childProcess.on('exit', (exitCode: number) => {
      exitCode === 0 ? resolve() : reject(`${binary} compilation failure`);
    });
  });
}
