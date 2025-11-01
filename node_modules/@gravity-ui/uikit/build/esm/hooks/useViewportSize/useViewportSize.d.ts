export interface UseViewportSizeResult {
    width?: number;
    height?: number;
}
/**
 * A hook to get the size of the viewport when resizing
 *
 * @return - {width, height}
 */
export declare const useViewportSize: () => UseViewportSizeResult;
