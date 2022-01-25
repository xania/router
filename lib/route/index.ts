import { PathTemplate } from 'lib/resolvers/path-template';

interface PathMatcher {
  call(path: router.Path): RouteSegment;
}

export interface Route<TView> {
  path: PathTemplate;
  view: TView;
  resolve?: router.PathResolver<TView>;
}

interface RouteSegment {
  path: router.Path;
  params: router.RouteParams;
}

export interface ComponentRoute<TView> {
  path: PathTemplate;
  component: () => RouterComponent<TView>;
}

export type RouteInput<TView> = Route<TView> | ComponentRoute<TView>;

export interface RouterComponent<TView = unknown> {
  view: TView;
  routes?: RouteInput<TView>[];
}

export function route<TView>(
  path: Route<TView>['path'],
  view: Route<TView>['view']
): Route<TView> {
  return {
    path,
    view,
  };
}
