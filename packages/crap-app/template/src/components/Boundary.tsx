import React, {ReactNode, Suspense, SuspenseProps} from 'react';
import ErrorBoundary from "./ErrorBoundary";
import Spinner from "./Spinner";


export default ({children,fallback=<Spinner/>}: Partial<SuspenseProps>) => <ErrorBoundary><Suspense fallback={fallback}>{children}</Suspense></ErrorBoundary>