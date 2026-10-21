#!/usr/bin/env bash
#
# GitHub profile and repository makeover for IronLog.
#
# The automation token available in CI can push code and merge pull requests, but
# GitHub refuses it for account-level and repository-administration writes
# ("Resource not accessible by integration"). This script performs those steps using
# YOUR OWN GitHub CLI login, which has full scope.
#
# Run it from anywhere inside this repository:
#
#     bash scripts/setup-github.sh
#
# Every step is idempotent, so re-running it is safe. Add --dry-run to print what
# it would change without writing anything.

set -uo pipefail

OWNER="shogun-support-99"
REPO="fitness"
FULL="$OWNER/$REPO"
PROFILE_REPO="$OWNER/$OWNER"

SITE="https://$OWNER.github.io/$REPO/"
APP="https://$OWNER.github.io/$REPO/app/"

DESCRIPTION="IronLog — an offline-first strength training log. Workout logger, exercise library, rest timer and personal records. No account, no server, no tracking."
BIO="Building IronLog — an offline-first strength training log. Static web apps: no backend, no build step, no tracking."
TOPICS="fitness workout-tracker strength-training javascript vanilla-js static-site github-pages pwa offline-first es-modules no-backend mit-license"

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

# ── Output helpers ───────────────────────────────────────────────────────────

if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'
  RED=$'\033[31m'; YELLOW=$'\033[33m'; CYAN=$'\033[36m'; OFF=$'\033[0m'
else
  BOLD=""; DIM=""; GREEN=""; RED=""; YELLOW=""; CYAN=""; OFF=""
fi

step()  { printf '\n%s==>%s %s%s%s\n' "$CYAN" "$OFF" "$BOLD" "$1" "$OFF"; }
ok()    { printf '  %s✓%s %s\n' "$GREEN" "$OFF" "$1"; }
warn()  { printf '  %s!%s %s\n' "$YELLOW" "$OFF" "$1"; }
fail()  { printf '  %s✗%s %s\n' "$RED" "$OFF" "$1"; }
note()  { printf '  %s%s%s\n' "$DIM" "$1" "$OFF"; }

FAILED=0
SKIP_COUNT=0

# run <description> <command...> — executes unless dry-running, tolerating failure.
run() {
  local label="$1"; shift
  if (( DRY_RUN )); then
    note "[dry-run] $label"
    SKIP_COUNT=$((SKIP_COUNT + 1))
    return 0
  fi
  if output=$("$@" 2>&1); then
    ok "$label"
  else
    fail "$label"
    printf '%s\n' "$output" | sed 's/^/      /' | head -6
    FAILED=$((FAILED + 1))
  fi
}

# ── Preflight ────────────────────────────────────────────────────────────────

step "Preflight"

if ! command -v gh >/dev/null 2>&1; then
  fail "GitHub CLI (gh) is not installed."
  note "Install it from https://cli.github.com/ then re-run this script."
  exit 1
fi
ok "gh found: $(gh --version 2>/dev/null | head -1)"

if ! gh auth status >/dev/null 2>&1; then
  fail "You are not logged in to the GitHub CLI."
  note "Run:  gh auth login"
  note "Choose GitHub.com, HTTPS, and grant the default scopes plus 'repo'."
  exit 1
fi

ME="$(gh api user --jq .login 2>/dev/null || true)"
if [[ -z "$ME" ]]; then
  fail "Could not read the authenticated user."
  exit 1
fi
ok "Authenticated as $ME"

if [[ "$ME" != "$OWNER" ]]; then
  warn "This script is written for the account '$OWNER' but you are logged in as '$ME'."
  note "Edit OWNER, REPO, SITE and APP at the top of this file to match your account."
fi

if ! gh api "repos/$FULL" --jq .name >/dev/null 2>&1; then
  fail "Repository '$FULL' is not visible to this login."
  exit 1
fi
ok "Repository $FULL is reachable"

if ! git -C "$(dirname "$0")/.." rev-parse --show-toplevel >/dev/null 2>&1; then
  fail "This script must be run from inside a clone of the repository."
  exit 1
fi
ROOT="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)"
ok "Repository root: $ROOT"

# ── 1. Repository metadata ───────────────────────────────────────────────────

step "1. Repository description and homepage"

CURRENT_HOME="$(gh api "repos/$FULL" --jq .homepage 2>/dev/null || true)"
CURRENT_DESC="$(gh api "repos/$FULL" --jq .description 2>/dev/null || true)"

if [[ "$CURRENT_HOME" == "$SITE" && "$CURRENT_DESC" == "$DESCRIPTION" ]]; then
  ok "Already set correctly."
else
  run "Set description and homepage on $FULL" \
    gh repo edit "$FULL" --description "$DESCRIPTION" --homepage "$SITE"
fi

note "homepage: $SITE"

# ── 2. Topics ────────────────────────────────────────────────────────────────

step "2. Repository topics"

mapfile -t TOPIC_ARGS < <(printf -- '-f names[]=%s\n' $TOPICS)
run "Apply topics to $FULL" \
  gh api -X PUT "repos/$FULL/topics" -H "Accept: application/vnd.github.mercy-preview+json" "${TOPIC_ARGS[@]}"

# ── 3. Social preview default branch ────────────────────────────────────────

step "3. Repository visibility check"

VIS="$(gh api "repos/$FULL" --jq .visibility 2>/dev/null || true)"
if [[ "$VIS" == "public" ]]; then
  ok "Repository is public, so GitHub Pages is available."
else
  warn "Repository visibility is '$VIS'."
  note "GitHub Pages on a private repository requires GitHub Pro or Team."
fi

# ── 4. GitHub Pages ──────────────────────────────────────────────────────────

step "4. GitHub Pages"

PAGES_CODE="$(gh api "repos/$FULL/pages" --silent 2>/dev/null && echo 200 || echo missing)"
if [[ "$PAGES_CODE" == "200" ]]; then
  BUILD_TYPE="$(gh api "repos/$FULL/pages" --jq .build_type 2>/dev/null || true)"
  ok "Pages is enabled (build type: ${BUILD_TYPE:-unknown})."
else
  warn "Pages is not enabled yet."
  run "Enable Pages with Source: GitHub Actions" \
    gh api -X POST "repos/$FULL/pages" -f build_type=workflow
  note "If that fails, enable it by hand:"
  note "  https://github.com/$FULL/settings/pages  ->  Source: GitHub Actions"
fi

# ── 5. Profile bio and blog ─────────────────────────────────────────────────

step "5. Profile bio and website"

CUR_BIO="$(gh api user --jq '.bio // ""' 2>/dev/null || true)"
CUR_BLOG="$(gh api user --jq '.blog // ""' 2>/dev/null || true)"

if [[ "$CUR_BIO" == "$BIO" && "$CUR_BLOG" == "$SITE" ]]; then
  ok "Profile bio and website already set."
else
  run "Set profile bio and website link" \
    gh api -X PATCH /user -f bio="$BIO" -f blog="$SITE"
  note "bio:  $BIO"
  note "link: $SITE"
fi

# ── 6. Profile README repository ────────────────────────────────────────────

step "6. Profile README"

PROFILE_SOURCE="$ROOT/docs/profile/README.md"
if [[ ! -f "$PROFILE_SOURCE" ]]; then
  fail "Expected profile README at docs/profile/README.md but it is missing."
  FAILED=$((FAILED + 1))
else
  ok "Found profile README content: docs/profile/README.md"

  if gh api "repos/$PROFILE_REPO" --jq .name >/dev/null 2>&1; then
    ok "Profile repository $PROFILE_REPO already exists."
    EXISTS=1
  else
    EXISTS=0
    run "Create the special profile repository $PROFILE_REPO" \
      gh repo create "$PROFILE_REPO" --public --description "My GitHub profile"
  fi

  if (( DRY_RUN )); then
    note "[dry-run] would clone $PROFILE_REPO, add README.md and push"
    SKIP_COUNT=$((SKIP_COUNT + 1))
  else
    WORK="$(mktemp -d)"
    trap 'rm -rf "$WORK"' EXIT

    if git clone -q "https://github.com/$PROFILE_REPO.git" "$WORK/profile" 2>/dev/null; then
      ok "Cloned $PROFILE_REPO"
    else
      # A brand-new empty repository can be cloned too, but guard anyway.
      mkdir -p "$WORK/profile"
      git -C "$WORK/profile" init -q -b main
      git -C "$WORK/profile" remote add origin "https://github.com/$PROFILE_REPO.git"
      warn "Could not clone $PROFILE_REPO; initialised an empty checkout instead."
    fi

    cp "$PROFILE_SOURCE" "$WORK/profile/README.md"

    git -C "$WORK/profile" add README.md
    if git -C "$WORK/profile" diff --cached --quiet; then
      ok "Profile README is already up to date."
    else
      git -C "$WORK/profile" -c user.name="$ME" -c user.email="$ME@users.noreply.github.com" \
        commit -q -m "docs: publish profile README"
      BRANCH="$(git -C "$WORK/profile" rev-parse --abbrev-ref HEAD)"
      if git -C "$WORK/profile" push -q -u origin "$BRANCH"; then
        ok "Pushed profile README to $PROFILE_REPO ($BRANCH)."
        note "It appears at the top of https://github.com/$ME"
      else
        fail "Could not push to $PROFILE_REPO."
        note "Push it by hand: copy docs/profile/README.md into that repository as README.md."
        FAILED=$((FAILED + 1))
      fi
    fi
  fi
fi

# ── 7. Trigger a deploy ─────────────────────────────────────────────────────

step "7. Redeploy the site"

if (( DRY_RUN )); then
  note "[dry-run] would dispatch the deploy workflow"
  SKIP_COUNT=$((SKIP_COUNT + 1))
else
  if gh workflow list --repo "$FULL" 2>/dev/null | grep -qi "deploy"; then
    if gh workflow run "deploy.yml" --repo "$FULL" --ref main 2>/dev/null; then
      ok "Requested a deploy run on main."
    else
      warn "Could not dispatch the workflow (it may need workflow_dispatch enabled)."
      note "Any push to main also triggers a deploy automatically."
    fi
  else
    note "No deploy workflow found yet; it is added by the repository contents."
  fi
fi

# ── Summary ─────────────────────────────────────────────────────────────────

printf '\n%s%s%s\n' "$BOLD" "──────────────────────────────────────────────" "$OFF"

if (( DRY_RUN )); then
  printf '%sDry run complete.%s %s action(s) would run, nothing was written.\n' "$BOLD" "$OFF" "$SKIP_COUNT"
elif (( FAILED == 0 )); then
  printf '%s%sDone — every step succeeded.%s\n' "$GREEN" "$BOLD" "$OFF"
else
  printf '%s%sFinished with %s failed step(s).%s See the messages above.\n' "$YELLOW" "$BOLD" "$FAILED" "$OFF"
fi

cat <<EOF

  ${BOLD}Live links${OFF}
    Landing page  $SITE
    The app       $APP
    Repository    https://github.com/$FULL
    Profile       https://github.com/$OWNER
    Deploy runs   https://github.com/$FULL/actions

  ${BOLD}Remaining manual step${OFF} (cannot be done through the API)
    Pin the repository so it shows on your profile:
      https://github.com/$OWNER  ->  Customise your pins  ->  tick "$REPO"

EOF

exit $(( FAILED > 0 ? 1 : 0 ))
