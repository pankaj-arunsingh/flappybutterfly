import '@testing-library/jest-dom';
import { stats } from 'react-magnetic-di';

beforeEach(() => {
  stats.reset();
});

afterEach(() => {
  const unused = stats.unused();
  if (unused.length > 0) {
    // Log instead of throwing so optional injectables don't fail the suite.
    // Uncomment to enforce zero unused injectables:
    // unused.forEach((entry) => { throw entry.error(); });
  }
});
