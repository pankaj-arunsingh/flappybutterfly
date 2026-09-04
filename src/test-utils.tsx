import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { DiProvider, Injectable } from 'react-magnetic-di';

type DiRenderOptions = RenderOptions & {
  // magnetic-di injectables to apply to the whole tree
  di?: Injectable[];
};

export function renderWithDi(ui: ReactElement, options?: DiRenderOptions): RenderResult {
  const { di = [], wrapper: Wrapper, ...rest } = options || {};
  const DiWrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const inner = Wrapper ? <Wrapper>{children}</Wrapper> : <>{children}</>;
    if (di.length === 0) {
      return inner;
    }
    return <DiProvider use={di}>{inner}</DiProvider>;
  };
  return render(ui, { wrapper: DiWrapper, ...rest });
}

export * from '@testing-library/react';
export { renderWithDi as render };
