// app.js
App({
  globalData: {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
  },
  onLaunch() {
    const backgroundAudioManager = wx.getBackgroundAudioManager();
    backgroundAudioManager.onEnded(() => {
      this.nextTrack();
    });
  },
  nextTrack() {
  },
});
