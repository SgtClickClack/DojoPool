// Minimal Cypress global shims to satisfy TypeScript in environments where Cypress
// is not part of the type resolution (e.g., Vitest/Jest or pure type-check runs).
// This avoids "Cannot find name 'cy'" errors without introducing Cypress types.

// If Cypress types are present, they will augment/override these minimal any types.
// This file is safe in any environment and has no runtime impact.

declare const cy: any;
declare const Cypress: any;

declare namespace NodeJS {
  interface Global {
    cy?: any;
    Cypress?: any;
  }
}
