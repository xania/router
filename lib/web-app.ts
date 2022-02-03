import * as Rx from 'rxjs';
import * as Ro from 'rxjs/operators';
import { RouteInput, Router } from './router';
import { RouterOutlet, RouterOutletProps } from './outlet';
import { RenderTarget } from '@xania/view';

export class BrowserRouter implements router.Navigator, Router {
  constructor() {}

  // [Rx.observable]() {
  //   return Rx.timer(0, 50).pipe(
  //     Ro.map(() => location.pathname),
  //     Ro.distinctUntilChanged(),
  //     Ro.map((pathname: string) => pathname.split('/').filter((x) => !!x))
  //   );
  // }

  getRoutes(basePath: router.Path) {
    return Rx.timer(0, 50).pipe(
      Ro.map(() => location.pathname),
      Ro.distinctUntilChanged(),
      Ro.map((pathname: string) => pathname.split('/').filter((x) => !!x)),
      Ro.filter((route) => startsWith(route, basePath)),
      Ro.map((route) => route.slice(basePath.length))
    );
  }

  execute(path: router.Path) {
    pushPath(path.join('/'));
  }
}

interface WebAppProps<T> {
  routes: RouteInput<T>[];
  target?: RenderTarget | string;
  render: RouterOutletProps<T>['render'];
}

export function WebApp<T>(props: WebAppProps<T>) {
  const { target, render, ...rest } = props;
  render(
    RouterOutlet({ ...rest, render, router: new BrowserRouter() }) as any,
    target || document.body
  );
}

function startsWith(route: router.Path, base: router.Path) {
  if (base.length === 0) return true;

  if (base.length > route.length) return false;

  for (var i = 0; i < base.length; i++) {
    if (pathCompare(base[i], route[i]) === false) return false;
  }

  return true;

  function pathCompare(prev: any, next: any) {
    if (prev !== next) {
      if (typeof prev === 'string') return false;

      if (prev.toString() !== next) return false;
    }

    return true;
  }
}

function pushPath(pathname: string) {
  let { pathname: old } = window.location;

  if (old + '/' === pathname) {
    console.log('replaceState', pathname);
    window.history.replaceState(null, '', pathname);
  } else if (old !== pathname) {
    window.history.pushState(null, '', pathname);
  } else {
    // console.error("same as ", pathname);
  }
}
