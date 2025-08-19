import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ts-node ESM hooks without using --loader flag
register('ts-node/esm', pathToFileURL('./'));

// Start the backend
import './src/backend/index.ts';
