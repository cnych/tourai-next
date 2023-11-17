"use client";
import "./styles.scss";
import React, { FC, useEffect, useRef, useState } from "react";

const Home: FC = () => {
  const talkVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [streamId, setStreamId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const streamIdRef = useRef(streamId);
  const sessionIdRef = useRef(sessionId);
  const [iceGatheringStatusLabel, setIceGatheringStatusLabel] = useState("");
  const [iceStatusLabel, setIceStatusLabel] = useState("");
  const [peerStatusLabel, setPeerStatusLabel] = useState("");
  const [signalingStatusLabel, setSignalingStatusLabel] = useState("");
  const [streamingStatusLabel, setStreamingStatusLabel] = useState("");
  const [statsIntervalId, setStatsIntervalId] = useState<
    NodeJS.Timeout | undefined
  >(undefined);
  const videoIsPlayingRef = useRef(false);
  const lastBytesReceivedRef = useRef(0);
  const [input, setInput] = useState("");

  useEffect(() => {
    handleConnect();
  }, []); // 空依赖数组意味着这个 useEffect 只在组件挂载时运行一次

  // 清理函数，在组件卸载时执行
  useEffect(() => {
    // 其他副作用逻辑...
    // 清理函数
    return () => {
      handleDestroy();
    };
  }, []); // 空依赖数组表示这个 useEffect 只在组件挂载和卸载时运行

  useEffect(() => {
    streamIdRef.current = streamId;
  }, [streamId]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const handleConnect = async () => {
    console.log("[handleConnect] start connect......");

    if (
      peerConnectionRef.current &&
      peerConnectionRef.current.connectionState === "connected"
    ) {
      return;
    }

    stopAllStreams();
    closePC();

    const sessionResponse = await fetch("/api/talks/stream", {
      method: "POST",
    });
    if (!sessionResponse || !sessionResponse.ok) {
      console.error("[handleConnect] create session failed");
      return;
    }

    const {
      id: newStreamId,
      offer,
      ice_servers: iceServers,
      session_id: newSessionId,
    } = await sessionResponse.json();
    setStreamId(newStreamId);
    setSessionId(newSessionId);

    console.log("[handleConnect] newStreamId=", newStreamId);
    console.log("[handleConnect] newSessionId=", newSessionId);
    console.log("[handleConnect] offer=", offer);
    console.log("[handleConnect] iceServers=", iceServers);

    try {
      const sessionClientAnswer = await createPeerConnection(offer, iceServers);

      console.log("[handleConnect] sessionClientAnswer=", sessionClientAnswer);

      const sdpResponse = await fetch("/api/talks/stream/start", {
        method: "POST",
        body: JSON.stringify({
          answer: sessionClientAnswer,
          sessionId: newSessionId,
          streamId: newStreamId,
        }),
      });

      if (sdpResponse && sdpResponse.ok) {
        const sdpResult = await sdpResponse.json();
        console.log("[handleConnect] sdpResult=", sdpResult);
      } else {
        console.error("[handleConnect] sdpResponse=", sdpResponse);
      }
    } catch (e) {
      console.log("error during streaming setup", e);
      stopAllStreams();
      closePC();
      return;
    }
  };

  const handleTalk = async () => {
    // connectionState not supported in firefox
    if (input === "") {
      console.log("[handleTalk] input is empty");
      return;
    }

    if (
      peerConnectionRef.current?.signalingState === "stable" ||
      peerConnectionRef.current?.iceConnectionState === "connected"
    ) {
      const talkResponse = await fetch(
        `/api/talks/stream/${streamIdRef.current}`,
        {
          method: "POST",
          body: JSON.stringify({
            input: input,
            sessionId: sessionIdRef.current,
          }),
        },
      );
      if (talkResponse && talkResponse.ok) {
        console.log("[handleTalk] talkResponse=", talkResponse.json());
      } else {
        console.error("[handleTalk] talkResponse=", talkResponse);
      }
    }
  };

  const handleDestroy = async () => {
    await fetch(`/api/talks/stream/${streamIdRef.current}`, {
      method: "DELETE",
      body: JSON.stringify({ sessionId: sessionIdRef.current }),
    });
    stopAllStreams();
    closePC();
  };

  const createPeerConnection = async (
    offer: RTCSessionDescriptionInit,
    iceServers: [],
  ) => {
    if (!peerConnectionRef.current) {
      peerConnectionRef.current = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current.addEventListener(
        "icegatheringstatechange",
        onIceGatheringStateChange,
        true,
      );
      peerConnectionRef.current.addEventListener(
        "icecandidate",
        onIceCandidate,
        true,
      );
      peerConnectionRef.current.addEventListener(
        "iceconnectionstatechange",
        onIceConnectionStateChange,
        true,
      );
      peerConnectionRef.current.addEventListener(
        "connectionstatechange",
        onConnectionStateChange,
        true,
      );
      peerConnectionRef.current.addEventListener(
        "signalingstatechange",
        onSignalingStateChange,
        true,
      );
      peerConnectionRef.current.addEventListener("track", onTrack, true);
    }

    console.log(
      "[createPeerConnection] peerConnectionRef.current=",
      peerConnectionRef.current,
    );

    await peerConnectionRef.current.setRemoteDescription(offer);
    console.log("set remote sdp OK");

    const sessionClientAnswer = await peerConnectionRef.current.createAnswer();
    console.log("create local sdp OK");

    await peerConnectionRef.current.setLocalDescription(sessionClientAnswer);
    console.log("set local sdp OK");

    return sessionClientAnswer;
  };

  const onIceGatheringStateChange = () => {
    if (!peerConnectionRef.current) return;
    console.log(
      "onIceGatheringStateChange ",
      peerConnectionRef.current.iceGatheringState,
    );
    setIceGatheringStatusLabel(peerConnectionRef.current.iceGatheringState);
  };

  const onIceCandidate = async (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
      const resp = await fetch("/api/talks/stream/ice", {
        method: "POST",
        body: JSON.stringify({
          candidate,
          sdpMid,
          sdpMLineIndex,
          sessionId: sessionIdRef.current,
          streamId: streamIdRef.current,
        }),
      });
      if (resp && resp.ok) {
        console.log("[onIceCandidate] resp ok");
      } else {
        console.error("[onIceCandidate] resp error", resp);
      }
    }
  };

  const onIceConnectionStateChange = () => {
    console.log("onIceConnectionStateChange");
    if (!peerConnectionRef.current) return;
    setIceStatusLabel(peerConnectionRef.current.iceConnectionState);
    if (
      peerConnectionRef.current.iceConnectionState === "failed" ||
      peerConnectionRef.current.iceConnectionState === "closed"
    ) {
      stopAllStreams();
      closePC();
    }
  };
  const onConnectionStateChange = () => {
    console.log("onConnectionStateChange");
    if (!peerConnectionRef.current) return;
    // not supported in firefox
    setPeerStatusLabel(peerConnectionRef.current.connectionState);
  };
  const onSignalingStateChange = () => {
    console.log("onSignalingStateChange");
    if (!peerConnectionRef.current) return;
    setSignalingStatusLabel(peerConnectionRef.current.signalingState);
  };

  const onTrack = (event: RTCTrackEvent) => {
    if (!event.track) return;
    const pc = peerConnectionRef.current;
    if (!pc) return;
    const intervalId = setInterval(async () => {
      const stats = await pc.getStats(event.track);
      stats.forEach((report) => {
        if (report.type === "inbound-rtp" && report.mediaType === "video") {
          const videoStatusChanged =
            videoIsPlayingRef.current !==
            report.bytesReceived > lastBytesReceivedRef.current;
          if (videoStatusChanged) {
            videoIsPlayingRef.current =
              report.bytesReceived > lastBytesReceivedRef.current;
            onVideoStatusChange(videoIsPlayingRef.current, event.streams[0]);
          }
          lastBytesReceivedRef.current = report.bytesReceived;
        }
      });
    }, 500);
    setStatsIntervalId(intervalId);
  };

  const onVideoStatusChange = (
    videoIsPlaying: boolean,
    stream: MediaStream,
  ) => {
    let status;
    if (videoIsPlaying) {
      status = "streaming";
      const remoteStream = stream;
      setVideoElement(remoteStream);
    } else {
      status = "empty";
      playIdleVideo();
    }
    setStreamingStatusLabel(status);
  };

  const setVideoElement = (stream: MediaStream) => {
    if (!stream) return;
    if (!talkVideoRef.current) return;
    talkVideoRef.current.srcObject = stream;
    talkVideoRef.current.loop = false;

    // safari hotfix
    if (talkVideoRef.current.paused) {
      talkVideoRef.current
        .play()
        .then((_) => {})
        .catch((e) => {});
    }
  };

  const playIdleVideo = () => {
    if (!talkVideoRef.current) return;
    talkVideoRef.current.srcObject = null;
    talkVideoRef.current.src = "/videos/or_idle.mp4";
    talkVideoRef.current.loop = true;
  };

  const stopAllStreams = () => {
    const videoElement = talkVideoRef.current;
    if (!videoElement) return;

    const mediaStream = videoElement.srcObject as MediaStream;
    if (mediaStream) {
      console.log("stopping video streams");
      mediaStream.getTracks().forEach((track) => track.stop());
      videoElement.srcObject = null;
    }
  };

  // 清理PeerConnection
  const closePC = () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    console.log("stopping peer connection");
    pc.close();
    pc.removeEventListener(
      "icegatheringstatechange",
      onIceGatheringStateChange,
      true,
    );
    pc.removeEventListener("icecandidate", onIceCandidate, true);
    pc.removeEventListener(
      "iceconnectionstatechange",
      onIceConnectionStateChange,
      true,
    );
    pc.removeEventListener(
      "connectionstatechange",
      onConnectionStateChange,
      true,
    );
    pc.removeEventListener(
      "signalingstatechange",
      onSignalingStateChange,
      true,
    );
    pc.removeEventListener("track", onTrack, true);
    clearInterval(statsIntervalId);
    setIceStatusLabel("");
    setPeerStatusLabel("");
    setIceGatheringStatusLabel("");
    setSignalingStatusLabel("");

    console.log("stopped peer connection");

    peerConnectionRef.current = null;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="content">
        <div className="video-wrapper">
          <div>
            <video
              src="/videos/or_idle.mp4"
              ref={talkVideoRef}
              id="talk-video"
              width="400"
              height="400"
              autoPlay
            ></video>
          </div>
        </div>
        <div id="status">
          ICE gathering status:{" "}
          <label
            id="ice-gathering-status-label"
            className={`iceGatheringState-${iceGatheringStatusLabel}`}
          >
            {iceGatheringStatusLabel}
          </label>
          <br />
          ICE status:{" "}
          <label
            id="ice-status-label"
            className={`iceConnectionState-${iceStatusLabel}`}
          >
            {iceStatusLabel}
          </label>
          <br />
          Peer connection status:{" "}
          <label
            id="peer-status-label"
            className={`peerConnectionState-${peerStatusLabel}`}
          >
            {peerStatusLabel}
          </label>
          <br />
          Signaling status:{" "}
          <label
            id="signaling-status-label"
            className={`signalingState-${signalingStatusLabel}`}
          >
            {signalingStatusLabel}
          </label>
          <br />
          Streaming status:{" "}
          <label
            id="streaming-status-label"
            className={`streamingState-${streamingStatusLabel}`}
          >
            {streamingStatusLabel}
          </label>
          <br />
        </div>
        <br />

        <div className="flex items-center mt-8 m-auto">
          <input
            className="p-3"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
          />

          <button
            id="talk-button"
            type="button"
            onClick={() => {
              handleTalk();
            }}
          >
            Start
          </button>
        </div>
      </div>
    </main>
  );
};

export default React.memo(Home);
