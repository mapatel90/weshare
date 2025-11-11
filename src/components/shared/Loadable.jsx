// Import Dependencies
import { Suspense } from "react";

// ----------------------------------------------------------------------

function Loadable(Component, Fallback) {
  return function LoadableComponent(props) {
    return (
      <Suspense fallback={Fallback ? <Fallback /> : null}>
        <Component {...props} />
      </Suspense>
    );
  };
}

export { Loadable };
