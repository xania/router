import * as Rx from 'rxjs';
import * as Ro from 'rxjs/operators';
import { createPathResolver, ResolvedPath } from '../resolvers/path-resolver';
import {
  PathResolved,
  PathResolver,
  RouteInput,
  Router,
  ViewContext,
} from '../../types/router';
import { length, map } from '../helpers/linked-list';
import { render, Template } from '@xania/view';
import { RenderTarget } from '@xania/view';
import { UrlHelper } from '../../types/url-helper';

interface RouterOutletProps<TView> {
  router: Router;
  routes: RouteInput<TView>[];
}

interface Disposable {
  dispose(): void;
}

interface RouterContext {
  url: UrlHelper;
  navigator: router.Navigator;
}

export function RouterOutlet<TView extends Template>(
  props: RouterOutletProps<TView>
  // children: router.RouteInput<TView>[]
) {
  return {
    render(target: Element) {
      return createRouterOutlet<TView>(target, props);
    },
  };
}

function createRouterOutlet<TView extends Template>(
  targetElement: Element,
  props: RouterOutletProps<TView>
) {
  const childRoutes$ = new Rx.BehaviorSubject<string[]>([]);
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

    const context: ViewContext = {
      url,
      params,
      // childRouter(_: PathResolver<TView> | RouteInput<TView>[]) {
      //   // createRouter(childRoutes$, mappings, this);
      // },
    };

    const scope = createScope(targetElement);
    if (typeof view === 'function') {
      render(view(context), scope);
    } else {
      render(view, scope);
    }

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
    contains(node) {
      if (!node) return false;
      return childNodes.indexOf(node) >= 0;
    },
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
