# Women Without Fear — The Legacy Project

Static website for The Legacy Project and Women Without Fear: the verified stories of 36 women who defied the Nazi regime, 1933–1945 - Jewish resisters and non-Jewish rescuers.

The manuscript is complete and preparing for publication. A documentary series and educational adaptations are in development; no fixed episode count or curriculum adoption is asserted.

## Live site and deployment

Live website: https://legacy.ngo/ (also www.legacy.ngo and stories.legacy.ngo).

Production is the existing Cloudflare Pages project `legacy-ngo`, a Direct Upload project with production branch `main`. Pushing to GitHub is source control only: it does not publish production or create previews.

Release steps:

1. Work on a branch from current `main`. Commit and push it.
2. Build a clean output from the reviewed commit, excluding repository files: `git archive <commit> | tar -x -C <out>`, then remove `README.md` and `CNAME` from `<out>`. Record SHA-256 checksums of every file.
3. Preview: `npx wrangler pages deploy <out> --project-name legacy-ngo --branch <working-branch> --commit-hash <commit>`. Check the preview URL and confirm the served files match the checksums.
4. Record the current production deployment ID as the rollback point, fast-forward `main` to the reviewed commit and push it.
5. Production: `npx wrangler pages deploy <out> --project-name legacy-ngo --branch main --commit-hash <commit>`. Verify all three domains.

Rollback: restore the recorded deployment in the Cloudflare dashboard, then revert the release commit in Git.

Cloudflare Pages accepts files up to 25 MiB each. Keep video files under 22 MiB.

## Media

`media/wwf-trailer-1080.mp4` is the full trailer (H.264/AAC, 1920x1080, 2:24), re-encoded for the web from the original edit. `media/wwf-teaser-20s.mp4` is the first 20 seconds of the trailer (1280x720), used as the muted homepage preview. The original edit is kept outside this repository.

## Portraits

`assets/img/women/` contains the archival photographs (`*-original.jpg`) and their charcoal-style tone treatments (`*-charcoal.jpg`). Sources and licences are credited on the homepage. Rachel Auerbach and Faye Schulman have no portrait yet because reuse rights have not been confirmed.

## Reader

`/sample/` opens Chapter 23 on sample page 14. `#p1` through `#p24` deep links remain supported. Section shortcuts lead to contents (3), the author's note (5), chapter (14), map (22), further reading (23), and cover (1).

## Contact

info@legacy.ngo
