import { PathMatcher } from '../router';
import { compilePathTemplate, PathTemplate } from '../resolvers/path-template';

export function pathMatcher(
  pathTemplate: string | PathMatcher | PathTemplate
): PathMatcher {
  if (typeof pathTemplate === 'function') return pathTemplate;
  if (!Array.isArray(pathTemplate)) return pathMatcher(pathTemplate.split('/'));
  const matchers = compilePathTemplate(pathTemplate);
  return (path: router.Path) => {
    const { length } = pathTemplate;
    if ((length === 0 && path.length > 0) || length > path.length) {
      return null;
    }
    const params = {};
    for (var i = 0; i < length; i++) {
      const match = matchers[i](path[i]);
      if (!match) {
        return null;
      } else if (match !== true) {
        Object.assign(params, match);
      }
    }
    return {
      segment: path.slice(0, length),
      params,
    };
  };
}
