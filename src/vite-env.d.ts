/// <reference types="vite/client" />

// Declare CSS modules
declare module '*.css' {
  const css: string;
  export default css;
}

// Declare CSS URL imports
declare module '*.css?url' {
  const url: string;
  export default url;
}
