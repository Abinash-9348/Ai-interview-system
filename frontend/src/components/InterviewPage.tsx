// ==========================================
// FILE: src/pages/InterviewPage.tsx
// ==========================================

import axios from "axios";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { FaceMesh }
  from "@mediapipe/face_mesh";

import { toast }
  from "react-hot-toast";

import {
  useParams,
  useSearchParams,
} from "react-router-dom";

interface Props {
  socket: any;
}

const InterviewPage = ({
  socket,
}: Props) => {

  // ==========================================
  // ROUTER
  // ==========================================

  const { roomId } =
    useParams();

  const [searchParams] =
    useSearchParams();

  const interviewId =
    searchParams.get(
      "interviewId"
    );

  // ==========================================
  // STATES
  // ==========================================

  const [questions,
    setQuestions] =
    useState<string[]>([]);

  const [currentIndex,
    setCurrentIndex] =
    useState(0);

  const [currentQuestion,
    setCurrentQuestion] =
    useState("");

  const [candidateAnswer,
    setCandidateAnswer] =
    useState("");

  const [isListening,
    setIsListening] =
    useState(false);

  const recognitionRef =
    useRef<any>(null);

  const videoRef =
    useRef<HTMLVideoElement>(null);

  const processingRef =
    useRef(false);

  const questionsRef =
    useRef<string[]>([]);

  const movingNextRef =
    useRef(false);

  const interviewEndedRef =
    useRef(false);

  const questionTimeoutRef =
    useRef<any>(null);

  // ==========================================
  // END INTERVIEW
  // ==========================================

  const handleEndInterview =
    () => {

      interviewEndedRef.current =
        true;

      clearTimeout(
        questionTimeoutRef.current
      );

      socket.emit(
        "end-interview",
        {
          roomId,
        }
      );

      window.location.href =
        `/code/${roomId}`;
    };

  // ==========================================
  // AUTO START INTERVIEW
  // ==========================================

  const hasStarted =
    useRef(false);

  useEffect(() => {

    if (
      interviewId &&
      !hasStarted.current
    ) {

      hasStarted.current =
        true;

      generateQuestions(
        interviewId
      );
    }

  }, [interviewId]);

  // ==========================================
  // SAME STREAM
  // ==========================================

  useEffect(() => {

    const stream =
      (
        window as any
      ).interviewStream;

    if (
      stream &&
      videoRef.current
    ) {

      videoRef.current.srcObject =
        stream;
    }

  }, []);

  // ==========================================
  // SOCKET LISTENER
  // ==========================================

  useEffect(() => {

    socket.on(
      "end-interview",
      ({
        roomId,
      }: {
        roomId: string;
      }) => {

        window.location.href =
          `/code/${roomId}`;
      }
    );

    return () => {

      socket.off(
        "end-interview"
      );
    };

  }, [socket]);

  // ==========================================
  // GENERATE QUESTIONS
  // ==========================================

  const generateQuestions =
    async (
      interviewId: string
    ) => {

      try {

        const res =
          await axios.post(
            `http://localhost:8000/question/askquestion/${interviewId}`
          );

        const generatedQuestions =
          res.data.data.map(
            (item: any) =>
              item.question
          );

        console.log(
          "QUESTIONS:",
          generatedQuestions
        );

        setQuestions(
          generatedQuestions
        );

        questionsRef.current =
          generatedQuestions;

        startInterview(
          generatedQuestions
        );

      } catch (error) {

        console.log(
          "API ERROR:",
          error
        );
      }
    };

  // ==========================================
  // START INTERVIEW
  // ==========================================

  const startInterview =
    (
      questionsData: string[]
    ) => {

      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          `
Namaskar.

Welcome to Doctor Abinash Software Solution interview session.

Please answer confidently.

Best of luck.
`
        );

      utterance.lang =
        "en-US";

      utterance.rate =
        0.9;

      utterance.pitch =
        1;

      utterance.volume =
        1;

      utterance.onend =
        () => {

          askQuestion(
            0,
            questionsData
          );
        };

      window.speechSynthesis.speak(
        utterance
      );
    };

  // ==========================================
  // START RECOGNITION
  // ==========================================

  const startRecognition =
    () => {

      if (
        interviewEndedRef.current
      ) return;

      if (
        recognitionRef.current
      ) {

        try {

          recognitionRef.current.start();

        } catch (err) {

          console.log(
            "Recognition already started"
          );
        }
      }
    };

  // ==========================================
  // SPEAK FUNCTION
  // ==========================================

  const speak = (
    text: string,
    startListening =
      false
  ) => {

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    utterance.lang =
      "en-US";

    utterance.rate =
      1;

    utterance.pitch =
      1;

    utterance.volume =
      1;

    utterance.onend =
      () => {

        if (
          startListening &&
          !interviewEndedRef.current
        ) {

          setTimeout(() => {

            startRecognition();

          }, 700);
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

    // clear old timeout
    if (
      questionTimeoutRef.current
    ) {

      clearTimeout(
        questionTimeoutRef.current
      );
    }

    if (
      index >=
      questionsData.length
    ) {

      interviewEndedRef.current =
        true;

      window.speechSynthesis.cancel();

      speak(`
Interview completed.
Thank you.
`);

      return;
    }

    const question =
      questionsData[index];

    console.log(
      "ASKING:",
      question
    );

    setCurrentQuestion(
      question
    );

    speak(
      question,
      true
    );

    // auto next after 20 sec
    questionTimeoutRef.current =
      setTimeout(() => {

        if (
          !movingNextRef.current &&
          !interviewEndedRef.current
        ) {

          console.log(
            "TIME OUT NEXT QUESTION"
          );

          nextQuestion();
        }

      }, 20000);
  };

  // ==========================================
  // NEXT QUESTION
  // ==========================================

  const nextQuestion =
    () => {

      if (
        movingNextRef.current
      ) return;

      movingNextRef.current =
        true;

      setCurrentIndex(
        (prev) => {

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

            speak(`
Interview completed.
Thank you.
`);

            return prev;
          }

          askQuestion(
            nextIndex,
            questionsRef.current
          );

          return nextIndex;
        }
      );

      setTimeout(() => {

        movingNextRef.current =
          false;

      }, 2000);
    };

  // ==========================================
  // SPEECH RECOGNITION
  // ==========================================

  useEffect(() => {

    const SpeechRecognition =
      (
        window as any
      ).SpeechRecognition ||
      (
        window as any
      ).webkitSpeechRecognition;

    if (!SpeechRecognition) {

      alert(
        "Speech Recognition Not Supported"
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang =
      "en-US";

    // ==========================================
    // EDGE + CHROME SUPPORT
    // ==========================================

    const isEdge =
      navigator.userAgent
        .includes("Edg");

    if (isEdge) {

      recognition.continuous =
        false;

      recognition.interimResults =
        true;

    } else {

      recognition.continuous =
        true;

      recognition.interimResults =
        false;
    }

    recognition.maxAlternatives =
      1;

    // ==========================================
    // START
    // ==========================================

    recognition.onstart =
      () => {

        console.log(
          "LISTENING..."
        );

        setIsListening(
          true
        );
      };

    // ==========================================
    // END
    // ==========================================

    recognition.onend =
      () => {

        console.log(
          "RECOGNITION ENDED"
        );

        setIsListening(
          false
        );

        // auto restart
        if (
          !movingNextRef.current &&
          !interviewEndedRef.current
        ) {

          setTimeout(() => {

            startRecognition();

          }, 800);
        }
      };

    // ==========================================
    // ERROR
    // ==========================================

    recognition.onerror =
      (event: any) => {

        console.log(
          "Speech Error:",
          event.error
        );

        setIsListening(
          false
        );

        // no speech
        if (
          event.error ===
          "no-speech"
        ) {

          clearTimeout(
            questionTimeoutRef.current
          );

          if (
            !movingNextRef.current
          ) {

            setTimeout(() => {

              nextQuestion();

            }, 1000);
          }
        }

        // network issue
        else if (
          event.error ===
          "network"
        ) {

          setTimeout(() => {

            startRecognition();

          }, 1000);
        }
      };

    // ==========================================
    // RESULT
    // ==========================================

    recognition.onresult =
      (
        event: any
      ) => {

        clearTimeout(
          questionTimeoutRef.current
        );

        const last =
          event.results.length - 1;

        const transcript =
          event.results[last][0]
            .transcript;

        console.log(
          "ANSWER:",
          transcript
        );

        setCandidateAnswer(
          transcript
        );

        if (
          recognitionRef.current
        ) {

          recognitionRef.current.stop();
        }

        setTimeout(() => {

          nextQuestion();

        }, 1000);
      };

    recognitionRef.current =
      recognition;

  }, []);

  // ==========================================
  // FACEMESH
  // ==========================================

// ==========================================
// FACEMESH + DB STORE
// ==========================================

// ==========================================
// FACEMESH + TRACK TIME + DB STORE
// ==========================================

useEffect(() => {

  const video =
    videoRef.current;

  if (!video) return;

  const startTracking =
    async () => {

      video.onloadedmetadata =
        async () => {

          const faceMesh =
            new FaceMesh({

              locateFile:
                (file) => {

                  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                },
            });

          faceMesh.setOptions({

            maxNumFaces: 5,

            refineLandmarks:
              true,

            minDetectionConfidence:
              0.5,

            minTrackingConfidence:
              0.5,
          });

          let previousNoseX:
            number | null =
            null;

          let lastEyeViolation =
            0;

          let lastWarningTime =
            0;

          const showToast =
            (
              message: string
            ) => {

              const now =
                Date.now();

              if (
                now -
                lastWarningTime >
                2000
              ) {

                lastWarningTime =
                  now;

                toast.error(
                  message
                );
              }
            };

          faceMesh.onResults(
            (results) => {

              const faces =
                results.multiFaceLandmarks;

              // ==========================================
              // NO FACE
              // ==========================================

              if (
                !faces ||
                faces.length === 0
              ) {

                showToast(
                  "No Face Detected"
                );

                socket.emit(
                  "track-time",
                  {
                    roomId,

                    userId:
                      socket.id,

                    username:
                      "Candidate",

                    type:
                      "no_face_detected",
                  }
                );

                return;
              }

              // ==========================================
              // MULTIPLE FACE
              // ==========================================

              if (
                faces.length >= 2
              ) {

                showToast(
                  "Multiple Faces Detected"
                );

                socket.emit(
                  "track-time",
                  {
                    roomId,

                    userId:
                      socket.id,

                    username:
                      "Candidate",

                    type:
                      "multiple_faces",
                  }
                );

                return;
              }

              const landmarks =
                faces[0];

              // ==========================================
              // HEAD MOVEMENT
              // ==========================================

              const nose =
                landmarks[1];

              if (
                previousNoseX !==
                null
              ) {

                const diff =
                  Math.abs(
                    nose.x -
                    previousNoseX
                  );

                if (
                  diff > 0.03
                ) {

                  showToast(
                    "Head Movement"
                  );

                  socket.emit(
                    "track-time",
                    {
                      roomId,

                      userId:
                        socket.id,

                      username:
                        "Candidate",

                      type:
                        "head_movement",
                    }
                  );
                }
              }

              previousNoseX =
                nose.x;

              // ==========================================
              // EYE TRACKING
              // ==========================================

              const leftEyeLeft =
                landmarks[33];

              const leftEyeRight =
                landmarks[133];

              const leftIris =
                landmarks[468];

              const eyeWidth =
                leftEyeRight.x -
                leftEyeLeft.x;

              const irisPosition =
                (
                  leftIris.x -
                  leftEyeLeft.x
                ) / eyeWidth;

              const now =
                Date.now();

              // ==========================================
              // LOOKING LEFT
              // ==========================================

              if (
                irisPosition <
                  0.40 &&
                now -
                  lastEyeViolation >
                  1500
              ) {

                lastEyeViolation =
                  now;

                showToast(
                  "Looking Left"
                );

                socket.emit(
                  "track-time",
                  {
                    roomId,

                    userId:
                      socket.id,

                    username:
                      "Candidate",

                    type:
                      "looking_left",
                  }
                );
              }

              // ==========================================
              // LOOKING RIGHT
              // ==========================================

              else if (
                irisPosition >
                  0.60 &&
                now -
                  lastEyeViolation >
                  1500
              ) {

                lastEyeViolation =
                  now;

                showToast(
                  "Looking Right"
                );

                socket.emit(
                  "track-time",
                  {
                    roomId,

                    userId:
                      socket.id,

                    username:
                      "Candidate",

                    type:
                      "looking_right",
                  }
                );
              }
            }
          );

          const interval =
            setInterval(
              async () => {

                if (
                  video.readyState >=
                    2 &&
                  !processingRef.current
                ) {

                  try {

                    processingRef.current =
                      true;

                    await faceMesh.send(
                      {
                        image:
                          video,
                      }
                    );

                  } catch (err) {

                    console.log(
                      err
                    );

                  } finally {

                    processingRef.current =
                      false;
                  }
                }

              },
              1000
            );

          return () => {

            clearInterval(
              interval
            );
          };
        };
    };

  startTracking();

}, [
  socket,
  roomId,
]);

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
        {
          isListening
            ? "🎤 Listening..."
            : "🤖 AI Speaking..."
        }
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
        onClick={
          handleEndInterview
        }
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