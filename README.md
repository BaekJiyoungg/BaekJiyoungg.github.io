# Jiyoung Baek — Personal Website

Static site, no build step. Dark/light editorial theme with an animated
network background (canvas) referencing spatial/network data.

## Edit content

Everything lives in `index.html`:

- **About** (`#about`) — bio paragraph, currently a drafted starting point.
- **Research** (`#research`) — 4 cards for your research areas.
- **Publications** (`#work`) — replace each `.pub-item` with your real
  papers (title, authors, venue, and link to a PDF).
- **Contact** (`#contact`) — update the `social-placeholder` links'
  `href="#"` with real URLs (Google Scholar, GitHub, X, LinkedIn, CV PDF).
  Drop your CV file into `assets/` and link it, e.g. `assets/cv.pdf`.

Colors, fonts, and spacing are in `style.css` under `:root` at the top
(`--accent` is the single accent color used throughout).

## Preview locally

```bash
cd ~/Documents/jiyoung-baek-website
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy for free (GitHub Pages)

```bash
cd ~/Documents/jiyoung-baek-website
git init
git add .
git commit -m "Initial site"
gh repo create jiyoung-baek.github.io --public --source=. --push
```

Then enable GitHub Pages in the repo settings (Settings → Pages → branch
`main`, root). If you name the repo `<username>.github.io`, the site is
served directly at `https://<username>.github.io`.

Alternatively, drag the folder into [Netlify Drop](https://app.netlify.com/drop)
for an instant URL, then connect a custom domain later.
