/* Water caustics background. Raw WebGL 1, one full-screen fragment shader, no libraries.
 * mountWater(canvas, themeKey) -> { setTheme(key), destroy() } */

export type Theme = {
  mode: number; label: string; swatch: string;
  a: [number, number, number]; b: [number, number, number]; c: [number, number, number]; speed: number;
};

export const THEMES: Record<string, Theme> = {
  ocean: { mode: 0, label: "Ocean", swatch: "linear-gradient(135deg, #0d4569, #26849f 60%, #d9f7ff)",
    a: [0.05, 0.27, 0.42], b: [0.15, 0.52, 0.66], c: [0.85, 0.97, 1.0], speed: 0.4 },
  deep: { mode: 0, label: "Deep", swatch: "linear-gradient(135deg, #0b1620, #365c77 60%, #6ae0ff)",
    a: [0.04, 0.09, 0.13], b: [0.21, 0.36, 0.47], c: [0.42, 0.88, 1.0], speed: 0.3 },
  lagoon: { mode: 0, label: "Lagoon", swatch: "linear-gradient(135deg, #0f6b6b, #3badca 60%, #eafff9)",
    a: [0.06, 0.42, 0.42], b: [0.23, 0.68, 0.79], c: [0.92, 1.0, 0.97], speed: 0.45 },
  dusk: { mode: 0, label: "Dusk", swatch: "linear-gradient(135deg, #2b2340, #7a5a7a 60%, #ffd9c2)",
    a: [0.17, 0.14, 0.25], b: [0.48, 0.35, 0.48], c: [1.0, 0.85, 0.76], speed: 0.3 },
  none: { mode: -1, label: "Plain", swatch: "linear-gradient(135deg, #e9ecef, #dde1e5)",
    a: [0, 0, 0], b: [0, 0, 0], c: [0, 0, 0], speed: 0 },
};

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 u_res; uniform float u_t; uniform vec3 u_a; uniform vec3 u_b; uniform vec3 u_c;
#define TAU 6.28318530718
#define MAX_ITER 5
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv; p.x *= u_res.x / u_res.y;
  p = mod(p * TAU, TAU) - 250.0;
  vec2 i = p;
  float c = 1.0;
  float inten = 0.005;
  for (int n = 0; n < MAX_ITER; n++) {
    float t = u_t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
  }
  c /= float(MAX_ITER);
  c = 1.17 - pow(c, 1.4);
  float v = pow(abs(c), 8.0) * 0.9;
  float depth = smoothstep(0.0, 1.0, uv.y * 0.85 + uv.x * 0.15);
  vec3 col = mix(u_a, u_b, depth) + u_c * v * 0.55;
  col *= 0.88 + 0.12 * smoothstep(1.35, 0.35, length(uv - 0.5));
  gl_FragColor = vec4(col, 1.0);
}`;

export function mountWater(canvas: HTMLCanvasElement, themeKey: string) {
  const parent = canvas.parentElement as HTMLElement;
  let theme = THEMES[themeKey] ?? THEMES.ocean;
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const gl = canvas.getContext("webgl", { antialias: false, alpha: false }) as WebGLRenderingContext | null;

  function paintFallback() {
    canvas.style.display = "none";
    parent.style.background = theme.swatch;
  }

  if (!gl) { paintFallback(); return { setTheme(k: string) { theme = THEMES[k] ?? theme; paintFallback(); }, destroy() {} }; }

  function sh(type: number, src: string) {
    const s = gl!.createShader(type)!; gl!.shaderSource(s, src); gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(s) ?? "shader");
    return s;
  }
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
  } catch { paintFallback(); return { setTheme() {}, destroy() {} }; }

  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "u_res"), uT = gl.getUniformLocation(prog, "u_t");
  const uA = gl.getUniformLocation(prog, "u_a"), uB = gl.getUniformLocation(prog, "u_b"), uC = gl.getUniformLocation(prog, "u_c");

  let cssW = 0, cssH = 0, raf = 0, running = false;
  const start = performance.now();

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width === cssW && r.height === cssH) return;
    cssW = r.width; cssH = r.height;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(cssW * dpr)); canvas.height = Math.max(1, Math.round(cssH * dpr));
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }

  function draw(t: number) {
    resize();
    gl!.uniform2f(uRes, canvas.width, canvas.height);
    gl!.uniform1f(uT, t);
    gl!.uniform3f(uA, ...theme.a); gl!.uniform3f(uB, ...theme.b); gl!.uniform3f(uC, ...theme.c);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }

  function frame() {
    if (!running) return;
    draw(((performance.now() - start) / 1000) * theme.speed);
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (theme.mode < 0 || document.hidden) return;
    if (reduced) { running = false; draw(4.0); return; }
    if (!running) { running = true; raf = requestAnimationFrame(frame); }
  }
  function pause() { running = false; cancelAnimationFrame(raf); }

  function apply() {
    if (theme.mode < 0) { pause(); canvas.style.display = "none"; parent.style.background = "#e9ecef"; return; }
    canvas.style.display = ""; parent.style.background = theme.swatch;   // swatch shows until the first frame paints
    cssW = cssH = 0; play(); if (reduced) draw(4.0);
  }

  const onVis = () => (document.hidden ? pause() : play());
  const onResize = () => { cssW = cssH = 0; if (reduced) draw(4.0); else play(); };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("resize", onResize);
  apply();

  return {
    setTheme(k: string) { theme = THEMES[k] ?? theme; apply(); },
    destroy() { pause(); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("resize", onResize); },
  };
}
