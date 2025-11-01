import * as React from 'react';
import type { Toaster } from "../Toaster.js";
type Props = React.PropsWithChildren<{
    toaster: Toaster;
}>;
export declare const ToasterProvider: {
    ({ toaster, children }: Props): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export {};
