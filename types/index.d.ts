declare namespace router {
  export type Path = string[];

  export interface Navigator {
    execute(path: Path): void;
  }

  export interface ViewContext {}

  export interface Disposable {}

  export interface PathNotFound {
    appliedPath: Path;
  }
  export interface RouteParams {
    [key: string]: any;
  }
}
