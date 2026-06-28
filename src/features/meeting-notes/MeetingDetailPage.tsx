import { useEffect, useState, KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Meeting } from '../../types/electron';
import {
  FiArrowLeft, FiMic, FiZap, FiFileText,
  FiBookOpen, FiPlus, FiSave,
} from 'react-icons/fi';
import style from './style/MeetingNotes.module.css';

type Tab = 'raw' | 'cleaned' | 'summary';

const TAB_INFO: { key: Tab; label: string }[] = [
  { key: 'raw', label: '원본 텍스트' },
  { key: 'cleaned', label: '교정된 내용' },
  { key: 'summary', label: '요약' },
];

const MeetingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [tab, setTab] = useState<Tab>('raw');
  const [editing, setEditing] = useState<Partial<Meeting>>({});
  const [participantInput, setParticipantInput] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!id) return;
    window.lostarkAPI.meetingGet(id).then((res) => {
      if (res.success && res.data) {
        setMeeting(res.data);
        setEditing({
          title: res.data.title,
          participants: [...res.data.participants],
          rawTranscript: res.data.rawTranscript,
          cleanedText: res.data.cleanedText,
          summary: res.data.summary,
        });
      }
    });
  }, [id]);

  const save = async (patch?: Partial<Meeting>) => {
    if (!id) return;
    const data = { ...editing, ...patch };
    const res = await window.lostarkAPI.meetingUpdate(id, data);
    if (res.success && res.data) {
      setMeeting(res.data);
      showToast('저장되었습니다.');
    } else {
      showToast(res.message ?? '저장 실패', 'error');
    }
  };

  const handleAddParticipant = () => {
    const name = participantInput.trim();
    if (!name || editing.participants?.includes(name)) return;
    setEditing((prev) => ({ ...prev, participants: [...(prev.participants ?? []), name] }));
    setParticipantInput('');
  };

  const handleRemoveParticipant = (name: string) => {
    setEditing((prev) => ({ ...prev, participants: prev.participants?.filter((p) => p !== name) }));
  };

  const handlePKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddParticipant();
  };

  const runWithLoading = async (label: string, fn: () => Promise<{ success: boolean; data?: Meeting; message?: string }>) => {
    setLoading(label);
    try {
      const res = await fn();
      if (res.success && res.data) {
        setMeeting(res.data);
        setEditing({
          title: res.data.title,
          participants: [...res.data.participants],
          rawTranscript: res.data.rawTranscript,
          cleanedText: res.data.cleanedText,
          summary: res.data.summary,
        });
        showToast(`${label} 완료`);
      } else {
        showToast(res.message ?? `${label} 실패`, 'error');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleExport = async (type: 'word' | 'markdown') => {
    if (!id) return;
    setLoading(type === 'word' ? 'Word 내보내기' : 'Obsidian 내보내기');
    try {
      const res = type === 'word'
        ? await window.lostarkAPI.meetingExportWord(id)
        : await window.lostarkAPI.meetingExportMarkdown(id);
      if (res.success) {
        showToast(`${type === 'word' ? 'Word' : 'Markdown'} 파일이 저장되었습니다.`);
      } else {
        showToast(res.message ?? '내보내기 실패', 'error');
      }
    } finally {
      setLoading(null);
    }
  };

  if (!meeting) return <div className={style.page} style={{ color: '#888' }}>불러오는 중...</div>;

  return (
    <div className={style.detailPage}>
      {/* 상단 */}
      <button className={style.backBtn} onClick={() => navigate('/meeting')}>
        <FiArrowLeft size={14} /> 회의록 목록
      </button>

      <input
        className={style.detailTitle}
        value={editing.title ?? ''}
        onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))}
        onBlur={() => save()}
      />

      {/* 날짜 & 참석자 */}
      <div className={style.metaRow}>
        <span>
          {new Date(meeting.date).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </span>
        <span style={{ color: '#555' }}>|</span>
        <div className={style.participantChips}>
          {(editing.participants ?? []).map((p) => (
            <span key={p} className={style.chip}>
              {p}
              <button className={style.chipRemove} onClick={() => handleRemoveParticipant(p)}>✕</button>
            </span>
          ))}
          <div className={style.chipInput}>
            <input
              placeholder="참석자 추가"
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              onKeyDown={handlePKeyDown}
            />
            <button className={style.btnSecondary} style={{ padding: '4px 8px' }} onClick={handleAddParticipant}>
              <FiPlus size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* 녹음 & AI 액션 */}
      <div className={style.actionBar}>
        <button
          className={style.btnSecondary}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => navigate(`/meeting/${id}/record`)}
        >
          <FiMic size={14} /> 녹음하기
        </button>

        <button
          className={style.btnSecondary}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={!!loading || !meeting.audioPath}
          onClick={() => runWithLoading('AI 파이프라인', () => window.lostarkAPI.meetingRunAIPipeline(id!))}
          title={!meeting.audioPath ? '먼저 녹음이 필요합니다' : 'STT → 교정 → 요약 전체 실행'}
        >
          {loading === 'AI 파이프라인' ? <><span className={style.spinner} /> 처리 중...</> : <><FiZap size={14} /> AI 전체 처리</>}
        </button>

        <button
          className={style.btnSecondary}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={!!loading || !meeting.rawTranscript}
          onClick={() => runWithLoading('문맥 교정', () => window.lostarkAPI.meetingCleanText(id!))}
        >
          {loading === '문맥 교정' ? <><span className={style.spinner} /> 처리 중...</> : '문맥 교정'}
        </button>

        <button
          className={style.btnSecondary}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={!!loading || (!meeting.cleanedText && !meeting.rawTranscript)}
          onClick={() => runWithLoading('요약', () => window.lostarkAPI.meetingSummarize(id!))}
        >
          {loading === '요약' ? <><span className={style.spinner} /> 처리 중...</> : '요약'}
        </button>

        <div style={{ flex: 1 }} />

        <button
          className={style.btnSecondary}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={!!loading}
          onClick={() => handleExport('word')}
        >
          {loading === 'Word 내보내기' ? <><span className={style.spinner} /> 처리 중...</> : <><FiFileText size={14} /> Word 저장</>}
        </button>

        <button
          className={style.btnSecondary}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={!!loading}
          onClick={() => handleExport('markdown')}
        >
          {loading === 'Obsidian 내보내기' ? <><span className={style.spinner} /> 처리 중...</> : <><FiBookOpen size={14} /> Obsidian 저장</>}
        </button>
      </div>

      {/* 탭 */}
      <div className={style.tabs}>
        {TAB_INFO.map((t) => (
          <button
            key={t.key}
            className={`${style.tab} ${tab === t.key ? style.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 텍스트 에디터 */}
      {tab === 'raw' && (
        <textarea
          className={style.textarea}
          placeholder="녹음 후 AI 처리를 하거나, 여기에 직접 텍스트를 붙여넣으세요."
          value={editing.rawTranscript ?? ''}
          onChange={(e) => setEditing((prev) => ({ ...prev, rawTranscript: e.target.value }))}
          onBlur={() => save()}
        />
      )}
      {tab === 'cleaned' && (
        <textarea
          className={style.textarea}
          placeholder="AI 문맥 교정 결과가 여기에 표시됩니다. 직접 편집도 가능합니다."
          value={editing.cleanedText ?? ''}
          onChange={(e) => setEditing((prev) => ({ ...prev, cleanedText: e.target.value }))}
          onBlur={() => save()}
        />
      )}
      {tab === 'summary' && (
        <textarea
          className={style.textarea}
          placeholder="AI 요약 결과가 여기에 표시됩니다. 직접 편집도 가능합니다."
          value={editing.summary ?? ''}
          onChange={(e) => setEditing((prev) => ({ ...prev, summary: e.target.value }))}
          onBlur={() => save()}
        />
      )}

      {/* 수동 저장 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className={style.btnPrimary}
          onClick={() => save()}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FiSave size={14} /> 저장
        </button>
      </div>

      {toast && (
        <div className={`${style.toast} ${toast.type === 'error' ? style.toastError : style.toastSuccess}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default MeetingDetailPage;
