// ==========================================
// FILE: src/pages/InterviewPage.tsx
// ==========================================

import axios from "axios";

import { useEffect, useRef, useState } from "react";

import { FaceMesh } from "@mediapipe/face_mesh";

import { toast } from "react-hot-toast";

import { useParams, useSearchParams } from "react-router-dom";

interface Props {
  socket: any;
}

const InterviewPage = ({ socket }: Props) => {
  // ==========================================
  // ROUTER
  // ==========================================

  const { roomId } = useParams();

  const [searchParams] = useSearchParams();

  const interviewId = searchParams.get("interviewId");
  const role = searchParams.get("role");

  const isCandidate = role === "candidate";

  // ==========================================
  // STATES
  // ==========================================

  const [questions, setQuestions] = useState<string[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [currentQuestion, setCurrentQuestion] = useState("");

  const currentQuestionRef =
  useRef("");

  const [candidateAnswer, setCandidateAnswer] = useState("");

  const [isListening, setIsListening] = useState(false);



  const questionStartTimeRef = useRef<number>(0);

  const recognitionRef = useRef<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const processingRef = useRef(false);

  const questionsRef = useRef<string[]>([]);


  const silenceTimeoutRef =
  useRef<any>(null);


  
  

  const movingNextRef = useRef(false);

  const interviewEndedRef = useRef(false);

  const questionTimeoutRef = useRef<any>(null);

    const askingRef = useRef(false);


  // ==========================================
  // END INTERVIEW
  // ==========================================

  const handleEndInterview = () => {
    interviewEndedRef.current = true;

    clearTimeout(questionTimeoutRef.current);

    socket.emit("end-interview", {
      roomId,
    });

    window.location.href = `/code/${roomId}`;
  };

  // ==========================================
  // AUTO START INTERVIEW
  // ==========================================

  const hasStarted = useRef(false);

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleJoin = () => {
      console.log("👤 Candidate joining room:", roomId);
      socket.emit("join", { roomId, color: "#3178c6" });
    };

    if (socket.connected) {
      handleJoin();
    }

    socket.on("connect", handleJoin);

    return () => {
      socket.off("connect", handleJoin);
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (interviewId && !hasStarted.current) {
      hasStarted.current = true;

      generateQuestions(interviewId);
    }
  }, [interviewId]);

  useEffect(() => {
    if (!isCandidate) return;

    const handleBlur = () => {
      socket.emit("tab-inactive", {
        roomId,

        message: "Tab Switching Detected",
      });
    };

    const handleFocus = () => {
      socket.emit("tab-active", {
        roomId,

        message: "Returned To Interview",
      });
    };

    window.addEventListener("blur", handleBlur);

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);

      window.removeEventListener("focus", handleFocus);
    };
  }, [socket, roomId, isCandidate]);

  // ==========================================
  // SAME STREAM
  // ==========================================

  useEffect(() => {
    const stream = (window as any).interviewStream;

    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, []);

  // ==========================================
  // SOCKET LISTENER
  // ==========================================

  useEffect(() => {
    socket.on("end-interview", ({ roomId }: { roomId: string }) => {
      window.location.href = `/code/${roomId}`;
    });

    return () => {
      socket.off("end-interview");
    };
  }, [socket]);

  useEffect(() => {
    const onTabInactive = ({ message }: { message: string }) => {
      toast(message, {
        icon: "⚠️",
      });
    };

    const onTabActive = ({ message }: { message: string }) => {
      toast.success(message);
    };

    socket.on("user-tab-inactive", onTabInactive);

    socket.on("user-tab-active", onTabActive);

    return () => {
      socket.off("user-tab-inactive", onTabInactive);

      socket.off("user-tab-active", onTabActive);
    };
  }, [socket]);
  // ==========================================
  // GENERATE QUESTIONS
  // ==========================================

  const generateQuestions = async (interviewId: string) => {
    try {
      const res = await axios.post(
        `https://ai-interview-system-5gbg.onrender.com/question/askquestion/${interviewId}`,

        {
          roomId,
        },

        {
          withCredentials: true,
        },
      );

      const generatedQuestions = res.data.data.map(
        (item: any) => item.question,
      );

      console.log("QUESTIONS:", generatedQuestions);

      setQuestions(generatedQuestions);

      questionsRef.current = generatedQuestions;

      startInterview(generatedQuestions);
    } catch (error) {
      console.log("API ERROR:", error);
    }
  };

  // ==========================================
  // START INTERVIEW
  // ==========================================
  const interviewStartedRef = useRef(false);

  const startInterview = (questionsData: string[]) => {
    if (interviewStartedRef.current) return;

    interviewStartedRef.current = true;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      `Welcome to MindBrain invations interview session.

Please answer confidently.

Best of luck.
`,
    );

    utterance.lang = "en-US";

    utterance.rate = 0.9;

    utterance.pitch = 1;

    utterance.volume = 1;

    utterance.onend = () => {
      askQuestion(0, questionsData);
    };

    window.speechSynthesis.speak(utterance);
  };

  // ==========================================
  // START RECOGNITION
  // ==========================================

  const startRecognition = () => {
    if (interviewEndedRef.current) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.log("Recognition already started");
      }
    }
  };

  // ==========================================
  // SPEAK FUNCTION
  // ==========================================

 const speak = (
  text: string,
  startListening = false
) => {

  // prevent double speak
  if (askingRef.current) return;

  askingRef.current = true;

  // stop previous speech
  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";

  utterance.rate = 1;

  utterance.pitch = 1;

  utterance.volume = 1;

  utterance.onend = () => {

    askingRef.current = false;

    if (
      startListening &&
      !interviewEndedRef.current
    ) {

      setTimeout(() => {

        startRecognition();

      }, 500);
    }
  };

  window.speechSynthesis.speak(
    utterance
  );
};

  // ==========================================
  // ASK QUESTION
  // ==========================================

 const askQuestion = (
  index: number,
  questionsData: string[]
) => {

  if (
    askingRef.current ||
    interviewEndedRef.current
  ) return;

  clearTimeout(
    questionTimeoutRef.current
  );

  if (
    index >= questionsData.length
  ) {

    interviewEndedRef.current = true;

    speak("Interview completed. Thank you.");

    setTimeout(() => {
      socket.emit("end-interview", { roomId });
      window.location.href = `/code/${roomId}`;
    }, 3000);

    return;
  }


  const question =
    questionsData[index];

  console.log(
    "ASKING:",
    question
  );

setCurrentQuestion(question);

currentQuestionRef.current =
  question;

  speak(question, true);

  questionStartTimeRef.current = Date.now();

  questionTimeoutRef.current =
    setTimeout(() => {

      if (
        !movingNextRef.current &&
        !interviewEndedRef.current
      ) {

        nextQuestion();
      }

    }, 20000);
};

  // ==========================================
  // NEXT QUESTION
  // ==========================================

  const nextQuestion = () => {

  if (
    interviewEndedRef.current
  ) return;

  setCurrentIndex((prev) => {

    const nextIndex =
      prev + 1;

    console.log(
      "NEXT INDEX:",
      nextIndex
    );

    if (
      nextIndex >=
      questionsRef.current.length
    ) {

      interviewEndedRef.current =
        true;

      clearTimeout(
        questionTimeoutRef.current
      );

      speak("Interview completed. Thank you.");

      setTimeout(() => {
        socket.emit("end-interview", { roomId });
        window.location.href = `/code/${roomId}`;
      }, 3000);

      return prev;
    }

    setTimeout(() => {

      askQuestion(
        nextIndex,
        questionsRef.current
      );

    }, 500);

    return nextIndex;
  });
};

  // ==========================================
  // SPEECH RECOGNITION
  // ==========================================

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition Not Supported");

      return;
    }

    const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";

    // ==========================================
    // EDGE + CHROME SUPPORT
    // ==========================================

    const isEdge = navigator.userAgent.includes("Edg");

    if (isEdge) {
      recognition.continuous = false;

      recognition.interimResults = true;
    } else {
      recognition.continuous = true;

   recognition.interimResults = true;
    }

    recognition.maxAlternatives = 5;

    // ==========================================
    // START
    // ==========================================

    recognition.onstart = () => {
      console.log("LISTENING...");

      setIsListening(true);
    };

    // ==========================================
    // END
    // =========================================
recognition.onend = () => {

  console.log(
    "RECOGNITION ENDED"
  );

  setIsListening(false);

  // AUTO RESTART
  if (
    !interviewEndedRef.current &&
    !movingNextRef.current
  ) {

    setTimeout(() => {

      try {

        recognition.start();

      } catch (err) {

        console.log(
          "Restart Error"
        );
      }

    }, 500);
  }
};



    // ==========================================
    // ERROR
    // ==========================================

    recognition.onerror = (event: any) => {
      console.log("Speech Error:", event.error);

      setIsListening(false);

      // no speech
      // if (
      //   event.error ===
      //   "no-speech"
      // ) {

      //   clearTimeout(
      //     questionTimeoutRef.current
      //   );

      //   if (
      //     !movingNextRef.current
      //   ) {

      //     setTimeout(() => {

      //       nextQuestion();

      //     }, 1000);
      //   }
      // }

      // // network issue
      // else if (
      //   event.error ===
      //   "network"
      // ) {

      //   setTimeout(() => {

      //     startRecognition();

      //   }, 1000);
      // }
      if (event.error === "no-speech") {
        console.log("No speech detected");
      }
    };

    // ==========================================
    // RESULT
    // ==========================================





// ==========================================
// RESULT
// ==========================================

let finalTranscript = "";

recognition.onresult =
  (event: any) => {

    if (
      movingNextRef.current
    ) return;

    clearTimeout(
      questionTimeoutRef.current
    );

    let interimTranscript =
      "";

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {

      const result =
        event.results[i];

      const transcript =
        result[0].transcript;

      // FINAL SPEECH
      if (result.isFinal) {

        finalTranscript +=
          transcript + " ";

      } else {

        interimTranscript +=
          transcript;
      }
    }

    // LIVE UI
    setCandidateAnswer(

      finalTranscript +
      interimTranscript
    );

    // CLEAR OLD TIMER
    clearTimeout(
      silenceTimeoutRef.current
    );

    // WAIT FOR USER TO STOP SPEAKING
    silenceTimeoutRef.current =
      setTimeout(() => {

   try {

  recognition.stop();

} catch (err) {

  console.log(
    "Stop Error"
  );
}

        // CLEAN TEXT
        let cleanAnswer =

          finalTranscript
            .trim()
            .replace(
              /\s+/g,
              " "
            );

        // REMOVE DUPLICATE WORDS
        const words =
          cleanAnswer.split(
            " "
          );

        cleanAnswer =
          words.filter(
            (
              word,
              index
            ) => {

              return (

                word
                  .toLowerCase()

                !==

                words[
                  index - 1
                ]
                  ?.toLowerCase()
              );
            }
          ).join(" ");

        console.log(
          "FINAL ANSWER:",
          cleanAnswer
        );

        // SAVE ONLY FINAL ANSWER
        const timeTaken = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
        const wordCount = cleanAnswer ? cleanAnswer.trim().split(/\s+/).filter(Boolean).length : 0;

        socket.emit(
          "candidate-answer",
          {

            roomId,

            interviewId,

            question:
              currentQuestionRef.current,

            answer:
              cleanAnswer,

            timeTaken,

            wordCount,
          }
        );

        // FINAL UI
        setCandidateAnswer(
          cleanAnswer
        );

        movingNextRef.current =
          true;

        setTimeout(() => {

          nextQuestion();

          movingNextRef.current =
            false;

        }, 1000);

        // RESET
        finalTranscript =
          "";

      }, 4000);
  };

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const startTracking = async () => {
      video.onloadedmetadata = async () => {
        const faceMesh = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          },
        });

        faceMesh.setOptions({
          maxNumFaces: 5,

          refineLandmarks: true,

          minDetectionConfidence: 0.5,

          minTrackingConfidence: 0.5,
        });

        let previousNoseX: number | null = null;

        let lastEyeViolation = 0;

        let lastWarningTime = 0;

        const showToast = (message: string) => {
          const now = Date.now();

          if (now - lastWarningTime > 2000) {
            lastWarningTime = now;

            toast.error(message);
          }
        };

        faceMesh.onResults((results) => {
          const faces = results.multiFaceLandmarks;

          // ==========================================
          // NO FACE
          // ==========================================

          if (!faces || faces.length === 0) {
            showToast("No Face Detected");

            socket.emit("track-time", {
              roomId,

              userId: socket.id,

              username: "Candidate",

              type: "no_face_detected",
            });

            return;
          }


          if (faces.length >= 2) {
            showToast("Multiple Faces Detected");

            socket.emit("track-time", {
              roomId,

              userId: socket.id,

              username: "Candidate",

              type: "multiple_faces",
            });

            return;
          }

          const landmarks = faces[0];

          // ==========================================
          // HEAD MOVEMENT
          // ==========================================

          const nose = landmarks[1];

          if (previousNoseX !== null) {
            const diff = Math.abs(nose.x - previousNoseX);

            if (diff > 0.088) {
              showToast("Head Movement");

              socket.emit("track-time", {
                roomId,

                userId: socket.id,

                username: "Candidate",

                type: "head_movement",
              });
            }
          }

          previousNoseX = nose.x;

          // ==========================================
          // EYE TRACKING
          // ==========================================

          const leftEyeLeft = landmarks[33];

          const leftEyeRight = landmarks[133];

          const leftIris = landmarks[468];

          const eyeWidth = leftEyeRight.x - leftEyeLeft.x;

          const irisPosition = (leftIris.x - leftEyeLeft.x) / eyeWidth;

          const now = Date.now();

          // ==========================================
          // LOOKING LEFT
          // ==========================================

          if (irisPosition < 0.4 && now - lastEyeViolation > 1500) {
            lastEyeViolation = now;

            showToast("Looking Left");

            socket.emit("track-time", {
              roomId,

              userId: socket.id,

              username: "Candidate",

              type: "looking_left",
            });
          }

          // ==========================================
          // LOOKING RIGHT
          // ==========================================
          else if (irisPosition > 0.6 && now - lastEyeViolation > 1500) {
            lastEyeViolation = now;

            showToast("Looking Right");

            socket.emit("track-time", {
              roomId,

              userId: socket.id,

              username: "Candidate",

              type: "looking_right",
            });
          }
        });

        const interval = setInterval(async () => {
          if (video.readyState >= 2 && !processingRef.current) {
            try {
              processingRef.current = true;

              await faceMesh.send({
                image: video,
              });
            } catch (err) {
              console.log(err);
            } finally {
              processingRef.current = false;
            }
          }
        }, 1000);

        return () => {
          clearInterval(interval);
        };
      };
    };

    startTracking();
  }, [socket, roomId]);



  return (
    <div
      className="
        min-h-screen
        bg-black
        text-white
        flex
        flex-col
        items-center
        justify-center
        px-6
      "
    >
      <h1
        className="
          text-5xl
          font-bold
          mb-10
        "
      >
        AI Interview
      </h1>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="
          w-72
          h-52
          rounded-2xl
          border
          border-cyan-500/30
          object-cover
          scale-x-[-1]
          mb-8
        "
      />

      <div
        className="
          w-full
          max-w-4xl
          rounded-2xl
          border
          border-cyan-500/30
          bg-white/5
          p-8
          backdrop-blur-lg
        "
      >
        <h2
          className="
            text-xl
            text-cyan-400
            mb-4
            font-semibold
          "
        >
          Current Question
        </h2>

        <p
          className="
            text-2xl
            leading-relaxed
          "
        >
          {currentQuestion}
        </p>
      </div>

      <div
        className="
          mt-8
          px-6
          py-3
          rounded-xl
          border
          border-cyan-500/40
          bg-cyan-500/10
          text-lg
        "
      >
        {isListening ? "🎤 Listening..." : "🤖 AI Speaking..."}
      </div>

      <div
        className="
          mt-8
          w-full
          max-w-4xl
          rounded-2xl
          border
          border-white/10
          bg-white/5
          p-6
        "
      >
        <h3
          className="
            text-lg
            text-green-400
            mb-3
            font-semibold
          "
        >
          Candidate Answer
        </h3>

        <p
          className="
            text-lg
            text-white/80
          "
        >
          {candidateAnswer}
        </p>
      </div>

      <button
        onClick={handleEndInterview}
        className="
          mt-10
          px-8
          py-4
          rounded-2xl
          bg-red-600
          hover:bg-red-700
          text-white
          font-bold
          transition-all
        "
      >
        End Interview
      </button>
    </div>
  );
};

export default InterviewPage;
