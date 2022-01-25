export class UrlHelper {
  constructor(public path: string[], public parent?: UrlHelper) {}

  stringify(...path: string[]) {
    const result = fullPath(this);
    result.push.apply(result, path);
    return '/' + result.join('/');
  }

  route(...path: string[]) {
    const result = fullPath(this);
    result.push.apply(result, path);
    return result;
  }
}

function fullPath(url?: UrlHelper) {
  const stack: UrlHelper[] = [];
  while (url) {
    stack.push(url);
    url = url.parent;
  }

  const result: router.Path = [];
  while (stack.length) {
    const curr = stack.pop() as UrlHelper;
    result.push.apply(result, curr.path);
  }
  return result;
}
