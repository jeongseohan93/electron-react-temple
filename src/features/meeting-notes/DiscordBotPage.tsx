import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiWifi, FiWifiOff, FiMic, FiMicOff, FiRefreshCw } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import { DiscordGuild, DiscordChannel, DiscordBotStatus } from '../../types/electron';
import style from './style/MeetingNotes.module.css';

type Step = 'connect' | 'select' | 'recording';

const DiscordBotPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('connect');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<DiscordBotStatus>({ connected: false, recording: false });
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [selectedGuild, setSelectedGuild] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [meetings, setMeetings] = useState<{ id: string; title: string }[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Subscribe to status changes from main process
  useEffect(() => {
    window.lostarkAPI.discordOnStatusChange((s: DiscordBotStatus) => {
      setStatus(s);
      if (s.connected && !s.recording) setStep('select');
      if (!s.connected) setStep('connect');
    });
  }, []);

  // Check initial status and auto-connect if token saved
  useEffect(() => {
    (async () => {
      const s = await window.lostarkAPI.discordGetStatus();
      setStatus(s);
      if (s.connected) {
        setStep('select');
        await loadGuilds();
      } else if (s.hasToken) {
        const res = await window.lostarkAPI.discordAutoConnect();
        if (res.success) {
          setStatus((prev) => ({ ...prev, connected: true, botName: res.botName }));
          setStep('select');
          await loadGuilds();
        }
      }
    })();
  }, []);

  // Recording timer
  useEffect(() => {
    if (!status.recording) { setElapsedSeconds(0); return; }
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status.recording]);

  const loadGuilds = useCallback(async () => {
    const res = await window.lostarkAPI.discordGetGuilds();
    if (res.success && res.guilds) setGuilds(res.guilds);
  }, []);

  const loadChannels = useCallback(async (guildId: string) => {
    if (!guildId) { setChannels([]); return; }
    const res = await window.lostarkAPI.discordGetChannels(guildId);
    if (res.success && res.channels) setChannels(res.channels);
  }, []);

  const loadMeetings = useCallback(async () => {
    const res = await window.lostarkAPI.meetingList();
    if (res.success && res.data) {
      setMeetings(res.data.map((m) => ({ id: m.id, title: m.title })));
    }
  }, []);

  useEffect(() => {
    if (step === 'select') {
      loadGuilds();
      loadMeetings();
    }
  }, [step, loadGuilds, loadMeetings]);

  useEffect(() => {
    loadChannels(selectedGuild);
    setSelectedChannel('');
  }, [selectedGuild, loadChannels]);

  const handleConnect = async () => {
    if (!token.trim()) { showToast('봇 토큰을 입력해주세요.', 'error'); return; }
    setLoading(true);
    const res = await window.lostarkAPI.discordConnect(token.trim());
    setLoading(false);
    if (res.success) {
      setStatus((prev) => ({ ...prev, connected: true, botName: res.botName }));
      setStep('select');
      showToast(`${res.botName ?? '봇'} 연결됨`);
    } else {
      showToast(res.message ?? '연결 실패', 'error');
    }
  };

  const handleDisconnect = async () => {
    await window.lostarkAPI.discordDisconnect();
    setStatus({ connected: false, recording: false });
    setStep('connect');
    setGuilds([]);
    setChannels([]);
    showToast('봇 연결 해제됨');
  };

  const handleStartRecording = async () => {
    if (!selectedGuild) { showToast('서버를 선택해주세요.', 'error'); return; }
    if (!selectedChannel) { showToast('채널을 선택해주세요.', 'error'); return; }

    let meetingId = selectedMeeting;

    if (!meetingId) {
      const title = newMeetingTitle.trim() || `Discord 회의 ${new Date().toLocaleDateString('ko-KR')}`;
      const res = await window.lostarkAPI.meetingCreate({ title, participants: [] });
      if (!res.success || !res.data) { showToast('회의록 생성 실패', 'error'); return; }
      meetingId = res.data.id;
      setSelectedMeeting(meetingId);
    }

    setLoading(true);
    const res = await window.lostarkAPI.discordStartRecording(selectedGuild, selectedChannel, meetingId);
    setLoading(false);

    if (res.success) {
      setStatus((prev) => ({ ...prev, recording: true }));
      setStep('recording');
      showToast('녹음 시작됨');
    } else {
      showToast(res.message ?? '녹음 시작 실패', 'error');
    }
  };

  const handleStopRecording = async () => {
    if (!selectedMeeting) return;
    setLoading(true);
    const res = await window.lostarkAPI.discordStopRecording(selectedMeeting);
    setLoading(false);

    if (res.success) {
      setStatus((prev) => ({ ...prev, recording: false }));
      setStep('select');
      showToast('녹음 완료! 회의록에서 AI 파이프라인을 실행하세요.');
      navigate(`/meeting/${selectedMeeting}`);
    } else {
      showToast(res.message ?? '녹음 중지 실패', 'error');
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={style.detailPage}>
      {/* Header */}
      <div className={style.pageHeader}>
        <button className={style.backBtn} onClick={() => navigate('/meeting')}>
          <FiArrowLeft /> 목록으로
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaDiscord style={{ color: '#5865F2', fontSize: 22 }} />
          <h2 className={style.pageTitle} style={{ margin: 0 }}>Discord 봇 녹음</h2>
        </div>
        {status.connected && (
          <button className={style.btnDanger} onClick={handleDisconnect}>
            <FiWifiOff style={{ marginRight: 4 }} /> 연결 해제
          </button>
        )}
      </div>

      {/* ── STEP 1: Connect ──────────────────────────────── */}
      {step === 'connect' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
          <p style={{ color: '#aaa', fontSize: 14, margin: 0 }}>
            Discord 봇 토큰을 입력하여 연결합니다. 봇은 음성 채널에 참가해 대화를 녹음합니다.
          </p>
          <label style={{ color: '#ccc', fontSize: 13 }}>
            봇 토큰
            <input
              type="password"
              className={style.input}
              placeholder="Discord Bot Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              style={{ marginTop: 6 }}
            />
          </label>
          <p style={{ color: '#666', fontSize: 12, margin: 0 }}>
            토큰은 로컬 DB에만 저장되며 외부로 전송되지 않습니다.
          </p>
          <button
            className={style.btnPrimary}
            onClick={handleConnect}
            disabled={loading || !token.trim()}
            style={{ alignSelf: 'flex-start' }}
          >
            {loading ? <><span className={style.spinner} />연결 중...</> : <><FiWifi style={{ marginRight: 4 }} />봇 연결</>}
          </button>
        </div>
      )}

      {/* ── STEP 2: Select guild / channel / meeting ─────── */}
      {step === 'select' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 540 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiWifi style={{ color: '#5fcf5f' }} />
            <span style={{ color: '#5fcf5f', fontSize: 14 }}>
              {status.botName ?? '봇'} 연결됨
            </span>
            <button className={style.btnSecondary} style={{ marginLeft: 'auto', fontSize: 12, padding: '5px 10px' }} onClick={loadGuilds}>
              <FiRefreshCw style={{ marginRight: 4 }} />새로고침
            </button>
          </div>

          {/* Guild selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: '#aaa', fontSize: 13 }}>서버 선택</label>
            <select
              value={selectedGuild}
              onChange={(e) => setSelectedGuild(e.target.value)}
              className={style.input}
            >
              <option value="">-- 서버 선택 --</option>
              {guilds.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {/* Channel selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: '#aaa', fontSize: 13 }}>음성 채널 선택</label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className={style.input}
              disabled={!selectedGuild}
            >
              <option value="">-- 채널 선택 --</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.memberCount > 0 ? `(${c.memberCount}명)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Meeting selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: '#aaa', fontSize: 13 }}>회의록 연결</label>
            <select
              value={selectedMeeting}
              onChange={(e) => setSelectedMeeting(e.target.value)}
              className={style.input}
            >
              <option value="">-- 새 회의록 생성 --</option>
              {meetings.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            {!selectedMeeting && (
              <input
                type="text"
                className={style.input}
                placeholder="새 회의록 제목 (비우면 자동 생성)"
                value={newMeetingTitle}
                onChange={(e) => setNewMeetingTitle(e.target.value)}
              />
            )}
          </div>

          <button
            className={style.btnPrimary}
            onClick={handleStartRecording}
            disabled={loading || !selectedGuild || !selectedChannel}
            style={{ alignSelf: 'flex-start' }}
          >
            {loading
              ? <><span className={style.spinner} />준비 중...</>
              : <><FiMic style={{ marginRight: 4 }} />녹음 시작</>}
          </button>
        </div>
      )}

      {/* ── STEP 3: Recording ────────────────────────────── */}
      {step === 'recording' && (
        <div className={style.recordingSection}>
          <div className={style.recordingTimer}>{formatTime(elapsedSeconds)}</div>
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: 14 }}>
            {status.guildName && status.channelName && (
              <span>{status.guildName} / {status.channelName}</span>
            )}
          </div>
          <div className={style.recordingLabel}>
            <span className={style.recordingDot} />
            Discord 음성 채널 녹음 중
          </div>
          <button
            className={`${style.recordBtn} ${style.recording}`}
            onClick={handleStopRecording}
            disabled={loading}
            title="녹음 중지"
          >
            {loading ? <span className={style.spinner} /> : <FiMicOff />}
          </button>
          <p style={{ color: '#666', fontSize: 13, margin: 0 }}>버튼을 눌러 녹음을 종료합니다</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${style.toast} ${toast.type === 'success' ? style.toastSuccess : style.toastError}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default DiscordBotPage;
