Component({
    properties: {
      showMiniPlayer: Boolean,
      currentTrack: Object,
      isPlaying: Boolean,
      progressPercent: Number
    },
    methods: {
      goToPlayer() {
        this.triggerEvent('goToPlayer');
      },
      togglePlayPause() {
        this.triggerEvent('togglePlayPause');
      }
    }
  });
  