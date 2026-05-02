import type { SuspenseProps} from 'react';
import React, { Suspense} from 'react';
import ErrorBoundary from "./ErrorBoundary";
import Spinner from "./Spinner";


export default ({children,fallback=<Spinner/>}: Partial<SuspenseProps>) => <ErrorBoundary><Suspense fallback={fallback}>{children}</Suspense></ErrorBoundary>