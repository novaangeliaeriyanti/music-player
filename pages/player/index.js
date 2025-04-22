const app = getApp();
const backgroundAudioManager = wx.getBackgroundAudioManager(); // Init the background audio manager

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
}

Page({
  data: {
    playlist: [],
    currentIndex: 0,
    title: '',
    artist: '',
    coverPlayer: 'https://static.vecteezy.com/system/resources/thumbnails/009/314/135/small/vinyl-record-vector-illustration-isolated-on-white-background-free-png.png',
    playerArm: 'https://www.freeiconspng.com/thumbs/turntable-png/turntable-png-17.png',
    url: '',
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentTimeFormatted: '00:00',
    durationFormatted: '00:00',
    progressPercent: 0,
    isDragging: false,
    currentTrack: {}
  },

  onLoad(options) {
    const storedTrack = wx.getStorageSync('currentTrack');
    const storedTime = wx.getStorageSync('currentTime');
    
    const track = app.globalData.currentTrack || storedTrack || {};
    const playlist = wx.getStorageSync('playlist') || [track];
    const index = playlist.findIndex(t => t.id === track.id);

    const isPlaying = !backgroundAudioManager.paused || false;
    const currentTime = app.globalData.currentTime || storedTime || 0;

    this.setData({
      playlist,
      currentIndex: index >= 0 ? index : 0,
      isPlaying,
      currentTime,
      currentTrack: track,
      currentTimeFormatted: formatTime(currentTime),
      title: track.title,
      artist: track.artist,
      cover: track.cover,
      url: track.url,
    });
    if (isPlaying) {
      this.playTrack(index, currentTime);
      this.setData({
        isPlaying: true,
      })
    } else {
      const track = playlist[index];
      this.setData({
        title: track.title,
        artist: track.artist,
        cover: track.cover,
        url: track.url,
        currentTrack: track,
        isPlaying: false,
        currentTimeFormatted: formatTime(currentTime),
        durationFormatted: '00:00',
        progressPercent: 0
      });
    }
  },

  onShow() {
    this.attachAudioListeners();
  },

  onHide() {
    // Save the current track and time
    app.globalData.currentTrack = this.data.currentTrack;
    app.globalData.currentTime = this.data.currentTime;

    wx.setStorageSync('currentTrack', this.data.currentTrack);
    wx.setStorageSync('currentTime', this.data.currentTime);

    backgroundAudioManager.pause(); // Pause audio when leaving
  },

  onUnload() {
    // Save the current track and time before unloading
    app.globalData.currentTrack = this.data.currentTrack;
    app.globalData.currentTime = this.data.currentTime;

    wx.setStorageSync('currentTrack', this.data.currentTrack);
    wx.setStorageSync('currentTime', this.data.currentTime);
    
    // Store the current time before unloading
    app.globalData.currentTime = backgroundAudioManager.currentTime;
    wx.setStorageSync('currentTime', app.globalData.currentTime);
  },

  attachAudioListeners() {
    backgroundAudioManager.onTimeUpdate(() => {
      const currentTime = backgroundAudioManager.currentTime;
      const duration = backgroundAudioManager.duration;

      this.setData({
        currentTime,
        duration,
        currentTimeFormatted: formatTime(currentTime),
        durationFormatted: formatTime(duration),
        progressPercent: (currentTime / duration) * 100
      });

      app.globalData.currentTime = currentTime;
      wx.setStorageSync('currentTime', currentTime);

      if (currentTime === duration) {
        this.setData({
          isPlaying: false
        });
        app.globalData.isPlaying = false;
        this.nextTrack();
      }
    });

    backgroundAudioManager.onEnded(() => {
      this.nextTrack();
    });
  },

  playTrack(index, startTime = 0) {
    const track = this.data.playlist[index];
  
    // Kalau track masih sama dan audio masih diputar, cukup update UI
    if (
      this.data.currentTrack.id === track.id &&
      !backgroundAudioManager.paused
    ) {
      this.setData({
        currentTrack: track,
        title: track.title,
        artist: track.artist,
        cover: track.cover,
        url: track.url,
      });
      console.log('startTime: ',startTime)
      // if (startTime > 0) {
      //   backgroundAudioManager.seek(startTime);
      // }
  
      return;
    }
  
    // Kalau track beda, atau audio sudah dijeda, baru load ulang
    backgroundAudioManager.stop();
    backgroundAudioManager.title = track.title;
    backgroundAudioManager.singer = track.artist;
    backgroundAudioManager.coverImgUrl = track.cover;
    backgroundAudioManager.src = track.url;
    console.log('startTime: ',startTime)
    if (startTime > 0) {
      setTimeout(() => {
        backgroundAudioManager.seek(startTime);
      }, 500);
    }
  
    this.setData({
      currentTime: startTime,
      currentTrack: track,
      title: track.title,
      artist: track.artist,
      cover: track.cover,
      url: track.url,
    });
  
    app.globalData.currentTime = startTime;
  
    this.attachAudioListeners();
  },   

  togglePlayPause() {
    if (this.data.isPlaying) {
      backgroundAudioManager.pause();
      app.globalData.isPlaying = false;
      this.setData({ isPlaying: false });
    } else {
      backgroundAudioManager.play();
      app.globalData.isPlaying = true;
      this.setData({ isPlaying: true });
    }
  },

  nextTrack() {
    let nextIndex = (this.data.currentIndex + 1) % this.data.playlist.length;
    app.globalData.currentTime = 0;
    this.playTrack(nextIndex);
    this.setData({
      currentIndex: nextIndex,
      currentTime: 0,
      progressPercent: 0,
      isPlaying: true,
    });
  },

  prevTrack() {
    let prevIndex = this.data.currentIndex - 1;
    if (prevIndex < 0) prevIndex = this.data.playlist.length - 1;
    app.globalData.currentTime = 0;
    this.playTrack(prevIndex);
    this.setData({
      currentIndex: prevIndex,
      currentTime: 0,
      progressPercent: 0,
      isPlaying: true,
    });
  },

  stop() {
    backgroundAudioManager.stop();
    app.globalData.isPlaying = false;
    this.setData({ isPlaying: false });
  },

  back() {
    wx.navigateBack();
  },

  onProgressBarTap(e) {
    const query = wx.createSelectorQuery();
    query.select('.progress-bar').boundingClientRect((rect) => {
      if (!rect) return;

      const progressBarLeft = rect.left;
      const progressBarWidth = rect.width;
      const tapX = e.detail.x;
      const tapPosition = tapX - progressBarLeft;

      let newTime = (tapPosition / progressBarWidth) * this.data.duration;

      if (newTime > this.data.duration) {
        newTime = this.data.duration;
      }
      if (newTime < 0 || isNaN(newTime)) {
        newTime = 0;
      }

      backgroundAudioManager.seek(newTime);

      this.setData({
        currentTime: newTime,
        currentTimeFormatted: formatTime(newTime),
        progressPercent: (newTime / this.data.duration) * 100
      });

      app.globalData.currentTime = newTime;
      wx.setStorageSync('currentTime', newTime);
    }).exec();
  }
});
