import { PathResolved, PathResolver } from '../../types/router';

export type LinkedList<T> =
  | {
      head: T;
      tail?: LinkedList<T>;
    }
  | undefined;

export function cons<T>(head: T, tail: LinkedList<T>): LinkedList<T> {
  if (head) return { head, tail };
  else if (tail) return tail;
  else return undefined;
}

export function length<T>(x: LinkedList<T>): number {
  if (!x) {
    return 0;
  }
  return 1 + length(x.tail);
}

export function concat<T>(x?: LinkedList<T>, y?: LinkedList<T>): LinkedList<T> {
  if (!x) {
    return y;
  }
  return {
    head: x.head,
    tail: x.tail ? concat(x.tail, y) : y,
  };
}

export function map<T, U>(
  list: LinkedList<T>,
  project: (t: T, index: number, source: LinkedList<T>) => U
): LinkedList<U> {
  return _map(list, 0);

  function _map(l: LinkedList<T>, index: number): LinkedList<U> {
    if (!l) {
      return undefined;
    }
    return {
      head: project(l.head, index, list),
      tail: _map(l.tail, index + 1),
    };
  }
}

type ReduceCallBack<T, U> = (prev: U, next: T, idx: number) => U;
export function reduce<T, U>(
  callback: ReduceCallBack<T, U>,
  list: LinkedList<T>,
  seed: U
): U {
  if (!list) {
    return seed;
  }
  let result = seed;
  let l: LinkedList<T> | undefined = list;
  let idx = 0;
  while (l) {
    result = callback(result, l.head, idx++);
    l = l.tail;
  }
  return result;
}

export async function traverse<TView>(
  remainingPath: router.Path,
  resolve?: PathResolver<TView>
): Promise<LinkedList<PathResolved<TView>>> {
  if (!resolve) {
    return undefined;
  }

  const result = await resolve(remainingPath);
  if ('view' in result) {
    if (result.appliedPath.length === 0) {
      return {
        head: result,
      };
    }

    return {
      head: result,
      tail: await traverse(
        remainingPath.slice(result.appliedPath.length),
        result.resolve
      ),
    };
  } else {
    return undefined;
  }
}
