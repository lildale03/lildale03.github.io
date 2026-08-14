"use strict";

const GITHUB_USER = "lildale03";

const appsGrid = document.querySelector("#appsGrid");

const menuButton = document.querySelector("#menuButton");

const navLinks = document.querySelector("#navLinks");

menuButton.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");

  menuButton.setAttribute("aria-expanded", String(open));

  menuButton.textContent = open ? "×" : "☰";
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");

    menuButton.setAttribute("aria-expanded", "false");

    menuButton.textContent = "☰";
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();

function titleFromName(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeText(tag, className, text) {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  node.textContent = text;

  return node;
}

function createAppCard(repository) {
  const card = document.createElement("a");

  card.className = "app-card";

  card.href =
    repository.homepage ||
    `https://${GITHUB_USER}.github.io/` +
      `${encodeURIComponent(repository.name)}/`;

  card.target = "_blank";
  card.rel = "noopener noreferrer";

  /*
    The title is a direct child of the card,
    so it always remains visible.
  */
  const title = makeText("h3", "app-title", titleFromName(repository.name));

  /*
    Only this details container is hidden
    while the card is minimized.
  */
  const details = makeText("div", "app-details", "");

  const description = makeText(
    "p",
    "",
    repository.description || "Open this application.",
  );

  const tags = makeText("div", "tags", "");

  (repository.topics || []).slice(0, 3).forEach((topic) => {
    tags.append(makeText("span", "tag", topic));
  });

  if (repository.language) {
    tags.append(makeText("span", "tag", repository.language));
  }

  details.append(description, tags);

  card.append(title, details);

  return card;
}

function showApps(repositories) {
  const apps = repositories.filter(
    (repository) =>
      repository.has_pages &&
      !repository.archived &&
      repository.name.toLowerCase() !==
        `${GITHUB_USER}.github.io`.toLowerCase(),
  );

  appsGrid.replaceChildren();

  if (!apps.length) {
    appsGrid.append(makeText("div", "message", "No published apps found yet."));

    return;
  }

  apps.sort(
    (first, second) => new Date(second.updated_at) - new Date(first.updated_at),
  );

  apps.forEach((repository) => {
    appsGrid.append(createAppCard(repository));
  });
}

async function loadGitHub() {
  try {
    const responses = await Promise.all([
      fetch(`https://api.github.com/users/` + `${GITHUB_USER}`),

      fetch(
        `https://api.github.com/users/` +
          `${GITHUB_USER}/repos` +
          `?sort=updated&per_page=100`,
      ),
    ]);

    if (!responses.every((response) => response.ok)) {
      throw new Error("GitHub API request failed");
    }

    const profile = await responses[0].json();

    const repositories = await responses[1].json();

    document.querySelector("#avatar").src = profile.avatar_url;

    document.querySelector("#profileName").textContent =
      profile.name || "Dakota";

    document.querySelector("#profileBio").textContent =
      profile.bio || "IT professional, builder, and problem solver.";

    showApps(repositories);

    localStorage.setItem(
      "dakota-repositories",
      JSON.stringify({
        saved: Date.now(),
        repositories,
      }),
    );
  } catch (error) {
    console.error(error);

    const cached = localStorage.getItem("dakota-repositories");

    if (cached) {
      try {
        const stored = JSON.parse(cached);

        showApps(stored.repositories);

        return;
      } catch (cacheError) {
        console.error(cacheError);
      }
    }

    appsGrid.replaceChildren(
      makeText(
        "div",
        "message",
        "GitHub projects could not be loaded right now. Please try again shortly.",
      ),
    );
  }
}

loadGitHub();
