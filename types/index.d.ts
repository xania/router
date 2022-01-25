declare namespace router {
  export type Path = string[];

  export interface Navigator {
    execute(path: Path): void;
  }

  export interface PathResolver<T> {
    (path: Path): Promise<PathResolved<T>>;
  }

  export interface ViewContext {}

  export interface Disposable {}

  export type PathResolution<TView> = PathResolved<TView> | PathNotFound;
  export interface PathNotFound {
    appliedPath: Path;
  }
  export interface PathResolved<TView> {
    appliedPath: Path;
    params?: RouteParams;
    view: TView;
    resolve?: PathResolver<TView>;
  }

  export interface RouteParams {
    [key: string]: any;
  }
}
