
/* ==========================================
   VICTOR & VIOLET — COMIC READER
   WOEFUL STUDIO
   ========================================== */

const episodes = [
  {
    title: "Blood Flakes",
    image: "images/episode-1.png.jpg"
  },
  {
    title: "Sunlight Experiment",
    image: "images/episode-2.png"
  },
  {
    title: "Finding Our People",
    image: "images/episode-3.png.jpg"
  },
  {
    title: "Vampire Problems: Mirrors",
    image: "images/episode-4.png.jpg"
  },
  {
    title: "Kickball",
    image: "images/episode-5.png.jpg"
  },
  {
    title: "School Picture Day",
    image: "images/episode-6.png.jpg"
  },
  {
    title: "Meet Skellie",
    image: "images/episode-7.png.jpg"
  },
  {
    title: "The New Kid",
    image: "images/episode-8.png.jpg"
  }
];

let currentEpisode = 0;

function showEpisode() {
  const episode = episodes[currentEpisode];

  const title = document.getElementById("episode-title");
  const image = document.getElementById("comic-image");
  const counter = document.getElementById("episode-number");
  const previous = document.getElementById("previous-comic");
  const next = document.getElementById("next-comic");

  if (!title || !image || !counter || !previous || !next) {
    console.error("Comic reader elements not found.");
    return;
  }

  title.textContent = episode.title;
  image.src = episode.image;
  image.alt = episode.title + " - Victor & Violet webcomic";

  counter.textContent =
    "Episode " + (currentEpisode + 1) +
    " of " + episodes.length;

window.currentComicEpisode = currentEpisode + 1;

if (typeof window.loadComicSocial === "function") {
  window.loadComicSocial(window.currentComicEpisode);
}

  previous.disabled = currentEpisode === 0;
  next.disabled = currentEpisode === episodes.length - 1;
}

function changeEpisode(direction) {
  const newEpisode = currentEpisode + direction;

  if (newEpisode < 0 || newEpisode >= episodes.length) {
    return;
  }

  currentEpisode = newEpisode;
  showEpisode();
}

function initializeComicReader() {
  const previous = document.getElementById("previous-comic");
  const next = document.getElementById("next-comic");

  if (!previous || !next) {
    console.error("Navigation buttons not found.");
    return;
  }

  // Remove the old inline onclick handlers to prevent
  // the same click from being processed twice.
  previous.removeAttribute("onclick");
  next.removeAttribute("onclick");

  previous.addEventListener("click", function () {
    changeEpisode(-1);
  });

  next.addEventListener("click", function () {
    changeEpisode(1);
  });

  showEpisode();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeComicReader);
} else {
  initializeComicReader();
}
