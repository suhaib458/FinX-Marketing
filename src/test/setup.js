import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';
import React from 'react';

globalThis.React = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  localStorage.clear();
  delete window.__FINX_FAIL_MOCK;
});
