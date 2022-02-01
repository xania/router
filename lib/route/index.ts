import { PathTemplate } from '../resolvers/path-template';
import { PathMatcher, PathResolver, Route } from '../router';
import { pathMatcher } from './path-matcher';

export function route<TView>(
  path: string | PathTemplate | PathMatcher,
  view: Route<TView>['view'],
  resolve?: PathResolver<TView>
): Route<TView> {
  return {
    match: pathMatcher(path),
    view,
    resolve,
  };
}

export function fallback<TView>(view: Route<TView>['view']): Route<TView> {
  return {
    match(path: router.Path) {
      return { segment: path, params: {} };
    },
    view,
  };
}
