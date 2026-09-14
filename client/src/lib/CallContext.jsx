import { createContext, useContext, useState } from 'react';

const CallContext = createContext(null);

/**
 * Holds the active video call's state ABOVE the page router, so
 * navigating between admin/dashboard pages doesn't unmount (and
 * disconnect) the call — only leave() actually ends it.
 */
export function CallProvider({ children }) {
  const [activeCall, setActiveCall] = useState(null); // { roomName, token, role }
  const [minimized, setMinimized] = useState(false);

  function startCall(call) {
    setActiveCall(call);
    setMinimized(false);
  }
  function minimize() {
    setMinimized(true);
  }
  function maximize() {
    setMinimized(false);
  }
  function leave() {
    setActiveCall(null);
    setMinimized(false);
  }

  return (
    <CallContext.Provider value={{ activeCall, minimized, startCall, minimize, maximize, leave }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within a CallProvider');
  return ctx;
}
