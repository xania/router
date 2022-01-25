import { RouteInput } from 'lib/route';
import {
  concat,
  cons,
  LinkedList,
  reduce,
  traverse,
} from '../helpers/linked-list';
import { createViewResolver } from './view-resolver';

export interface ResolvedPath<T> {
  unchanged: LinkedList<router.PathResolved<T>>;
  newResolutions: LinkedList<router.PathResolved<T>>;
  remainingPath: router.Path;
}

export function createPathResolver<TView>(
  mappings: router.PathResolver<TView> | RouteInput<TView>[]
) {
  const rootResolve: router.PathResolver<TView> = isPathResolver(mappings)
    ? mappings
    : createViewResolver(mappings);
  let prev: LinkedList<router.PathResolved<TView>>;
  return async (route: router.Path) => {
    const { unchanged, remainingRoute, resolve } = unchangedResolutions<TView>(
      route,
      prev
    );
    const newResolutions = await traverse(
      remainingRoute,
      resolve || rootResolve
    );

    prev = concat(unchanged, newResolutions);
    const appliedLength = reduce((p, n) => p + n.appliedPath.length, prev, 0);

    const remainingPath = route.slice(appliedLength);
    return {
      unchanged,
      newResolutions,
      remainingPath,
    } as ResolvedPath<TView>;
  };
}

function unchangedResolutions<TView>(
  route: string[],
  prevlist: LinkedList<router.PathResolved<TView>>
): {
  remainingRoute: router.Path;
  unchanged?: LinkedList<router.PathResolved<TView>>;
  resolve?: router.PathResolver<TView>;
} {
  if (!prevlist) {
    return { remainingRoute: route };
  }

  const { head } = prevlist;
  if (isValidResolution(head, route)) {
    const { unchanged, remainingRoute, resolve } = unchangedResolutions<TView>(
      route.slice(head.appliedPath.length),
      prevlist.tail
    );
    return {
      unchanged: cons(head, unchanged),
      remainingRoute,
      resolve: resolve || head.resolve,
    };
  } else {
    return {
      remainingRoute: route,
      resolve: head.resolve,
    };
  }
}

function isValidResolution<TView>(
  result: router.PathResolution<TView>,
  remainingPath: string[]
): boolean {
  if (result && 'view' in result) {
    const { appliedPath } = result;
    if (appliedPath.length > remainingPath.length) {
      return false;
    }
    for (let i = 0; i < appliedPath.length; i++) {
      if (appliedPath[i] !== remainingPath[i]) return false;
    }
    return true;
  }
  return false;
}

function isPathResolver(mapping: any): mapping is router.PathResolver<any> {
  return mapping && typeof mapping === 'function';
}
