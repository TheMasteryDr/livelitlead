/**
 * LIVE LIT LEAD - Main Application Logic
 * Implements BibleProject.com video explorer design, interactive theater modal,
 * filter engines, playlist integration, and secure Admin authentication.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const videoGrid = document.getElementById("videoGrid");
  const videoCountDisplay = document.getElementById("videoCountDisplay");
  const videoSearchInput = document.getElementById("videoSearchInput");
  const searchClearBtn = document.getElementById("searchClearBtn");
  const pillarTabs = document.getElementById("pillarTabs");
  const seriesFilterSelect = document.getElementById("seriesFilterSelect");
  const sortSelect = document.getElementById("sortSelect");
  const btnResetFilters = document.getElementById("btnResetFilters");

  // Video Theater Modal Elements
  const videoModal = document.getElementById("videoModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const modalYoutubeIframe = document.getElementById("modalYoutubeIframe");
  const modalPillarChip = document.getElementById("modalPillarChip");
  const modalSeriesName = document.getElementById("modalSeriesName");
  const modalVideoTitle = document.getElementById("modalVideoTitle");
  const modalVideoDate = document.getElementById("modalVideoDate");
  const modalVideoDuration = document.getElementById("modalVideoDuration");
  const modalVideoScripture = document.getElementById("modalVideoScripture");
  const modalVideoDesc = document.getElementById("modalVideoDesc");
  const modalYtLink = document.getElementById("modalYtLink");
  const btnShareVideo = document.getElementById("btnShareVideo");
  const tabBtnNotes = document.getElementById("tabBtnNotes");
  const tabBtnPlaylist = document.getElementById("tabBtnPlaylist");
  const tabPanelNotes = document.getElementById("tabPanelNotes");
  const tabPanelPlaylist = document.getElementById("tabPanelPlaylist");
  const modalTakeawaysList = document.getElementById("modalTakeawaysList");
  const modalScripturesContainer = document.getElementById("modalScripturesContainer");
  const modalChallengeText = document.getElementById("modalChallengeText");
  const modalPlaylistContainer = document.getElementById("modalPlaylistContainer");

  // Admin Elements
  const adminHeaderControls = document.getElementById("adminHeaderControls");
  const btnAdminAddVideo = document.getElementById("btnAdminAddVideo");
  const btnAdminLogout = document.getElementById("btnAdminLogout");
  const btnOpenAdminLogin = document.getElementById("btnOpenAdminLogin");
  const adminLoginModal = document.getElementById("adminLoginModal");
  const btnCloseAdminLoginModal = document.getElementById("btnCloseAdminLoginModal");
  const btnCancelAdminLogin = document.getElementById("btnCancelAdminLogin");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const adminPasscodeInput = document.getElementById("adminPasscodeInput");

  // Add Video Modal Elements (Admin Only)
  const addVideoModal = document.getElementById("addVideoModal");
  const btnCloseAddModal = document.getElementById("btnCloseAddModal");
  const btnCancelAddModal = document.getElementById("btnCancelAddModal");
  const addVideoForm = document.getElementById("addVideoForm");
  const inputYtUrl = document.getElementById("inputYtUrl");
  const previewThumbImg = document.getElementById("previewThumbImg");
  const previewPlaceholderText = document.getElementById("previewPlaceholderText");

  // Search Modal Elements
  const searchModal = document.getElementById("searchModal");
  const btnQuickSearch = document.getElementById("btnQuickSearch");
  const btnCloseSearchModal = document.getElementById("btnCloseSearchModal");
  const modalSearchInput = document.getElementById("modalSearchInput");
  const modalSearchResults = document.getElementById("modalSearchResults");

  // Toast Container
  const toastContainer = document.getElementById("toastContainer");

  // State
  let allVideos = window.LLLVideos.getAllVideos();
  let currentPillar = "all";
  let currentSeries = "all";
  let currentSort = "latest";
  let searchQuery = "";
  let activeVideo = null;
  let isAdmin = false;

  // Initialize
  initApp();

  function initApp() {
    checkAdminStatus();
    readUrlParams();
    renderVideoGrid();
    setupEventListeners();
    setupKeyboardShortcuts();
    checkInitialVideoParam();
  }

  function readUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("pillar")) {
      const p = urlParams.get("pillar");
      if (["live-lit", "build-lit", "lead-lit", "all"].includes(p)) {
        currentPillar = p;
        pillarTabs?.querySelectorAll(".pillar-tab-btn").forEach(btn => {
          btn.classList.toggle("active", btn.getAttribute("data-pillar") === p);
        });
      }
    }
    if (urlParams.has("series")) {
      const s = urlParams.get("series");
      currentSeries = s;
      if (seriesFilterSelect) {
        seriesFilterSelect.value = s;
      }
    }
    if (urlParams.has("search")) {
      const q = urlParams.get("search");
      searchQuery = q;
      if (videoSearchInput) {
        videoSearchInput.value = q;
        searchClearBtn?.classList.add("visible");
      }
    }
  }

  function checkInitialVideoParam() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("video")) {
      const vidId = urlParams.get("video");
      setTimeout(() => openVideoPlayer(vidId), 250);
    }
  }

  /**
   * Admin Authentication Management
   */
  function checkAdminStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAdminQuery = urlParams.get("admin") === "true";
    const hasSession = sessionStorage.getItem("lll_admin_auth") === "true";

    if (hasAdminQuery || hasSession) {
      setAdminMode(true);
    } else {
      setAdminMode(false);
    }
  }

  function setAdminMode(active) {
    isAdmin = active;
    if (active) {
      sessionStorage.setItem("lll_admin_auth", "true");
      adminHeaderControls.style.display = "inline-flex";
    } else {
      sessionStorage.removeItem("lll_admin_auth");
      adminHeaderControls.style.display = "none";
    }
  }

  function openAdminLogin() {
    adminLoginForm.reset();
    adminLoginModal.showModal();
    document.body.style.overflow = "hidden";
    setTimeout(() => adminPasscodeInput.focus(), 100);
  }

  function closeAdminLogin() {
    adminLoginModal.close();
    document.body.style.overflow = "";
  }

  /**
   * Filter and Sort Videos based on current state
   */
  function getFilteredVideos() {
    return allVideos.filter(video => {
      // Pillar filter
      if (currentPillar !== "all" && video.pillar !== currentPillar) {
        return false;
      }
      // Series filter
      if (currentSeries !== "all" && video.series !== currentSeries) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = video.title.toLowerCase().includes(q);
        const matchesDesc = (video.description || "").toLowerCase().includes(q);
        const matchesScripture = (video.scripture || "").toLowerCase().includes(q);
        const matchesSeries = (video.series || "").toLowerCase().includes(q);
        const matchesPillar = (video.pillarLabel || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesScripture && !matchesSeries && !matchesPillar) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (currentSort === "duration") {
        return parseDurationToSeconds(b.duration) - parseDurationToSeconds(a.duration);
      }
      if (currentSort === "popular") {
        return parseFloat(b.views || 0) - parseFloat(a.views || 0);
      }
      // default: latest (playlist sequence)
      return a.id.localeCompare(b.id);
    });
  }

  function parseDurationToSeconds(dur) {
    if (!dur) return 0;
    const parts = dur.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  /**
   * Render video cards to the explorer grid
   */
  function renderVideoGrid() {
    const filtered = getFilteredVideos();
    const limitAttr = videoGrid.getAttribute("data-limit");
    const limit = limitAttr ? parseInt(limitAttr, 10) : null;
    const seeMoreWrap = document.getElementById("seeMoreVideosWrap");
    const btnSeeMore = document.getElementById("btnSeeMoreVideos");

    // Show/hide reset button
    const hasActiveFilters = currentPillar !== "all" || currentSeries !== "all" || searchQuery.trim() !== "";
    if (hasActiveFilters) {
      btnResetFilters.classList.add("visible");
    } else {
      btnResetFilters.classList.remove("visible");
    }

    if (filtered.length === 0) {
      videoCountDisplay.innerHTML = `Showing <strong>0</strong> spiritual teachings`;
      if (seeMoreWrap) seeMoreWrap.style.display = "none";
      videoGrid.innerHTML = `
        <div class="video-empty-state">
          <div class="empty-icon">
            <svg class="icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <h3 class="empty-title">No teachings found</h3>
          <p class="empty-desc">No video matches your search. Try clearing filters to see all 29 Lit Episodes.</p>
        </div>
      `;
      return;
    }

    const displayVideos = limit ? filtered.slice(0, limit) : filtered;

    if (limit && filtered.length > limit) {
      videoCountDisplay.innerHTML = `Showing <strong>${displayVideos.length}</strong> of <strong>${filtered.length}</strong> spiritual teachings`;
      if (seeMoreWrap) {
        seeMoreWrap.style.display = "flex";
        if (btnSeeMore) {
          let targetUrl = "videos.html";
          const params = [];
          if (currentPillar !== "all") params.push(`pillar=${encodeURIComponent(currentPillar)}`);
          if (currentSeries !== "all") params.push(`series=${encodeURIComponent(currentSeries)}`);
          if (searchQuery.trim() !== "") params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
          if (params.length > 0) targetUrl += `?${params.join("&")}`;
          btnSeeMore.href = targetUrl;
        }
      }
    } else {
      videoCountDisplay.innerHTML = `Showing <strong>${filtered.length}</strong> spiritual ${filtered.length === 1 ? 'teaching' : 'teachings'}`;
      if (seeMoreWrap) {
        if (limit) {
          seeMoreWrap.style.display = "flex";
          let targetUrl = "videos.html";
          const params = [];
          if (currentPillar !== "all") params.push(`pillar=${encodeURIComponent(currentPillar)}`);
          if (params.length > 0) targetUrl += `?${params.join("&")}`;
          btnSeeMore.href = targetUrl;
        } else {
          seeMoreWrap.style.display = "none";
        }
      }
    }

    videoGrid.innerHTML = displayVideos.map(video => {
      const badgeClass = `badge-${video.pillar}`;
      const thumbUrl = window.LLLVideos.getYouTubeThumbnail(video.youtubeId);

      return `
        <article class="video-card" data-video-id="${video.id}" tabindex="0" role="button" aria-label="Watch ${escapeHtml(video.title)}">
          <div class="video-thumb-wrap">
            <img src="${thumbUrl}" alt="${escapeHtml(video.title)}" class="video-thumb" loading="lazy" onerror="this.src='media/hero_bg.jpg'">
            <span class="card-pillar-badge ${badgeClass}">${video.pillarLabel}</span>
            <span class="card-duration">${video.duration}</span>
            ${video.custom ? '<span class="custom-badge">Admin Added</span>' : ''}
            <div class="card-play-overlay">
              <div class="card-play-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
            </div>
          </div>
          <div class="video-content">
            <div class="video-series-tag">${escapeHtml(video.series)} • ${escapeHtml(video.seriesEp || '')}</div>
            <h3 class="video-title">${escapeHtml(video.title)}</h3>
            <p class="video-excerpt">${escapeHtml(video.description)}</p>
            <div class="video-meta-footer">
              <span class="video-scripture">
                <svg class="icon icon-book" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <span>${escapeHtml(video.scripture)}</span>
              </span>
              <span class="video-watch-link">
                <span>Watch Teaching</span>
                <svg class="icon icon-right" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
            </div>
          </div>
        </article>
      `;
    }).join("");

    // Attach click listeners to cards
    videoGrid.querySelectorAll(".video-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-video-id");
        openVideoPlayer(id);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const id = card.getAttribute("data-video-id");
          openVideoPlayer(id);
        }
      });
    });
  }

  /**
   * Open the In-Website Theater Video Player
   */
  function openVideoPlayer(videoId) {
    const video = allVideos.find(v => v.id === videoId);
    if (!video) return;

    activeVideo = video;

    // Set YouTube Embed Iframe
    modalYoutubeIframe.src = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`;

    // Pillar chip
    modalPillarChip.className = `modal-pillar-chip badge-${video.pillar}`;
    modalPillarChip.textContent = video.pillarLabel;

    // Metadata
    modalSeriesName.textContent = video.series + (video.seriesEp ? ` • ${video.seriesEp}` : '');
    modalVideoTitle.textContent = video.title;
    modalVideoDate.textContent = video.date || "Lit Episode";
    modalVideoScripture.innerHTML = `
      <svg class="icon icon-book" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      <span>${escapeHtml(video.scripture)}</span>
    `;
    modalVideoDesc.textContent = video.description;

    // External YouTube Link
    modalYtLink.href = `https://www.youtube.com/watch?v=${video.youtubeId}&list=PL0zut06BhfP_9r3hhY8JXAyug6ENy9IFE`;

    // Study Notes Tab Populate
    modalTakeawaysList.innerHTML = (video.takeaways || []).map(item => `
      <li>
        <span class="bullet" style="color: var(--brand-orange); display: inline-flex; align-items: center;">
          <svg class="icon" width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><circle cx="12" cy="12" r="6"/></svg>
        </span>
        <span>${escapeHtml(item)}</span>
      </li>
    `).join("");

    modalScripturesContainer.innerHTML = (video.scripturesList || []).map(s => `
      <div class="scripture-card-box">
        <div class="verse-ref">
          <svg class="icon icon-book" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <span>${escapeHtml(s.ref)}</span>
        </div>
        <div class="verse-text">"${escapeHtml(s.text)}"</div>
      </div>
    `).join("");

    modalChallengeText.textContent = video.challenge || "Apply the spiritual truths from this message to your daily life.";

    // Up Next Playlist Populate
    const related = allVideos.filter(v => v.id !== video.id && (v.pillar === video.pillar || v.series === video.series)).slice(0, 5);
    const playlistToShow = related.length > 0 ? related : allVideos.filter(v => v.id !== video.id).slice(0, 5);

    modalPlaylistContainer.innerHTML = playlistToShow.map(p => `
      <div class="playlist-item" data-video-id="${p.id}" tabindex="0" role="button">
        <div class="playlist-thumb">
          <img src="${window.LLLVideos.getYouTubeThumbnail(p.youtubeId)}" alt="${escapeHtml(p.title)}">
        </div>
        <div class="playlist-info">
          <h5>${escapeHtml(p.title)}</h5>
          <p>${escapeHtml(p.pillarLabel)} • <span style="display:inline-flex; align-items:center; gap:3px;"><svg class="icon icon-book" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> ${escapeHtml(p.scripture)}</span></p>
        </div>
        <span class="playlist-duration">${p.duration}</span>
      </div>
    `).join("");

    modalPlaylistContainer.querySelectorAll(".playlist-item").forEach(item => {
      item.addEventListener("click", () => {
        const nextId = item.getAttribute("data-video-id");
        openVideoPlayer(nextId);
      });
    });

    // Reset to Study Notes tab
    switchModalTab("notes");

    // Open HTML5 dialog
    videoModal.showModal();
    document.body.style.overflow = "hidden";
  }

  function closeVideoPlayer() {
    videoModal.close();
    // Stop YouTube audio by clearing iframe src
    modalYoutubeIframe.src = "";
    document.body.style.overflow = "";
    activeVideo = null;
  }

  /**
   * Modal Tab Switching
   */
  function switchModalTab(tabName) {
    if (tabName === "notes") {
      tabBtnNotes.classList.add("active");
      tabBtnPlaylist.classList.remove("active");
      tabPanelNotes.classList.add("active");
      tabPanelPlaylist.classList.remove("active");
    } else {
      tabBtnNotes.classList.remove("active");
      tabBtnPlaylist.classList.add("active");
      tabPanelNotes.classList.remove("active");
      tabPanelPlaylist.classList.add("active");
    }
  }

  /**
   * Open / Close Add Video Modal (Admin)
   */
  function openAddVideoModal() {
    if (!isAdmin) {
      openAdminLogin();
      return;
    }
    addVideoForm.reset();
    previewThumbImg.src = "";
    previewThumbImg.classList.remove("loaded");
    previewPlaceholderText.style.display = "block";
    addVideoModal.showModal();
    document.body.style.overflow = "hidden";
    setTimeout(() => inputYtUrl.focus(), 100);
  }

  function closeAddVideoModal() {
    addVideoModal.close();
    document.body.style.overflow = "";
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    // Search input
    videoSearchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      if (searchQuery.trim() !== "") {
        searchClearBtn.classList.add("visible");
      } else {
        searchClearBtn.classList.remove("visible");
      }
      renderVideoGrid();
    });

    searchClearBtn.addEventListener("click", () => {
      videoSearchInput.value = "";
      searchQuery = "";
      searchClearBtn.classList.remove("visible");
      renderVideoGrid();
      videoSearchInput.focus();
    });

    // Pillar category tabs
    pillarTabs.querySelectorAll(".pillar-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        pillarTabs.querySelectorAll(".pillar-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentPillar = btn.getAttribute("data-pillar");
        renderVideoGrid();
      });
    });

    // Series dropdown
    seriesFilterSelect.addEventListener("change", (e) => {
      currentSeries = e.target.value;
      renderVideoGrid();
    });

    // Sort dropdown
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderVideoGrid();
    });

    // Reset filters
    btnResetFilters.addEventListener("click", () => {
      currentPillar = "all";
      currentSeries = "all";
      searchQuery = "";
      videoSearchInput.value = "";
      searchClearBtn.classList.remove("visible");
      seriesFilterSelect.value = "all";
      pillarTabs.querySelectorAll(".pillar-tab-btn").forEach(b => {
        b.classList.toggle("active", b.getAttribute("data-pillar") === "all");
      });
      renderVideoGrid();
    });

    // Pillar cards click filters (from #pillars section)
    document.querySelectorAll("[data-pillar-filter]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const pillar = btn.getAttribute("data-pillar-filter");
        currentPillar = pillar;
        pillarTabs.querySelectorAll(".pillar-tab-btn").forEach(b => {
          b.classList.toggle("active", b.getAttribute("data-pillar") === pillar);
        });
        renderVideoGrid();
        document.getElementById("videos").scrollIntoView({ behavior: "smooth" });
      });
    });

    // Hero buttons
    document.getElementById("heroPlayBtn")?.addEventListener("click", () => {
      const vid = document.getElementById("heroPlayBtn").getAttribute("data-video-id") || "lll-yt-029";
      openVideoPlayer(vid);
    });

    document.getElementById("heroSpotlightCard")?.addEventListener("click", () => {
      const vid = document.getElementById("heroSpotlightCard").getAttribute("data-video-id") || "lll-yt-029";
      openVideoPlayer(vid);
    });

    document.getElementById("btnStartSeries")?.addEventListener("click", () => {
      openVideoPlayer("lll-yt-003");
    });

    document.getElementById("btnSeriesFilterJump")?.addEventListener("click", () => {
      currentSeries = "Altar Fire & The Secret Place";
      seriesFilterSelect.value = currentSeries;
      renderVideoGrid();
      document.getElementById("videos").scrollIntoView({ behavior: "smooth" });
    });

    // Series preview episode list clicks
    document.querySelectorAll(".series-episode-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-video-id");
        openVideoPlayer(id);
      });
    });

    // Video Modal Close
    btnCloseModal.addEventListener("click", closeVideoPlayer);
    videoModal.addEventListener("click", (e) => {
      if (e.target === videoModal) closeVideoPlayer();
    });

    // Modal Tabs
    tabBtnNotes.addEventListener("click", () => switchModalTab("notes"));
    tabBtnPlaylist.addEventListener("click", () => switchModalTab("playlist"));

    // Share Video Link
    btnShareVideo.addEventListener("click", () => {
      if (!activeVideo) return;
      const shareUrl = `https://www.youtube.com/watch?v=${activeVideo.youtubeId}&list=PL0zut06BhfP_9r3hhY8JXAyug6ENy9IFE`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("✓ Video link copied to clipboard!");
      }).catch(() => {
        showToast("✓ Link: " + shareUrl);
      });
    });

    // Admin Trigger & Logout
    btnOpenAdminLogin?.addEventListener("click", openAdminLogin);
    btnCloseAdminLoginModal?.addEventListener("click", closeAdminLogin);
    btnCancelAdminLogin?.addEventListener("click", closeAdminLogin);
    adminLoginModal?.addEventListener("click", (e) => {
      if (e.target === adminLoginModal) closeAdminLogin();
    });

    adminLoginForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = adminPasscodeInput.value.trim().toLowerCase();
      if (code === "777" || code === "lit777" || code === "livelitlead" || code === "admin") {
        setAdminMode(true);
        closeAdminLogin();
        showToast("🔓 Admin Mode Unlocked! You can now integrate YouTube videos.");
      } else {
        alert("Incorrect Admin Passcode. Hint: default is 777");
        adminPasscodeInput.focus();
      }
    });

    btnAdminLogout?.addEventListener("click", () => {
      setAdminMode(false);
      showToast("Logged out of Admin Mode.");
    });

    // Add Video Modal (Admin)
    btnAdminAddVideo?.addEventListener("click", openAddVideoModal);
    btnCloseAddModal?.addEventListener("click", closeAddVideoModal);
    btnCancelAddModal?.addEventListener("click", closeAddVideoModal);
    addVideoModal?.addEventListener("click", (e) => {
      if (e.target === addVideoModal) closeAddVideoModal();
    });

    // Real-time YouTube URL Thumbnail Preview
    inputYtUrl?.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      const ytId = window.LLLVideos.extractYouTubeId(url);
      if (ytId) {
        const thumbUrl = window.LLLVideos.getYouTubeThumbnail(ytId);
        previewThumbImg.src = thumbUrl;
        previewThumbImg.classList.add("loaded");
        previewPlaceholderText.style.display = "none";
      } else {
        previewThumbImg.classList.remove("loaded");
        previewPlaceholderText.style.display = "block";
      }
    });

    // Add Video Form Submit (Admin)
    addVideoForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = inputYtUrl.value.trim();
      const ytId = window.LLLVideos.extractYouTubeId(url);

      if (!ytId) {
        alert("Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)");
        inputYtUrl.focus();
        return;
      }

      const title = document.getElementById("inputVideoTitle").value.trim();
      const pillar = document.getElementById("selectPillar").value;
      const series = document.getElementById("inputSeries").value.trim() || "Live Lit Lead Teachings";
      const duration = document.getElementById("inputDuration").value.trim() || "28:00";
      const scripture = document.getElementById("inputScripture").value.trim() || "Scripture Teaching";
      const desc = document.getElementById("inputDesc").value.trim() || "Weekly spiritual teaching from Live Lit Lead.";

      const newVideo = window.LLLVideos.saveVideo({
        youtubeId: ytId,
        title: title,
        pillar: pillar,
        series: series,
        duration: duration,
        scripture: scripture,
        description: desc
      });

      // Update state
      allVideos = window.LLLVideos.getAllVideos();
      closeAddVideoModal();
      renderVideoGrid();

      // Scroll to videos section and show toast
      document.getElementById("videos").scrollIntoView({ behavior: "smooth" });
      showToast(`"${title}" was successfully added to your library!`);
    });

    // Quick Search Modal
    btnQuickSearch?.addEventListener("click", openSearchModal);
    btnCloseSearchModal?.addEventListener("click", closeSearchModal);
    searchModal?.addEventListener("click", (e) => {
      if (e.target === searchModal) closeSearchModal();
    });

    modalSearchInput?.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        modalSearchResults.innerHTML = "";
        return;
      }
      const matches = allVideos.filter(v => 
        v.title.toLowerCase().includes(q) || 
        (v.scripture || "").toLowerCase().includes(q) || 
        v.pillarLabel.toLowerCase().includes(q) ||
        (v.series || "").toLowerCase().includes(q)
      );
      if (matches.length === 0) {
        modalSearchResults.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 0.85rem;">No matching teachings found.</div>';
        return;
      }
      modalSearchResults.innerHTML = matches.map(m => `
        <div class="playlist-item" data-search-video-id="${m.id}" style="padding: 8px 12px;">
          <div class="playlist-thumb" style="width: 80px;">
            <img src="${window.LLLVideos.getYouTubeThumbnail(m.youtubeId)}" alt="${escapeHtml(m.title)}">
          </div>
          <div class="playlist-info">
            <h5 style="font-size: 0.88rem;">${escapeHtml(m.title)}</h5>
            <p style="font-size: 0.72rem; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">${m.pillarLabel} • <svg class="icon icon-book" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> <span>${escapeHtml(m.scripture)}</span></p>
          </div>
        </div>
      `).join("");

      modalSearchResults.querySelectorAll("[data-search-video-id]").forEach(item => {
        item.addEventListener("click", () => {
          const id = item.getAttribute("data-search-video-id");
          closeSearchModal();
          openVideoPlayer(id);
        });
      });
    });

    // Newsletter Form
    document.getElementById("newsletterForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("newsletterEmail").value;
      showToast(`Thank you! ${email} has been subscribed to the weekly drop.`);
      document.getElementById("newsletterEmail").value = "";
    });

    // Reset all data in footer
    document.getElementById("btnResetAllData")?.addEventListener("click", () => {
      if (confirm("Restore video library back to the 28 default Lit Episodes?")) {
        allVideos = window.LLLVideos.resetVideos();
        renderVideoGrid();
        showToast("✓ Video library restored to all 28 playlist teachings.");
      }
    });

    // Back to top button
    document.getElementById("btnBackToTop")?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Mobile Navigation Drawer Toggle
    const mobileNavDrawer = document.getElementById("mobileNavDrawer");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const btnCloseMobileNav = document.getElementById("btnCloseMobileNav");
    const mobileNavBackdrop = document.getElementById("mobileNavBackdrop");

    function openMobileNav() {
      mobileNavDrawer?.classList.add("open");
      mobileNavDrawer?.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeMobileNav() {
      mobileNavDrawer?.classList.remove("open");
      mobileNavDrawer?.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    mobileMenuBtn?.addEventListener("click", openMobileNav);
    btnCloseMobileNav?.addEventListener("click", closeMobileNav);
    mobileNavBackdrop?.addEventListener("click", closeMobileNav);

    // Close mobile drawer when any link inside is tapped
    mobileNavDrawer?.querySelectorAll(".mobile-nav-item, .btn-mobile-youtube").forEach(link => {
      link.addEventListener("click", closeMobileNav);
    });
  }

  function openSearchModal() {
    modalSearchInput.value = "";
    modalSearchResults.innerHTML = "";
    searchModal.showModal();
    document.body.style.overflow = "hidden";
    setTimeout(() => modalSearchInput.focus(), 100);
  }

  function closeSearchModal() {
    searchModal.close();
    document.body.style.overflow = "";
  }

  /**
   * Keyboard shortcuts
   */
  function setupKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      // Escape closes open modals
      if (e.key === "Escape") {
        if (videoModal.open) closeVideoPlayer();
        if (addVideoModal?.open) closeAddVideoModal();
        if (adminLoginModal?.open) closeAdminLogin();
        if (searchModal?.open) closeSearchModal();
      }
      // Ctrl+Shift+A or Cmd+Shift+A opens Admin Mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (isAdmin) {
          openAddVideoModal();
        } else {
          openAdminLogin();
        }
      }
      // Ctrl+K or Cmd+K or "/" to search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearchModal();
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        openSearchModal();
      }
    });
  }

  /**
   * Toast notification helper
   */
  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <svg class="icon icon-fire" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
      <span>${escapeHtml(message)}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // Global helper for opening study guides from resource cards
  window.appOpenStudyGuide = function(videoId) {
    openVideoPlayer(videoId);
    switchModalTab("notes");
  };
});
