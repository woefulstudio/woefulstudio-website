
/* Woeful Studio — Victor & Violet Comments and Likes */

const db = window.supabaseClient;

let socialRequestId = 0;

// Get the currently displayed episode.
function getEpisodeId() {
  return window.currentComicEpisode || 1;
}

// Give each reader an anonymous account.
async function getReader() {
  if (!db) {
    throw new Error("Supabase client is not connected.");
  }

  const { data: sessionData, error: sessionError } =
    await db.auth.getSession();

  if (sessionError) throw sessionError;

  if (sessionData.session?.user) {
    return sessionData.session.user;
  }

  const { data, error } = await db.auth.signInAnonymously();

  if (error) throw error;

  return data.user;
}

// Display comments for one episode.
async function loadComments(episodeId = getEpisodeId()) {
  const list = document.getElementById("comments-list");
  if (!list || !db) return;

  const requestId = ++socialRequestId;
  list.textContent = "Loading comments...";

  const { data, error } = await db
    .from("comic_comments")
    .select("id, user_id, display_name, comment_text, created_at")
    .eq("episode_id", episodeId)
    .order("created_at", { ascending: false });

  if (requestId !== socialRequestId) return;

  if (error) {
    console.error("Loading comments failed:", error);
    list.textContent = "Unable to load comments.";
    return;
  }

  const { data: sessionData } = await db.auth.getSession();
  const currentUserId = sessionData.session?.user?.id;

  list.replaceChildren();

  if (!data || data.length === 0) {
    list.textContent = "No comments yet. Be the first!";
    return;
  }

  for (const comment of data) {
    const box = document.createElement("div");
    const name = document.createElement("strong");
    const message = document.createElement("p");

    box.className = "comic-comment";
    name.textContent = comment.display_name;
    message.textContent = comment.comment_text;

    box.append(name, message);

    // Only the author sees their Delete button.
    if (currentUserId && comment.user_id === currentUserId) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", async () => {
        if (!confirm("Delete your comment?")) return;

        deleteButton.disabled = true;

        const { error } = await db
          .from("comic_comments")
          .delete()
          .eq("id", comment.id)
          .eq("user_id", currentUserId);

        if (error) {
          console.error("Delete failed:", error);
          alert("Couldn't delete the comment.");
          deleteButton.disabled = false;
          return;
        }

        await loadComments(getEpisodeId());
      });

      box.appendChild(deleteButton);
    }

    list.appendChild(box);
  }
}

// Save a new comment.
async function postComment(event) {
  event.preventDefault();

  const nameInput = document.getElementById("comment-name");
  const textInput = document.getElementById("comment-text");
  const status = document.getElementById("comment-message");
  const submitButton = event.currentTarget.querySelector(
    'button[type="submit"]'
  );

  const name = nameInput.value.trim();
  const comment = textInput.value.trim();

  if (!name || !comment) return;

  const episodeId = getEpisodeId();

  status.textContent = "Posting comment...";
  submitButton.disabled = true;

  try {
    const user = await getReader();

    const { error } = await db.from("comic_comments").insert({
      episode_id: episodeId,
      user_id: user.id,
      display_name: name,
      comment_text: comment
    });

    if (error) throw error;

    textInput.value = "";
    status.textContent = "Comment posted! 💜";

    await loadComments(getEpisodeId());
  } catch (error) {
    console.error("Posting comment failed:", error);
    status.textContent = "Couldn't post comment. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
}

// Display likes for the current episode.
async function loadLikes(episodeId = getEpisodeId()) {
  const count = document.getElementById("like-count");
  const button = document.getElementById("like-button");

  if (!count || !button || !db) return;

  const { count: total, error } = await db
    .from("comic_likes")
    .select("*", { count: "exact", head: true })
    .eq("episode_id", episodeId);

  if (episodeId !== getEpisodeId()) return;

  if (error) {
    console.error("Loading likes failed:", error);
    count.textContent = "—";
    return;
  }

  count.textContent = total ?? 0;

  const { data: sessionData } = await db.auth.getSession();
  const userId = sessionData.session?.user?.id;

  let liked = false;

  if (userId) {
    const { data, error: likeError } = await db
      .from("comic_likes")
      .select("id")
      .eq("episode_id", episodeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (episodeId !== getEpisodeId()) return;

    if (likeError) {
      console.error("Checking like failed:", likeError);
    } else {
      liked = Boolean(data);
    }
  }

  button.textContent = liked ? "♥ Liked " : "♡ Like ";

  const number = document.createElement("span");
  number.id = "like-count";
  number.textContent = total ?? 0;

  button.appendChild(number);
  button.setAttribute("aria-pressed", String(liked));
}

// Like or unlike an episode.
async function toggleLike() {
  const button = document.getElementById("like-button");
  const episodeId = getEpisodeId();

  button.disabled = true;

  try {
    const user = await getReader();

    const { data: existing, error: lookupError } = await db
      .from("comic_likes")
      .select("id")
      .eq("episode_id", episodeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing) {
      const { error } = await db
        .from("comic_likes")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (error) throw error;
    } else {
      const { error } = await db.from("comic_likes").insert({
        episode_id: episodeId,
        user_id: user.id
      });

      if (error) throw error;
    }

    await loadLikes(getEpisodeId());
  } catch (error) {
    console.error("Like failed:", error);
    alert("Couldn't update your like. Please try again.");
  } finally {
    button.disabled = false;
  }
}

// Refresh comments and likes when changing episodes.
window.loadComicSocial = function (episodeId) {
  window.currentComicEpisode = episodeId;
  loadComments(episodeId);
  loadLikes(episodeId);
};

// Set up the social features.
function initializeComicSocial() {
  const form = document.getElementById("comment-form");
  const likeButton = document.getElementById("like-button");

  if (form) {
    form.addEventListener("submit", postComment);
  }

  if (likeButton) {
    likeButton.addEventListener("click", toggleLike);
  }

  window.loadComicSocial(getEpisodeId());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeComicSocial);
} else {
  initializeComicSocial();
}
