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
      this._tracksAdded = false;
    }
  }

  addTracks(stream) {
    if (!this._tracksAdded) {
      stream.getTracks().forEach((track) => {
        this.peer.addTrack(track, stream);
      });
      this._tracksAdded = true;
    }
  }

  async getAnswer(offer) {
    if (this.peer) {
      await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
      const ans = await this.peer.createAnswer();
      await this.peer.setLocalDescription(ans);
      return ans;
    }
  }

  async setLocalDescription(ans) {
    if (this.peer) {
      await this.peer.setLocalDescription(new RTCSessionDescription(ans));
    }
  }

  async setRemoteDescription(offer) {
    if (this.peer) {
      await this.peer.setRemoteDescription(new RTCSessionDescription(offer)); // ✅ fixed this line
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

const peer = new PeerService();
export default peer;
