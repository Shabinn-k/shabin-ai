// types/css.d.ts
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module './globals.css' {
  const content: void;
  export default content;
}

declare module '@/app/globals.css' {
  const content: void;
  export default content;
}

declare module '*.css?inline' {
  const content: string;
  export default content;
}

// For CSS module imports
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}