import { PathResolution, PathResolved, RouteInput } from '../router';

export function createViewResolver<TView>(routes: RouteInput<TView>[]): any {
  if (isArrayEmpty(routes)) {
    return null;
  }

  if (isArrayEmpty(routes)) {
    // any resolution will end up with not found
    return (remainingPath: router.Path) => {
      return Promise.resolve<PathResolution<TView>>({
        appliedPath: remainingPath,
      });
    };
  }
  return (remainingPath: string[]) => {
    for (const route of routes) {
      const result = route.match(remainingPath);
      if (result) {
        const { view } = route;
        const appliedPath = result.segment;
        return Promise.resolve<PathResolved<TView>>({
          appliedPath,
          view,
          params: result.params,
          resolve: route.resolve,
        });
      }
    }
    const notFound: router.PathNotFound = {
      appliedPath: remainingPath,
    };
    return Promise.resolve(notFound);
  };
}

function isArrayEmpty(arr: any[]) {
  return !Array.isArray(arr) || arr.length === 0;
}

// function memoize<TF extends (...args: any[]) => any>(fn: TF) {
//   let result: any = null;
//   let invoked = false;
//   return function (..._: Parameters<TF>): ReturnType<TF> {
//     if (invoked) {
//       return result;
//     }
//     invoked = true;
//     return (result = fn());
//   };
// }

// function fromComponentRoute<TView>(
//   match: PathMatcher,
//   component: () => any
// ): Route<TView> {
//   const mem = memoize(() => {
//     const comp = typeof component === 'function' ? component() : component;
//     const view = 'view' in comp ? comp.view : comp;
//     return {
//       view,
//       resolve: createViewResolver(comp.routes),
//     };
//   });
//   return {
//     match,
//     get view() {
//       return mem().view;
//     },
//     get resolve() {
//       return mem().resolve;
//     },
//   };
// }
