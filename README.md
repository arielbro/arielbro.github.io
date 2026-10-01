# Ariel Bruner, portfolio

Static site for GitHub Pages. No build step.

## Publish

1. Create a GitHub repository. Name it `<username>.github.io` to serve the site at `https://<username>.github.io/`; any other name serves it at `https://<username>.github.io/<repo>/`.
2. Push the contents of this folder to the `main` branch.
3. In the repository: Settings → Pages → Build and deployment → Deploy from a branch → `main`, `/ (root)`.

## Edit

- Card text, order, cover photo and photo order: `data.js` (format described at the top of the file).
- Add photos to a project: `python3 tools/add_photos.py <project-id> photo1.jpg photo2.heic ...` (needs `pip install pillow pillow-heif`). It writes resized copies to `img/<project-id>/` and prints the lines to paste into that project's `media` list.
- Profile photo: `img/profile.webp`.

Font: Bricolage Grotesque (SIL Open Font License, `fonts/OFL.txt`).
