const app = getApp();
let miniIntervalId = null;

const backgroundAudioManager = wx.getBackgroundAudioManager();

Page({
  data: {
    coverPlaylist:"https://cdn.pixabay.com/audio/2023/06/23/13-47-17-712_200x200.jpg",
    tracks: [
      {
        id: 1,
        title: "Cozy Lofi Beat - Split memmories",
        artist: "IdoBerg",
        url: "https://cdn.pixabay.com/audio/2024/10/07/audio_036f25b8dc.mp3",
        cover: "https://cdn.pixabay.com/audio/2024/10/07/15-28-35-989_200x200.png"
      },
      {
        id: 2,
        title: "Lofi background music",
        artist: "lofidreams99",
        url: "https://cdn.pixabay.com/audio/2025/04/13/audio_bec40e5a6e.mp3",
        cover: "https://cdn.pixabay.com/audio/2025/01/31/12-10-01-64_200x200.jpg"
      },
      {
        id: 3,
        title: "SRelaxing Lofi Beat",
        artist: "IdoBerg",
        url: "https://cdn.pixabay.com/audio/2025/03/12/audio_7cef52a398.mp3",
        cover: "https://cdn.pixabay.com/audio/2023/06/23/13-47-17-712_200x200.jpg"
      },
      {
        id: 4,
        title: "Cozy Lofi Beat - Split memmories",
        artist: "IdoBerg",
        url: "https://cdn.pixabay.com/audio/2024/10/07/audio_036f25b8dc.mp3",
        cover: "https://cdn.pixabay.com/audio/2024/10/07/15-28-35-989_200x200.png"
      },
      {
        id: 5,
        title: "Lofi background music",
        artist: "lofidreams99",
        url: "https://cdn.pixabay.com/audio/2025/04/13/audio_bec40e5a6e.mp3",
        cover: "https://cdn.pixabay.com/audio/2025/01/31/12-10-01-64_200x200.jpg"
      },
      {
        id: 6,
        title: "SRelaxing Lofi Beat",
        artist: "IdoBerg",
        url: "https://cdn.pixabay.com/audio/2025/03/12/audio_7cef52a398.mp3",
        cover: "https://cdn.pixabay.com/audio/2023/06/23/13-47-17-712_200x200.jpg"
      },
    ],
    showMiniPlayer: false,
    currentTrack: {},
    isPlaying: false,
    currentTime: 0,
    progressPercent: 0
  },

  onLoad() {
    const track = app.globalData.currentTrack || {};
    const playlist = wx.getStorageSync('playlist') || [track];
    const isPlaying = app.globalData.isPlaying || false;
    const currentTime = app.globalData.currentTime || 0;

    if (track && track.id) {
      this.setData({
        currentTrack: track,
        playlist,
        isPlaying,
        currentTime,
        showMiniPlayer: true,
      });
      this.startProgressInterval();
    }
  },

  onSelect(e) {
    const selectedTrack = this.data.tracks[e.currentTarget.dataset.index];
    const currentTrack = app.globalData.currentTrack || {};
    const isSameTrack = selectedTrack.id === currentTrack.id;

    this.setData({
      currentTrack: selectedTrack,
      showMiniPlayer: true,
      isPlaying: true,
      progressPercent: 0,
    });

    app.globalData.currentTrack = selectedTrack;
    app.globalData.isPlaying = true;

    backgroundAudioManager.stop();

    backgroundAudioManager.src = selectedTrack.url;
    backgroundAudioManager.title = selectedTrack.title;
    backgroundAudioManager.coverImgUrl = selectedTrack.cover;
    backgroundAudioManager.play();

    if (isSameTrack && app.globalData.currentTime) {
      setTimeout(() => {
        backgroundAudioManager.seek(app.globalData.currentTime);
      }, 500);
    } else {
      app.globalData.currentTime = 0;
    }
    this.startProgressInterval();
  },

  goToPlayer() {
    const track = this.data.currentTrack;
    wx.setStorageSync('playlist', this.data.tracks);
    wx.navigateTo({
      url: `/pages/player/index?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}&url=${encodeURIComponent(track.url)}&cover=${encodeURIComponent(track.cover)}`
    });
  },

  togglePlayPause() {
    if (this.data.isPlaying) {
      backgroundAudioManager.pause(); // Pause audio
      app.globalData.isPlaying = false;
      this.setData({ isPlaying: false });
    } else {
      backgroundAudioManager.play(); // Play audio
      app.globalData.isPlaying = true;
      this.setData({ isPlaying: true });
      this.startProgressInterval();
    }
  },

  startProgressInterval() {
    if (miniIntervalId) clearInterval(miniIntervalId);
    miniIntervalId = setInterval(() => {
      if (backgroundAudioManager.paused) return;
      this.setData({
        currentTime: backgroundAudioManager.currentTime,
        progressPercent: (backgroundAudioManager.currentTime / backgroundAudioManager.duration) * 100
      });

      if (backgroundAudioManager.currentTime >= backgroundAudioManager.duration - 1) {
        this.setData({ isPlaying: false });
        app.globalData.isPlaying = false;
        backgroundAudioManager.stop();

        this.nextTrack();
      }
    }, 1000);
  },

  nextTrack() {
    const nextIndex = (this.data.playlist.findIndex(track => track.id === this.data.currentTrack.id) + 1) % this.data.playlist.length;
    const nextTrack = this.data.playlist[nextIndex];
    
    this.setData({
      currentTrack: nextTrack,
      isPlaying: true,
      currentTime: 0
    });

    app.globalData.currentTrack = nextTrack;
    app.globalData.isPlaying = true;
    backgroundAudioManager.src = nextTrack.url;
    backgroundAudioManager.title = nextTrack.title;
    backgroundAudioManager.coverImgUrl = nextTrack.cover;
    backgroundAudioManager.play();

    app.globalData.currentTime = 0;
    this.startProgressInterval();
  },

  prevTrack() {
    const prevIndex = (this.data.playlist.findIndex(track => track.id === this.data.currentTrack.id) - 1 + this.data.playlist.length) % this.data.playlist.length;
    const prevTrack = this.data.playlist[prevIndex];

    this.setData({
      currentTrack: prevTrack,
      isPlaying: true,
      currentTime: 0
    });

    app.globalData.currentTrack = prevTrack;
    app.globalData.isPlaying = true;

    backgroundAudioManager.src = prevTrack.url;
    backgroundAudioManager.title = prevTrack.title;
    backgroundAudioManager.coverImgUrl = prevTrack.cover;
    backgroundAudioManager.play();

    app.globalData.currentTime = 0;
    this.startProgressInterval();
  },

  onShow() {
    const track = app.globalData.currentTrack || {};
    const playlist = wx.getStorageSync('playlist') || [track];
    const isPlaying = app.globalData.isPlaying || false;
    const currentTime = app.globalData.currentTime || 0;
    if (track && track.id) {
      this.setData({
        currentTrack: track,
        playlist,
        isPlaying,
        currentTime,
        showMiniPlayer: true,
      });
      this.startProgressInterval();
    }
  },

  onHide() {
    if (miniIntervalId) clearInterval(miniIntervalId);
    app.globalData.currentTime = this.data.currentTime; 
  },

  onUnload() {
    if (miniIntervalId) clearInterval(miniIntervalId);
    app.globalData.currentTime = this.data.currentTime;
  },
  onViewAll() {
    wx.setStorageSync('tracks', this.data.tracks);
    wx.navigateTo({
      url: '/pages/detail/index'
    });
  },

  back() {
    wx.navigateBack();
  },
});