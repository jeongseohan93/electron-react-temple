import { useState, KeyboardEvent } from 'react';
import style from '../style/MeetingNotes.module.css';

interface Props {
  onConfirm: (title: string, participants: string[]) => void;
  onClose: () => void;
}

const CreateMeetingModal = ({ onConfirm, onClose }: Props) => {
  const [title, setTitle] = useState('');
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);

  const addParticipant = () => {
    const name = participantInput.trim();
    if (name && !participants.includes(name)) {
      setParticipants((prev) => [...prev, name]);
    }
    setParticipantInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addParticipant();
  };

  const removeParticipant = (name: string) => {
    setParticipants((prev) => prev.filter((p) => p !== name));
  };

  const handleConfirm = () => {
    if (!title.trim()) return;
    onConfirm(title.trim(), participants);
  };

  return (
    <div className={style.modalOverlay} onClick={onClose}>
      <div className={style.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={style.modalTitle}>새 회의록 만들기</h3>

        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>회의 제목</div>
          <input
            className={style.input}
            placeholder="예) 2024년 1분기 전략 회의"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>참석자 (Enter로 추가)</div>
          <div className={style.chipInput}>
            <input
              className={style.input}
              placeholder="이름 입력 후 Enter"
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1, width: 'auto' }}
            />
            <button className={style.btnSecondary} onClick={addParticipant}>추가</button>
          </div>
          <div className={style.participantChips} style={{ marginTop: 8 }}>
            {participants.map((p) => (
              <span key={p} className={style.chip}>
                {p}
                <button className={style.chipRemove} onClick={() => removeParticipant(p)}>✕</button>
              </span>
            ))}
          </div>
        </div>

        <div className={style.modalActions}>
          <button className={style.btnSecondary} onClick={onClose}>취소</button>
          <button className={style.btnPrimary} onClick={handleConfirm} disabled={!title.trim()}>
            만들기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMeetingModal;
