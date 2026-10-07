# Women Without Fear — The Legacy Project

Static website for The Legacy Project and Women Without Fear: 36 women who resisted the Nazi regime, including Jewish resistance figures and non-Jewish rescuers.

The manuscript is complete and preparing for publication. A documentary series and educational adaptations are in development; no fixed episode count or curriculum adoption is asserted.

## Live site and deployment

Live website: https://legacy.ngo/

Production is the existing Cloudflare Pages project `legacy-ngo`. Pushing GitHub branch `main` automatically publishes the full repository to its configured domains. This is plain HTML/CSS/JS with no build step or deployment command.

Work on a branch from current `main`, push it, and verify its actual Cloudflare branch preview URL and commit. After verification, fast-forward `main` to the reviewed branch and push `origin main`. Capture the current production deployment and commit before publishing. If rollback is needed, roll back in Cloudflare and correct Git so the next push does not reintroduce the change.

Do not use direct upload, a replacement hosting project or DNS changes. Historical GitHub Pages settings are not the active production host. Preserve the complete repository, including `sample/med`, `sample/pages`, `assets`, donation files, partnership forms and routing configuration.

## Reader

`/sample/` opens Chapter 23 on sample page 14. `#p1` through `#p24` deep links remain supported. Section shortcuts lead to contents (3), the author's note (5), chapter (14), map (22), further reading (23), and cover (1).

## Contact

info@legacy.ngo
