import * as Rx from 'rxjs';
import * as Ro from 'rxjs/operators';
import { createPathResolver, ResolvedPath } from '../resolvers/path-resolver';
import {
  PathResolved,
  PathResolver,
  RouteInput,
  Router,
  RouteContext,
} from '../router';
import { length, map } from '../helpers/linked-list';
import { UrlHelper } from '../helpers/url-helper';
import type { RenderTarget } from '@xania/view';

export interface RouterOutletProps<TView> {
  router: Router;
  routes: RouteInput<TView>[];
  render(view: TView, target: RenderTarget | string): Disposable;
}

interface Disposable {
  dispose(): void;
}

interface RouterContext {
  url: UrlHelper;
  navigator: router.Navigator;
}

export function RouterOutlet<TView>(
  props: RouterOutletProps<TView>
  // children: router.RouteInput<TView>[]
) {
  return {
    render(target: Element) {
      return createRouterOutlet<TView>(target, props);
    },
  };
}

function createRouterOutlet<TView>(
  targetElement: Element,
  props: RouterOutletProps<TView>
) {
  const childRoutes$ = new Rx.ReplaySubject<string[]>(1);
  const { router, routes } = props;

  const subscr = createRouter(router.getRoutes([]), routes).subscribe({
    next([_, remaining]) {
      childRoutes$.next(remaining);
    },
  });

  return {
    dispose() {
      subscr.unsubscribe();
    },
  };

  function createRouter(
    paths: Rx.Observable<router.Path>,
    routes: PathResolver<TView> | RouteInput<TView>[],
    routerContext?: RouterContext
  ) {
    return paths.pipe(
      Ro.mergeMap(createPathResolver<TView>(routes)),
      Ro.share(),
      Ro.scan(createScanner(routerContext), [[], []])
    );
  }

  function executeView(
    resolution: PathResolved<TView>,
    url: UrlHelper
  ): Disposable {
    const { view, params } = resolution;

    const context: RouteContext = {
      url,
      path: url.path,
      params,
      // childRouter(_: PathResolver<TView> | RouteInput<TView>[]) {
      //   // createRouter(childRoutes$, mappings, this);
      // },
    };

    const scope = createScope(targetElement);
    let element: TView;
    try {
      element = (view as any)(context);
    } catch {
      element = Reflect.construct(view as Function, [context]);
    }
    props.render(element, scope);

    // const bindings = render(view, scope);
    return {
      dispose() {
        // disposeMany(bindings);
        // scope.dispose();
      },
    };
  }

  function createScanner(parentContext?: RouterContext) {
    return function scan(
      [prev]: [ViewResult[], router.Path],
      next: ResolvedPath<TView>
    ): [ViewResult[], router.Path] {
      const { unchanged, newResolutions, remainingPath } = next;
      const offset = length(unchanged);
      const entries = prev.slice(0, offset);
      for (let i = offset; i < prev.length; i++) {
        const curr = prev[i];
        if (curr.result) {
          curr.result.dispose();
        }
      }
      map(newResolutions, execute);

      return [entries, remainingPath];

      function execute(res: PathResolved<TView>, idx: number) {
        const parentEntry = entries[idx + offset - 1];
        const url = new UrlHelper(
          res.appliedPath,
          (parentEntry && parentEntry.url) ||
            (parentContext && parentContext.url)
        );
        entries[idx + offset] = {
          url,
          result: executeView(res, url),
        };
      }
    };
  }
}

// function applyChild(child: any, context: router.ViewContext) {
//   return typeof child === 'function' ? child(context) : child;
// }

// function isPromise(x: any): x is Promise<any> {
//   return !!x && typeof x.then == 'function';
// }

function createScope(targetElement: Element): RenderTarget {
  const commentNode = document.createComment('');
  targetElement.appendChild(commentNode);
  const childNodes: Node[] = [];

  return {
    childNodes,
    removeChild(node: Node) {
      const idx = childNodes.indexOf(node);
      if (idx >= 0) {
        targetElement.removeChild(node);
        childNodes.splice(idx, 1);
      }
    },
    appendChild(node: Node) {
      const lastNode = childNodes[childNodes.length - 1] || commentNode;
      targetElement.insertBefore(node, lastNode);
      childNodes.push(node);
    },
    addEventListener(
      type: string,
      handler: (this: Element, event: Event) => void
    ) {
      targetElement.addEventListener(type, handler);
    },
    insertBefore<T extends Node>(node: T, child: Node | null) {
      targetElement.insertBefore(node, child);
      return node;
    },
    // dispose() {
    //   for (const node of nodes) {
    //     targetElement.removeChild(node);
    //   }
  };
}

interface ViewResult {
  url: UrlHelper;
  result: Disposable;
}
