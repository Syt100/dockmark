export type RouteTransitionInput = {
  matched: Array<{ path: string }>
  fullPath: string
}

export function routeTransitionKey(route: RouteTransitionInput) {
  return route.matched[0]?.path ?? route.fullPath
}
