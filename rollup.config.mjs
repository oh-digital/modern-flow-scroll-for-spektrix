import terser from "@rollup/plugin-terser";

const input = "src/index.js";

export default [
  // ESM build (for bundlers + <script type="module">)
  {
    input,
    output: {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    }
  },

  // IIFE build (classic <script> tag global)
  {
    input,
    output: {
      file: "dist/modern-flow-scroll.js",
      format: "iife",
      name: "ModernFlowScroll",
      sourcemap: true,
      exports: "named",
    }
  },

  // IIFE minified
  {
    input,
    output: {
      file: "dist/modern-flow-scroll.min.js",
      format: "iife",
      name: "ModernFlowScroll",
      sourcemap: true,
      exports: "named",
    },
    plugins: [terser()],
  },
];
