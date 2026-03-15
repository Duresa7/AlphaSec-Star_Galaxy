export function shouldShowAdminLoading({
  authResolved,
  authWaitExpired,
  hasSession,
  profileLoadingInitial,
}: {
  authResolved: boolean;
  authWaitExpired: boolean;
  hasSession: boolean;
  profileLoadingInitial: boolean;
}): boolean {
  if (!authResolved && !authWaitExpired) return true;
  return hasSession && profileLoadingInitial && !authWaitExpired;
}
