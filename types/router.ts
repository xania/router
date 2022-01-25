import type { Observable } from 'rxjs';

export interface Router extends router.Navigator {
  getRoutes(basePath: router.Path): Observable<router.Path>;
}
