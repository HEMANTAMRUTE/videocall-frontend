class PeerService {
  constructor() {
    if (!this.peer) {
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
      this._tracksAdded = false; // ✅ Custom flag to avoid multiple addTracks
    }
  }

  addTracks(stream) {
    if (!this._tracksAdded) {
      stream.getTracks().forEach((track) => {
        this.peer.addTrack(track, stream);
      });
      this._tracksAdded = true; // ✅ Mark as done
    }
  }

  async getAnswer(offer) {
    if (this.peer) {
      await this.peer.setRemoteDescription(offer);
      const ans = await this.peer.createAnswer();
      await this.peer.setLocalDescription(ans);
      return ans;
    }
  }

  async setLocalDescription(ans) {
    if (this.peer) {
      await this.peer.setRemoteDescription(ans);
    }
  }

  async getOffer() {
    if (this.peer) {
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(offer);
      return offer;
    }
  }

  reset() {
    if (this.peer) {
      this.peer.close();
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
      this._tracksAdded = false;
    }
  }
}

export default new PeerService();
