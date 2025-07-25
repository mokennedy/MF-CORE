import React from 'react';
import { createBridgeComponent, createRemoteAppComponent } from '../src';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createContainer, getHtml, sleep } from './util';

describe('bridge', () => {
  let containerInfo: ReturnType<typeof createContainer>;
  beforeEach(() => {
    containerInfo = createContainer();
  });

  afterEach(() => {
    containerInfo?.clean();
  });

  it('createBridgeComponent life cycle', async () => {
    function Component() {
      return <div>life cycle render</div>;
    }
    const lifeCycle = createBridgeComponent({
      rootComponent: Component,
    })();

    lifeCycle.render({
      dom: containerInfo?.container,
    });

    await sleep(200);
    expect(document.querySelector('#container')!.innerHTML).toContain(
      '<div>life cycle render</div>',
    );

    lifeCycle.destroy({
      dom: containerInfo?.container,
      moduleName: 'test',
    });

    expect(document.querySelector('#container')!.innerHTML).toContain('');
  });

  it('createRemoteAppComponent', async () => {
    function Component({ props }: { props?: Record<string, any> }) {
      return <div>life cycle render {props?.msg}</div>;
    }
    const BridgeComponent = createBridgeComponent({
      rootComponent: Component,
    });
    const RemoteComponent = createRemoteAppComponent({
      loader: async () => {
        return {
          default: BridgeComponent,
        };
      },
      fallback: () => <div></div>,
      loading: <div>loading</div>,
    });

    const { container } = render(
      <RemoteComponent props={{ msg: 'hello world' }} />,
    );
    expect(getHtml(container)).toMatch('loading');

    await sleep(200);
    expect(getHtml(container)).toMatch('life cycle render');
    expect(getHtml(container)).toMatch('hello world');
  });

  it('createRemoteAppComponent and obtain ref property', async () => {
    const ref = {
      current: null,
    };

    function Component({ props }: { props?: Record<string, any> }) {
      return <div>life cycle render {props?.msg}</div>;
    }
    const BridgeComponent = createBridgeComponent({
      rootComponent: Component,
    });
    const RemoteComponent = createRemoteAppComponent({
      loader: async () => {
        return {
          default: BridgeComponent,
        };
      },
      fallback: () => <div></div>,
      loading: <div>loading</div>,
    });

    const { container } = render(
      <RemoteComponent ref={ref} props={{ msg: 'hello world' }} />,
    );
    expect(getHtml(container)).toMatch('loading');

    await sleep(200);
    expect(getHtml(container)).toMatch('life cycle render');
    expect(getHtml(container)).toMatch('hello world');
    expect(ref.current).not.toBeNull();
  });

  it('createRemoteAppComponent with custom createRoot prop', async () => {
    const renderMock = jest.fn();

    function Component({ props }: { props?: Record<string, any> }) {
      return <div>life cycle render {props?.msg}</div>;
    }
    const BridgeComponent = createBridgeComponent({
      rootComponent: Component,
      createRoot: () => {
        return {
          render: renderMock,
          unmount: jest.fn(),
        };
      },
    });
    const RemoteComponent = createRemoteAppComponent({
      loader: async () => {
        return {
          default: BridgeComponent,
        };
      },
      fallback: () => <div></div>,
      loading: <div>loading</div>,
    });

    const { container } = render(<RemoteComponent />);
    expect(getHtml(container)).toMatch('loading');

    await sleep(200);
    expect(renderMock).toHaveBeenCalledTimes(1);
  });
});
