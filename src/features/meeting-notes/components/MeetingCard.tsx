import { Meeting } from '../../../types/electron';
import { FiTrash2, FiFileText } from 'react-icons/fi';
import style from '../style/MeetingNotes.module.css';

interface Props {
  meeting: Meeting;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const STATUS_LABEL: Record<Meeting['status'], string> = {
  draft: '작성 중',
  recorded: '녹음 완료',
  processing: 'AI 처리 중',
  done: '완료',
  error: '오류',
};

const STATUS_CLASS: Record<Meeting['status'], string> = {
  draft: style.statusDraft,
  recorded: style.statusRecorded,
  processing: style.statusProcessing,
  done: style.statusDone,
  error: style.statusError,
};

const MeetingCard = ({ meeting, onClick, onDelete }: Props) => {
  const date = new Date(meeting.date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className={style.card} onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 className={style.cardTitle}>{meeting.title}</h3>
        <span className={`${style.statusBadge} ${STATUS_CLASS[meeting.status]}`}>
          {STATUS_LABEL[meeting.status]}
        </span>
      </div>

      <div className={style.cardMeta}>
        <span>{date}</span>
        {meeting.participants.length > 0 && (
          <span>참석자 {meeting.participants.length}명</span>
        )}
      </div>

      {meeting.summary && (
        <p style={{ fontSize: 12, color: '#777', margin: 0, lineHeight: 1.5 }}>
          {meeting.summary.slice(0, 80)}…
        </p>
      )}

      <div className={style.cardActions}>
        <button
          className={style.btnSecondary}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <FiFileText size={13} /> 열기
        </button>
        <button className={style.btnDanger} onClick={onDelete}>
          <FiTrash2 size={12} />
        </button>
      </div>
    </div>
  );
};

export default MeetingCard;
