export function getPostLoginRoute(returnTo) {
  const route = Array.isArray(returnTo) ? returnTo[0] : returnTo;

  if (
    typeof route === 'string' &&
    route.startsWith('/') &&
    !route.startsWith('//') &&
    !route.startsWith('/(auth)')
  ) {
    return route;
  }

  return '/(tabs)';
}
