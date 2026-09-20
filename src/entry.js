// index.html's real entry point. Welcome's onboarding (src/welcome/welcome.js) is now the front
// door at "/"; Andrei's original wizard in main.js survives only for the two routes it already
// owned before this switch — /recipes/{lang}/{slug} (the actual step-by-step lesson, which
// welcome.js hands off to once onboarding finishes) and /collection (the streak screen). Both are
// client-side routes main.js's own router reads from location.pathname on load, so this only has
// to pick which bundle to run.
const { pathname } = window.location;
if (pathname === "/collection" || pathname.startsWith("/recipes/")) {
  import("./main.js");
} else {
  import("./welcome/welcome.js");
}
