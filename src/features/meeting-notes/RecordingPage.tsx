import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiMic, FiMicOff, FiSave } from 'react-icons/fi';
import { Meeting } from '../../types/electron';
import style from './style/MeetingNotes.module.css';

const formatTime = (seconds: number) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const RecordingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!id) return;
    window.lostarkAPI.meetingGet(id).then((res) => {
      if (res.success && res.data) setMeeting(res.data);
    });
  }, [id]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    } catch {
      showToast('마이크 접근 권한이 필요합니다.', 'error');
    }
  };

  const stopRecording = () => {
    return new Promise<Blob>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) return;

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        recorder.stream.getTracks().forEach((t) => t.stop());
        resolve(blob);
      };
      recorder.stop();
    });
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);

      setSaving(true);
      try {
        const blob = await stopRecording();
        const buffer = await blob.arrayBuffer();
        const res = await window.lostarkAPI.meetingSaveAudio(id!, buffer);
        if (res.success) {
          showToast('녹음이 저장되었습니다.');
          navigate(`/meeting/${id}`);
        } else {
          showToast(res.message ?? '저장 실패', 'error');
        }
      } finally {
        setSaving(false);
      }
    } else {
      await startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className={style.detailPage}>
      <button className={style.backBtn} onClick={() => navigate(`/meeting/${id}`)}>
        <FiArrowLeft size={14} /> 돌아가기
      </button>

      <h2 className={style.pageTitle} style={{ margin: 0 }}>
        {meeting?.title ?? '회의 녹음'}
      </h2>

      <div className={style.recordingSection}>
        {isRecording && (
          <div className={style.recordingTimer}>
            <span className={style.recordingDot} />
            {formatTime(elapsed)}
          </div>
        )}

        <button
          className={`${style.recordBtn} ${isRecording ? style.recording : ''}`}
          onClick={handleToggleRecording}
          disabled={saving}
          title={isRecording ? '녹음 중지 & 저장' : '녹음 시작'}
        >
          {isRecording ? <FiMicOff size={28} color="#e05555" /> : <FiMic size={28} color="#4f8ef7" />}
        </button>

        <div className={style.recordingLabel}>
          {saving
            ? '저장 중...'
            : isRecording
            ? '버튼을 다시 누르면 녹음이 중지되고 저장됩니다.'
            : '버튼을 눌러 녹음을 시작하세요.'}
        </div>

        {!isRecording && elapsed > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#5fcf5f', fontSize: 14 }}>
            <FiSave size={14} /> {formatTime(elapsed)} 녹음 완료
          </div>
        )}
      </div>

      {toast && (
        <div className={`${style.toast} ${toast.type === 'error' ? style.toastError : style.toastSuccess}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default RecordingPage;
