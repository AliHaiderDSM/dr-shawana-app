import type { UnknownAction } from '@reduxjs/toolkit';

interface NetworkActions {
  onOnline: () => UnknownAction;
  onOffline: () => UnknownAction;
}

let actions: NetworkActions | null = null;
let offline = false;

export function registerNetworkActions(next: NetworkActions) {
  actions = next;
}

export function networkResult(dispatch: (action: UnknownAction) => unknown, reachable: boolean) {
  if (!actions || reachable !== offline) return;
  offline = !reachable;
  dispatch(reachable ? actions.onOnline() : actions.onOffline());
}
