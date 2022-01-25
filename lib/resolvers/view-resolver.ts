import { ComponentRoute, Route, RouteInput } from 'lib/route';
import { compilePathTemplate, PathTemplate } from './path-template';

export function createViewResolver<TView>(routes: RouteInput<TView>[]): any {
  if (isArrayEmpty(routes)) {
    return null;
  }

  const compiled = compile(routes);
  if (isArrayEmpty(compiled)) {
    // any resolution will end up with not found
    return (remainingPath: router.Path) => {
      return Promise.resolve<router.PathResolution<TView>>({
        appliedPath: remainingPath,
      });
    };
  }
  return (remainingPath: string[]) => {
    for (const route of compiled) {
      const segment = route.match(remainingPath);
      if (segment) {
        const { view } = route;
        const appliedPath = segment.path;
        return Promise.resolve<router.PathResolved<TView>>({
          appliedPath,
          view,
          params: segment.params,
          resolve: route.resolve,
        });
      }
    }
    const notFound: router.PathNotFound = {
      appliedPath: remainingPath,
    };
    return Promise.resolve(notFound);
  };

  function compile(routes: RouteInput<TView>[]): CompiledRoute<TView>[] {
    const results: CompiledRoute<TView>[] = [];
    if (Array.isArray(routes)) {
      for (const route of routes) {
        if (isRoute(route)) {
          results.push({
            match: pathMatcher(route.path),
            view: route.view,
            resolve: route.resolve,
          });
        } else {
          if (isComponentRoute(route)) {
            results.push(fromComponentRoute(route.path, route.component));
          } else {
            console.error('unsupported route', route);
          }
        }
      }
    }
    return results;
  }
}

function isArrayEmpty(arr: any[]) {
  return !Array.isArray(arr) || arr.length === 0;
}

function isRoute(value: any): value is Route<any> {
  return value && value.path && value.view;
}
function isComponentRoute(value: any): value is ComponentRoute<any> {
  return 'component' in value;
}

function memoize<TF extends (...args: any[]) => any>(fn: TF) {
  let result: any = null;
  let invoked = false;
  return function (..._: Parameters<TF>): ReturnType<TF> {
    if (invoked) {
      return result;
    }
    invoked = true;
    return (result = fn());
  };
}

function fromComponentRoute<TView>(
  path: PathTemplate,
  component: () => any
): CompiledRoute<TView> {
  const mem = memoize(() => {
    const comp = typeof component === 'function' ? component() : component;
    const view = 'view' in comp ? comp.view : comp;
    return {
      view,
      resolve: createViewResolver(comp.routes),
    };
  });
  return {
    match: pathMatcher(path),
    get view() {
      return mem().view;
    },
    get resolve() {
      return mem().resolve;
    },
  };
}

interface PathMatchResult {
  path: router.Path;
  params: { [k: string]: any };
}

interface CompiledRoute<T> {
  match(
    path: router.Path
  ): { path: router.Path; params: { [k: string]: any } } | null;
  view: T;
  resolve?: router.PathResolver<T>;
}

function pathMatcher(
  pathTemplate: PathTemplate
): (path: router.Path) => PathMatchResult | null {
  if (!Array.isArray(pathTemplate)) return pathMatcher([pathTemplate]);
  const matchers = compilePathTemplate(pathTemplate);
  return (path: router.Path) => {
    const { length } = pathTemplate;
    if ((length === 0 && path.length > 0) || length > path.length) {
      return null;
    }
    const params = {};
    for (var i = 0; i < length; i++) {
      const match = matchers[i](path[i]);
      if (!match) {
        return null;
      } else if (match !== true) {
        Object.assign(params, match);
      }
    }
    return {
      path: path.slice(0, length),
      params,
    } as PathMatchResult;
  };
}
