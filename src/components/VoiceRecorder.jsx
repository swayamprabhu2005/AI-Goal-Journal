import { useState, useRef, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { journalApi } from '../services/api';

export default function VoiceRecorder({ onTranscriptReady, onDirectSubmit, isSubmitting = false }) {
  const [recordingState, setRecordingState] = useState('idle'); // idle | recording | recorded | transcribing | transcribed | error
  const [errorMessage, setErrorMessage] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Check browser API support on mount
  const isSupported =
    typeof window !== 'undefined' &&
    navigator?.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== 'undefined';

  useEffect(() => {
    return () => {
      stopTracks();
      clearTimer();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  function stopTracks() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    if (!isSupported) {
      setErrorMessage('Audio recording is not supported in this browser.');
      setRecordingState('error');
      return;
    }

    setErrorMessage('');
    setTranscript('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(recordedBlob);
        setAudioBlob(recordedBlob);
        setAudioUrl(url);
        setRecordingState('recorded');
        stopTracks();
      };

      mediaRecorder.start(250);
      setRecordingState('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      stopTracks();
      clearTimer();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please grant microphone permission in your browser to record.');
      } else {
        setErrorMessage('Could not access microphone: ' + err.message);
      }
      setRecordingState('error');
    }
  }

  function stopRecording() {
    clearTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  function discardRecording() {
    clearTimer();
    stopTracks();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setTranscript('');
    setRecordingState('idle');
    setErrorMessage('');
  }

  async function handleTranscribe() {
    if (!audioBlob) {
      setErrorMessage('No recorded audio available to transcribe.');
      return;
    }

    setRecordingState('transcribing');
    setErrorMessage('');

    try {
      const result = await journalApi.transcribeAudio(audioBlob);
      const text = (result.transcript || '').trim();
      if (!text) {
        setErrorMessage('Whisper transcribed empty audio. Please try recording again closer to the microphone.');
        setRecordingState('recorded');
        return;
      }
      setTranscript(text);
      setRecordingState('transcribed');
    } catch (err) {
      console.error('Transcription error:', err);
      setErrorMessage(err.message || 'Could not transcribe audio.');
      setRecordingState('recorded');
    }
  }

  function handleUseTranscript() {
    if (onTranscriptReady && transcript) {
      onTranscriptReady(transcript);
    }
  }

  function handleSubmitDirectly() {
    if (onDirectSubmit && transcript) {
      onDirectSubmit(transcript, 'voice');
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  if (!isSupported) {
    return (
      <Card className="mb-6 border-status-warning/40 bg-status-warning-bg">
        <h3 className="font-semibold text-foreground">Voice Journal</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Audio recording is not supported by your current browser. Please use text journaling or switch to a modern browser.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-card-border bg-card-grad p-6 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
            <span className="text-accent">🎙️</span> Voice Reflection (faster-whisper Tiny)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Speak naturally about your day. Transcribed locally on CPU (INT8) with zero cloud speech API fees.
          </p>
        </div>

        {recordingState === 'recording' && (
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 border border-accent/40 px-3 py-1 self-start sm:self-auto">
            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-accent" />
            <span className="font-mono text-xs font-bold text-accent">
              Recording: {formatTime(recordingTime)}
            </span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div role="alert" className="mb-4 rounded-card bg-status-error-bg p-3 text-xs text-status-error border border-status-error/30">
          <strong>Notice: </strong> {errorMessage}
        </div>
      )}

      {/* State Controls */}
      <div className="flex flex-col gap-4">
        {/* 1. Idle or Error State */}
        {(recordingState === 'idle' || recordingState === 'error') && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={startRecording} className="gap-2 px-5 py-3">
              <span className="text-lg text-accent">🎙️</span> Start Recording Voice
            </Button>
            <span className="text-xs text-muted-foreground">Microphone access required</span>
          </div>
        )}

        {/* 2. Live Recording State */}
        {recordingState === 'recording' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center p-6 bg-muted/80 rounded-card border border-card-border">
              <div className="flex items-center gap-1.5">
                {[40, 70, 30, 90, 60, 80, 45, 95, 60, 30, 75].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1.5 rounded-full bg-accent animate-pulse transition-all duration-150 h-8"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="danger"
                onClick={stopRecording}
                className="gap-2"
              >
                <span>⏹️</span> Stop & Review Recording
              </Button>
              <span className="text-xs text-muted-foreground">Speak naturally about your accomplishments & blockers...</span>
            </div>
          </div>
        )}

        {/* 3. Recorded State (Audio Preview & Transcribe action) */}
        {recordingState === 'recorded' && audioUrl && (
          <div className="flex flex-col gap-3 rounded-card bg-muted/90 p-4 border border-card-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Audio Preview ({formatTime(recordingTime)})
              </span>
              <span className="text-[11px] text-accent font-medium">Ready for local transcription</span>
            </div>

            <audio controls src={audioUrl} className="w-full h-10 accent-primary" />

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-card-border/60">
              <Button variant="ghost" onClick={discardRecording} className="text-xs">
                🗑️ Discard
              </Button>
              <Button onClick={handleTranscribe} className="text-xs">
                ✨ Transcribe with Whisper Tiny
              </Button>
            </div>
          </div>
        )}

        {/* 4. Transcribing State */}
        {recordingState === 'transcribing' && (
          <div className="flex flex-col items-center justify-center rounded-card bg-muted/90 p-8 border border-card-border text-center">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-secondary-foreground/30 border-t-accent mb-3" />
            <p className="text-sm font-bold text-foreground font-display">Transcribing locally with faster-whisper Tiny...</p>
            <p className="text-xs text-muted-foreground mt-1">Zero cloud API costs. CPU INT8 processing takes a few moments.</p>
          </div>
        )}

        {/* 5. Transcribed State (Editable Review Workflow) */}
        {recordingState === 'transcribed' && (
          <div className="flex flex-col gap-3 rounded-card bg-secondary/80 p-5 border border-primary/40 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary-foreground flex items-center gap-1.5">
                <span>✏️</span> Review & Edit Transcript Before Submission
              </span>
              <span className="text-[11px] text-accent font-mono">Editable text</span>
            </div>

            <textarea
              rows={5}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full resize-none rounded-card border border-card-border bg-background/90 p-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-relaxed"
              placeholder="Your transcribed reflection appears here..."
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-card-border/60">
              <Button variant="ghost" onClick={discardRecording} disabled={isSubmitting} className="text-xs">
                Discard Recording
              </Button>

              <div className="flex items-center gap-2">
                {onTranscriptReady && (
                  <Button variant="secondary" onClick={handleUseTranscript} disabled={isSubmitting || !transcript.trim()} className="text-xs">
                    📋 Copy to Text Editor
                  </Button>
                )}
                {onDirectSubmit && (
                  <Button onClick={handleSubmitDirectly} loading={isSubmitting} disabled={isSubmitting || !transcript.trim()} className="text-xs">
                    {isSubmitting ? 'Analyzing with Gemini...' : '🚀 Submit Voice Journal'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
