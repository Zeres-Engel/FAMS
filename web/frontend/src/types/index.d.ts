declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'react-router-dom' {
  export interface NavigateOptions {
    replace?: boolean;
    state?: any;
  }
  
  export function Navigate(props: { to: string } & NavigateOptions): JSX.Element;
  export function BrowserRouter(props: any): JSX.Element;
  export function Routes(props: any): JSX.Element;
  export function Route(props: any): JSX.Element;
  export function useNavigate(): (path: string, options?: NavigateOptions) => void;
}

declare module 'react' {
  export function useState<T>(initialState: T): [T, (newState: T) => void];
} 