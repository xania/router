import type { Observable } from 'rxjs';
import { UrlHelper } from './helpers/url-helper';

export interface Router extends router.Navigator {
  getRoutes(basePath: router.Path): Observable<router.Path>;
}
export interface PathResolved<TView> {
  appliedPath: router.Path;
  params?: router.RouteParams;
  view: Route<TView>['view'];
  resolve?: PathResolver<TView>;
}

export type PathResolution<TView> = PathResolved<TView> | router.PathNotFound;
export interface PathResolver<T> {
  (path: router.Path): PromiseLike<PathResolution<T>>;
}

export type ViewFn<TView> = (
  context?: RouteContext
) => TView | ViewPromise<TView>;
export interface ViewConstructor<TView> {
  new (context?: RouteContext): TView;
}

export type ViewPromise<TView> = PromiseLike<TView>;

export interface Route<TView> {
  match: PathMatcher;
  view: ViewFn<TView> | ViewConstructor<TView> | ViewPromise<TView>;
  resolve?: PathResolver<TView>;
}

export type PathMatcher = (path: router.Path) => PathMatchResult | null;

export interface PathMatchResult {
  segment: router.Path;
  params: router.RouteParams;
}

export type RouteInput<TView> = Route<TView>;

export interface RouteContext {
  url: UrlHelper;
  path: string[];
  params?: router.RouteParams | null;
}

// export type RouterComponent<TView = unknown> = (context: ViewContext) => TView;
