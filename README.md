# OASIS — Holonic Architecture

Minimalist explainer website for the OASIS holonic architecture.  
Swiss editorial design with subtle canvas animations.

## Setup

```bash
npm run dev
# opens at http://localhost:3000
```

Or just open `index.html` directly in a browser.

## Structure

```
oasis-holonic/
├── index.html          # Main page
├── css/
│   └── style.css       # All styles
├── js/
│   ├── main.js         # Scroll reveals, observers
│   ├── mesh.js         # Hero gradient mesh animation
│   ├── rings.js        # Concentric holon rings animation
│   ├── flow.js         # Data flow particle animation
│   └── orbit.js        # Celestial bodies orbital animation
└── package.json
```

## Animations

| Canvas | Section | What it does |
|--------|---------|-------------|
| `mesh.js` | Hero | Morphing blurred gradient blobs (AR.S style) |
| `rings.js` | What is a Holon | Concentric circles drawing + breathing |
| `flow.js` | Interoperability | Particles flowing between connected nodes |
| `orbit.js` | Holarchy | Celestial bodies in gentle orbital motion |

All animations use `requestAnimationFrame`, pause when off-screen, and respect `prefers-reduced-motion`.
