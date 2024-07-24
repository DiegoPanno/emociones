import React, { useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const emotionEmoticons = {
  neutral: "😐",
  happy: "😃",
  sad: "😢",
  angry: "😡",
  fearful: "😨",
  disgusted: "🤢",
  surprised: "😮"
};

const FaceDetection = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const emoticonsDivRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'), 
        faceapi.nets.ageGenderNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.tinyFaceDetector.loadFromUri('/models')
      ]);
      startVideo();
    };

    const startVideo = () => {
      navigator.getUserMedia(
        { video: {} },
        stream => {
          videoRef.current.srcObject = stream;
        },
        err => console.error(err)
      );
    };

    loadModels();
  }, []);

  useEffect(() => {
    videoRef.current.addEventListener('play', async () => {
      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      document.body.append(canvas);
      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(videoRef.current)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        emoticonsDivRef.current.innerHTML = '';

        if (detections.length > 0) {
          const emotions = detections[0].expressions;
          const maxEmotion = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);
          const emoticon = emotionEmoticons[maxEmotion];

          const emoticonElement = document.createElement('div');
          emoticonElement.className = 'emoticon';
          emoticonElement.textContent = emoticon;
          emoticonsDivRef.current.appendChild(emoticonElement);
        }

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      }, 100);
    });
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay muted width="auto" height="auto" />
      <div ref={emoticonsDivRef} id="emoticons"></div>
    </div>
  );
};

export default FaceDetection;
