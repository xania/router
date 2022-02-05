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
    const { params } = resolution;

    const context: RouteContext = {
      url,
      path: url.path,
      params,
      // childRouter(_: PathResolver<TView> | RouteInput<TView>[]) {
      //   // createRouter(childRoutes$, mappings, this);
      // },
    };

    function renderView(view: any) {
      try {
        const element = (view as any)(context);
        if (!isPromise(element)) {
          props.render(element, targetElement);
        } else {
          element.then(renderView);
        }
      } catch {
        const component = Reflect.construct(view as Function, [context]);
        props.render(component, targetElement);
      }
    }

    renderView(resolution.view);

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

function isPromise(x: any): x is Promise<any> {
  return !!x && x.then instanceof Function;
}

interface ViewResult {
  url: UrlHelper;
  result: Disposable;
}
