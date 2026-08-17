import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue2';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import MarkdownIt from 'markdown-it';

// Resolve git version or fallback to default
let esVersion = 'v0.3.3';
try {
  esVersion = execSync('git describe --tags', { encoding: 'utf8' }).trim();
} catch (e) {
  // git describe failed, keep default
}

// Markdown loader plugin for help.md
function markdownPlugin() {
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true
  });

  return {
    name: 'vite-plugin-markdown-vue2',
    transform(code, id) {
      if (id.endsWith('.md')) {
        const html = md.render(code);
        const escapedHtml = html
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\${/g, '\\${');
        return {
          code: `
export default {
  name: 'HelpText',
  template: \`<section class="markdown-body">${escapedHtml}</section>\`
};
`,
          map: null
        };
      }
    }
  };
}

// Serve /static directory in dev and copy it to dist/static in build
function staticAssetsPlugin() {
  return {
    name: 'vite-plugin-static-assets',
    configureServer(server) {
      server.middlewares.use('/static', (req, res, next) => {
        const filePath = path.join(process.cwd(), 'static', req.url.split('?')[0]);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes = {
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject'
          };
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
    closeBundle() {
      const srcStatic = path.join(process.cwd(), 'static');
      const destStatic = path.join(process.cwd(), 'dist', 'static');
      if (fs.existsSync(srcStatic)) {
        fs.cpSync(srcStatic, destStatic, { recursive: true });
      }
    }
  };
}

export default defineConfig({
  plugins: [
    vue(),
    markdownPlugin(),
    staticAssetsPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      'vue$': 'vue/dist/vue.esm.js',
      'vue': 'vue/dist/vue.esm.js'
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'ES_VERSION': JSON.stringify(esVersion),
    'window.ES_VERSION': JSON.stringify(esVersion)
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
});
