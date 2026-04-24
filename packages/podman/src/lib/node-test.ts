#!node
import {spawn} from 'node:child_process';

const child = spawn(process.env.SHELL ?? '/bin/sh', ['-c', 'if read -r line; then echo "read:$line"; else echo "eof"; fi'], {
    stdio: ['ignore', 'pipe', 'pipe'],
});

child.stdout.on('data', (chunk) => process.stdout.write(chunk));
child.on('close', (code) => console.log('exit', code));
