import { Template } from '@xania/view';
import * as Rx from 'rxjs';
import * as Ro from 'rxjs/operators';
import { Router } from 'types/router';
import { RouterOutlet } from './outlet';
import { RouteInput } from './route';

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

interface BrowserOutletProps<T> {
  routes: RouteInput<T>[];
}

export function BrowserOutlet<T extends Template>(
  props: BrowserOutletProps<T>
) {
  return RouterOutlet({ ...props, router: new BrowserRouter() });
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
